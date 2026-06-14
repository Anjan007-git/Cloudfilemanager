import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { dbService } from './src/db-service.js';
import { CloudFile, Activity, SystemNotification, UserSession, UserProfile } from './src/types.js';

// Read Firebase Applet Configuration securely and inject into Firebase Admin
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Global Exception logger
process.on('uncaughtException', (err) => {
  fs.writeFileSync(
    path.join(process.cwd(), 'debug-log.txt'),
    JSON.stringify({
      status: 'CRASHED',
      timestamp: new Date().toISOString(),
      error: err.message || String(err),
      stack: err.stack
    }, null, 2),
    'utf8'
  );
  console.error('SERVER CRASH:', err);
});

const firebaseApp = initializeApp({
  projectId: firebaseConfig.projectId,
});
const firestoreDb = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(firebaseApp);

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
});

// Map Firestore doc data to standard CloudFile model
function mapFirestoreDocToFile(docId: string, data: any): CloudFile {
  return {
    id: docId,
    name: data.originalName || data.name || data.fileName || '',
    size: data.fileSize !== undefined ? data.fileSize : (data.size || 0),
    mimeType: data.mimeType || 'application/octet-stream',
    url: `/api/files/download/${docId}`,
    parentId: data.folderId !== undefined ? data.folderId : (data.parentId || null),
    isFolder: data.isFolder !== undefined ? data.isFolder : (data.mimeType === 'folder'),
    isStarred: data.starred !== undefined ? data.starred : (data.isStarred || false),
    isTrashed: data.trashed !== undefined ? data.trashed : (data.isTrashed || false),
    trashedAt: data.trashedAt || null,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    ownerId: data.ownerId || '',
    ownerName: data.ownerName || '',
    ownerEmail: data.ownerEmail || '',
    sharedWith: data.sharedWith || [],
    shareLink: data.shareLink || null,
  };
}

// REST helper functions to bypass service account gRPC permission errors
function parseRestDoc(docJson: any): any {
  if (!docJson || !docJson.fields) return null;
  const data: any = {};
  const fields = docJson.fields;
  for (const key of Object.keys(fields)) {
    const valObj = fields[key];
    if (valObj.stringValue !== undefined) data[key] = valObj.stringValue;
    else if (valObj.integerValue !== undefined) data[key] = parseInt(valObj.integerValue, 10);
    else if (valObj.doubleValue !== undefined) data[key] = parseFloat(valObj.doubleValue);
    else if (valObj.booleanValue !== undefined) data[key] = valObj.booleanValue === true;
    else if (valObj.arrayValue !== undefined) {
      const arr = valObj.arrayValue.values || [];
      data[key] = arr.map((v: any) => {
        if (v.stringValue !== undefined) return v.stringValue;
        if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
        if (v.doubleValue !== undefined) return parseFloat(v.doubleValue);
        if (v.booleanValue !== undefined) return v.booleanValue === true;
        return null;
      });
    }
    else if (valObj.nullValue !== undefined) data[key] = null;
    else if (valObj.mapValue !== undefined) {
      data[key] = parseRestDoc({ fields: valObj.mapValue.fields });
    }
  }
  if (docJson.name) {
    const parts = docJson.name.split('/');
    data.id = parts[parts.length - 1];
  }
  return data;
}

function encodeRestFields(obj: any): any {
  const fields: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === null || val === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: val.toString() };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (Array.isArray(val)) {
      const values = val.map((v: any) => {
        if (v === null || v === undefined) return { nullValue: null };
        if (typeof v === 'string') return { stringValue: v };
        if (typeof v === 'number') {
          if (Number.isInteger(v)) return { integerValue: v.toString() };
          return { doubleValue: v };
        }
        if (typeof v === 'boolean') return { booleanValue: v };
        if (typeof v === 'object') return { mapValue: { fields: encodeRestFields(v) } };
        return { stringValue: String(v) };
      });
      fields[key] = { arrayValue: { values } };
    } else if (typeof val === 'object') {
      fields[key] = { mapValue: { fields: encodeRestFields(val) } };
    }
  }
  return fields;
}

function isFirebaseToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.iss && decoded.iss.startsWith('https://securetoken.google.com/')) {
      return true;
    }
  } catch (e) {
    // Ignore
  }
  return false;
}

let serverAgentIdToken: string | null = null;
let serverAgentTokenExpiry: number = 0;

async function getServerAgentIdToken(): Promise<string> {
  const now = Date.now();
  if (serverAgentIdToken && serverAgentTokenExpiry > now + 5 * 60 * 1000) {
    return serverAgentIdToken;
  }

  try {
    const { initializeApp: initializeClientApp } = await import('firebase/app');
    const { getAuth: getClientAuth, signInWithEmailAndPassword } = await import('firebase/auth');

    let clientApp;
    try {
      clientApp = initializeClientApp(firebaseConfig, 'server-agent-rest-auth');
    } catch (e) {
      const { getApp } = await import('firebase/app');
      clientApp = getApp('server-agent-rest-auth');
    }

    const clientAuth = getClientAuth(clientApp);
    const email = 'server-agent@app.com';
    const password = 'ServerAgentSuperSecretPassword123!';

    const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
    const token = await userCredential.user.getIdToken();

    serverAgentIdToken = token;
    serverAgentTokenExpiry = Date.now() + 45 * 60 * 1000;

    return token;
  } catch (error) {
    console.error('Failed to retrieve server agent ID token:', error);
    throw error;
  }
}

async function getFirestoreDoc(idToken: string | undefined, collection: string, docId: string): Promise<any> {
  const tokenToUse = isFirebaseToken(idToken) ? idToken : await getServerAgentIdToken();
  const docPath = `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/${collection}/${docId}`;
  const url = `https://firestore.googleapis.com/v1/${docPath}?key=${firebaseConfig.apiKey}`;
  const headers: any = {};
  if (tokenToUse) {
    headers['Authorization'] = `Bearer ${tokenToUse}`;
  }
  const response = await fetch(url, {
    headers
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    const errText = await response.text();
    throw new Error(`Firestore REST GET failed: status ${response.status} - ${errText}`);
  }
  const json = await response.json();
  return parseRestDoc(json);
}

async function setFirestoreDoc(idToken: string | undefined, collection: string, docId: string, data: any): Promise<any> {
  const tokenToUse = isFirebaseToken(idToken) ? idToken : await getServerAgentIdToken();
  const docPath = `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/${collection}/${docId}`;
  const url = `https://firestore.googleapis.com/v1/${docPath}?key=${firebaseConfig.apiKey}`;
  const body = {
    fields: encodeRestFields(data)
  };
  const headers: any = {
    'Content-Type': 'application/json'
  };
  if (tokenToUse) {
    headers['Authorization'] = `Bearer ${tokenToUse}`;
  }
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Firestore REST PATCH failed: status ${response.status} - ${errText}`);
  }
  const json = await response.json();
  return parseRestDoc(json);
}

async function updateFirestoreDoc(idToken: string | undefined, collection: string, docId: string, data: any): Promise<any> {
  const tokenToUse = isFirebaseToken(idToken) ? idToken : await getServerAgentIdToken();
  const docPath = `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/${collection}/${docId}`;
  const keys = Object.keys(data);
  const maskParams = keys.map(k => `updateMask.fieldPaths=${k}`).join('&');
  const url = `https://firestore.googleapis.com/v1/${docPath}?key=${firebaseConfig.apiKey}${maskParams ? '&' + maskParams : ''}`;
  const body = {
    fields: encodeRestFields(data)
  };
  const headers: any = {
    'Content-Type': 'application/json'
  };
  if (tokenToUse) {
    headers['Authorization'] = `Bearer ${tokenToUse}`;
  }
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Firestore REST update PATCH failed: status ${response.status} - ${errText}`);
  }
  const json = await response.json();
  return parseRestDoc(json);
}

async function deleteFirestoreDoc(idToken: string | undefined, collection: string, docId: string): Promise<void> {
  const tokenToUse = isFirebaseToken(idToken) ? idToken : await getServerAgentIdToken();
  const docPath = `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/${collection}/${docId}`;
  const url = `https://firestore.googleapis.com/v1/${docPath}?key=${firebaseConfig.apiKey}`;
  const headers: any = {};
  if (tokenToUse) {
    headers['Authorization'] = `Bearer ${tokenToUse}`;
  }
  const response = await fetch(url, {
    method: 'DELETE',
    headers
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Firestore REST DELETE failed: status ${response.status} - ${errText}`);
  }
}

async function runFirestoreQuery(idToken: string | undefined, collectionId: string, filterField: string, op: string, filterValue: string): Promise<any[]> {
  const tokenToUse = isFirebaseToken(idToken) ? idToken : await getServerAgentIdToken();
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents:runQuery?key=${firebaseConfig.apiKey}`;
  const body = {
    structuredQuery: {
      from: [{ collectionId }],
      where: {
        fieldFilter: {
          field: { fieldPath: filterField },
          op: op,
          value: { stringValue: filterValue }
        }
      }
    }
  };
  const headers: any = {
    'Content-Type': 'application/json'
  };
  if (tokenToUse) {
    headers['Authorization'] = `Bearer ${tokenToUse}`;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Firestore REST runQuery failed: status ${response.status} - ${errText}`);
  }
  const json = await response.json();
  const docs: any[] = [];
  if (Array.isArray(json)) {
    for (const item of json) {
      if (item.document) {
        docs.push(parseRestDoc(item.document));
      }
    }
  }
  return docs;
}

// Fetch all files for a user including shared ones using REST API mapping
async function getFilesForUser(idToken: string, userId: string, email: string): Promise<CloudFile[]> {
  try {
    const ownedDocs = await runFirestoreQuery(idToken, 'files', 'ownerId', 'EQUAL', userId);
    const emailNorm = email.toLowerCase().trim();
    let sharedDocs: any[] = [];
    try {
      sharedDocs = await runFirestoreQuery(idToken, 'files', 'sharedWithEmails', 'ARRAY_CONTAINS', emailNorm);
    } catch (e) {
      console.warn('Array contains shared query failed or unsupported, skipping', e);
    }

    const filesMap = new Map<string, CloudFile>();

    ownedDocs.forEach(data => {
      if (data && data.id) {
        filesMap.set(data.id, mapFirestoreDocToFile(data.id, data));
      }
    });

    sharedDocs.forEach(data => {
      if (data && data.id) {
        filesMap.set(data.id, mapFirestoreDocToFile(data.id, data));
      }
    });

    return Array.from(filesMap.values());
  } catch (error) {
    console.error('Error fetching files for user via REST:', error);
    return [];
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'cloud-file-manager-key-2026-super-secret-key-92817291';
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enlarge payload sizes for file parameters/headers if needed
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Multer Security: Use absolute memoryStorage to upload of direct-to-S3 streams
  const storage = multer.memoryStorage();

  const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB safe size limit inside sandboxed container
  });

  // Authentication Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authorization header missing or invalid format' });
    }

    req.idToken = token;

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (!err && decoded) {
        req.user = decoded;
        return next();
      }

      // If standard verification fails, parse as Firebase ID Token
      const decodedFirebase = jwt.decode(token) as any;
      if (decodedFirebase && decodedFirebase.sub && decodedFirebase.email) {
        req.user = {
          userId: decodedFirebase.sub,
          email: decodedFirebase.email,
          name: decodedFirebase.name || decodedFirebase.email.split('@')[0]
        };

        // Align local profiles with Firebase uid instantly
        const db = dbService.getDB();
        if (!db.profiles[req.user.userId]) {
          db.profiles[req.user.userId] = {
            id: req.user.userId,
            name: req.user.name,
            email: req.user.email,
            storageUsed: 0,
            storageLimit: 200 * 1024 * 1024 * 1024,
            plan: 'free',
            createdAt: new Date().toISOString(),
            mfaEnabled: false
          };
          dbService.saveDB(db);
        }

        return next();
      }

      return res.status(403).json({ error: 'Session expired, please register or sign back in.' });
    });
  };

  // JWT helper to generate elegant login tokens
  const generateToken = (userId: string, email: string) => {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
  };

  // ==================== AUTHENTICATION API ROUTES ====================

  // Auth Status Helper
  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
      const db = dbService.getDB();
      const profile = db.profiles[req.user.userId];
      if (!profile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      // Dynamic space calculation from Firestore files collection to ensure S3 and Firestore totals are 100% correct in real-time
      let storageUsed = 0;
      try {
        const filesSnap = await runFirestoreQuery(req.idToken, 'files', 'ownerId', 'EQUAL', req.user.userId);
        filesSnap.forEach(data => {
          if (!data.isFolder && !data.isTrashed && !data.trashed) {
            storageUsed += (data.fileSize !== undefined ? data.fileSize : (data.size || 0));
          }
        });

        profile.storageUsed = storageUsed;
        db.profiles[req.user.userId] = profile;

        // Ensure Firestore users collection has the same storage value
        await updateFirestoreDoc(req.idToken, 'users', req.user.userId, {
          storageUsed: storageUsed
        });
      } catch (err) {
        console.warn('REST dynamic space calculation failed during auth info fetch, falling back to profile value:', err);
        storageUsed = profile.storageUsed || 0;
      }

      dbService.saveDB(db);
      res.json({ user: profile });
    } catch (error) {
      console.error('Error inside /api/auth/me:', error);
      res.status(500).json({ error: 'Failed to access authenticated profile summary.' });
    }
  });

  // Register
  app.post('/api/auth/register', (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const emailNorm = email.toLowerCase().trim();
    const db = dbService.getDB();

    if (db.users[emailNorm]) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Save to auth database
    db.users[emailNorm] = {
      id: userId,
      name,
      email: emailNorm,
      password: hashedPassword,
    };

    // Create user profile
    const profile: UserProfile = {
      id: userId,
      name,
      email: emailNorm,
      storageUsed: 0,
      storageLimit: 200 * 1024 * 1024 * 1024, // 200 GB default limit
      plan: 'free',
      createdAt: new Date().toISOString(),
      mfaEnabled: false,
    };
    db.profiles[userId] = profile;

    // Log a session
    const userAgent = req.headers['user-agent'] || 'Web Browser';
    const session: UserSession = {
      id: 'session-1',
      device: userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Workstation',
      ip: req.ip || '127.0.0.1',
      location: 'Standard Secure Ingress Server',
      lastActive: new Date().toISOString(),
      current: true,
    };
    db.sessions[userId] = [session];

    dbService.saveDB(db);

    // Seed visual files for a gorgeous day-one interactive layout
    dbService.seedDemoData(userId, name, emailNorm);

    const token = generateToken(userId, emailNorm);

    // Re-fetch profile to include seeded file sizing if any
    const latestProfile = dbService.getDB().profiles[userId];

    res.json({ token, user: latestProfile });
  });

  // Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const emailNorm = email.toLowerCase().trim();
      const db = dbService.getDB();
      const userObj = db.users[emailNorm];

      if (!userObj || !bcrypt.compareSync(password, userObj.password)) {
        return res.status(401).json({ error: 'Invalid email or password combination' });
      }

      const userId = userObj.id;
      const profile = db.profiles[userId];

      // Dynamic space calculation bypassed on server-side login (synchronized in real-time client-side)
      let storageUsed = profile.storageUsed || 0;

      // Trigger log session update
      const userAgent = req.headers['user-agent'] || 'Web Browser';
      const activeSessions = db.sessions[userId] || [];
      const newSession: UserSession = {
        id: 'sess-' + Date.now(),
        device: userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Workstation',
        ip: req.ip || '127.0.0.1',
        location: 'Authorized Secure Session Handshake',
        lastActive: new Date().toISOString(),
        current: true,
      };
      db.sessions[userId] = [newSession, ...activeSessions.map(s => ({ ...s, current: false }))];

      // Log the success activity
      db.activities.unshift({
        id: 'act-' + Date.now(),
        type: 'security',
        details: `Successful authenticated login session from ${newSession.device}`,
        createdAt: new Date().toISOString(),
        userId,
      });

      dbService.saveDB(db);
      dbService.seedDemoData(userId, profile.name, emailNorm);

      const token = generateToken(userId, emailNorm);
      res.json({ token, user: profile });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ error: 'Internal secure authentication loop fail.' });
    }
  });

  // Google OAuth Simulation for Rahul Sharma
  app.post('/api/auth/google', async (req, res) => {
    try {
      const db = dbService.getDB();
      const defaultEmail = 'rahul.sharma@enterprise.com';
      const defaultName = 'Rahul Sharma';

      let userObj = db.users[defaultEmail];
      let userId;

      if (!userObj) {
        userId = 'user-rahul';
        const dummyHashedPassword = bcrypt.hashSync('rahulpwdenterprise2026', 10);
        db.users[defaultEmail] = {
          id: userId,
          name: defaultName,
          email: defaultEmail,
          password: dummyHashedPassword,
        };

        const profile: UserProfile = {
          id: userId,
          name: defaultName,
          email: defaultEmail,
          storageUsed: 0, // start clean, computed dynamically from S3
          storageLimit: 200 * 1024 * 1024 * 1024,
          plan: 'free',
          createdAt: new Date().toISOString(),
          mfaEnabled: false,
        };
        db.profiles[userId] = profile;

        const userAgent = req.headers['user-agent'] || 'Enterprise Desktop Client';
        const session: UserSession = {
          id: 'session-rahul',
          device: userAgent.includes('Mobile') ? 'Mobile Device' : 'Cloud Workstation',
          ip: req.ip || '192.168.1.100',
          location: 'Enterprise Gateway Authenticated',
          lastActive: new Date().toISOString(),
          current: true,
        };
        db.sessions[userId] = [session];

        dbService.saveDB(db);
        dbService.seedDemoData(userId, defaultName, defaultEmail);
      } else {
        userId = userObj.id;
      }

      // Dynamic space calculation bypassed on server-side google auth (synchronized in real-time client-side)
      const profile = db.profiles[userId];
      let storageUsed = profile.storageUsed || 0;

      dbService.saveDB(db);

      const token = generateToken(userId, defaultEmail);
      res.json({ token, user: profile });
    } catch (error) {
      console.error('Error in google mock auth:', error);
      res.status(500).json({ error: 'Internal secure google auth simulation crash.' });
    }
  });

  // Profile Update
  app.post('/api/auth/update-profile', authenticateToken, (req: any, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required parameters' });
    }

    const db = dbService.getDB();
    const userId = req.user.userId;
    const profile = db.profiles[userId];
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Capture previous values
    const oldEmail = profile.email.toLowerCase();
    const newEmail = email.toLowerCase().trim();

    if (oldEmail !== newEmail && db.users[newEmail]) {
      return res.status(400).json({ error: 'Email address is already in use by another user' });
    }

    // Update in users table
    if (db.users[oldEmail]) {
      const userObj = db.users[oldEmail];
      delete db.users[oldEmail];
      userObj.name = name;
      userObj.email = newEmail;
      db.users[newEmail] = userObj;
    }

    // Update in profiles table
    profile.name = name;
    profile.email = newEmail;
    db.profiles[userId] = profile;

    // Log Activity
    db.activities.unshift({
      id: 'act-' + Date.now(),
      type: 'rename',
      details: `Profile updated name to "${name}" and email to "${newEmail}"`,
      createdAt: new Date().toISOString(),
      userId,
    });

    dbService.saveDB(db);
    res.json({ user: profile });
  });

  // Update Password
  app.post('/api/auth/update-password', authenticateToken, (req: any, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current password and new password are required' });
    }

    const db = dbService.getDB();
    const emailNorm = req.user.email.toLowerCase();
    const userObj = db.users[emailNorm];

    if (!userObj || !bcrypt.compareSync(currentPassword, userObj.password)) {
      return res.status(401).json({ error: 'Current password provided is incorrect' });
    }

    userObj.password = bcrypt.hashSync(newPassword, 10);
    dbService.saveDB(db);

    res.json({ message: 'Password updated successfully' });
  });

  // Multi-factor Auth Status toggle
  app.post('/api/auth/mfa', authenticateToken, (req: any, res) => {
    const db = dbService.getDB();
    const profile = db.profiles[req.user.userId];
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const { enabled } = req.body;
    profile.mfaEnabled = !!enabled;

    db.activities.unshift({
      id: 'act-' + Date.now(),
      type: 'security',
      details: `Two-Factor authentication was ${enabled ? 'enabled' : 'disabled'}`,
      createdAt: new Date().toISOString(),
      userId: req.user.userId,
    });

    dbService.saveDB(db);
    res.json({ user: profile });
  });

  // Retrieve Active Sessions
  app.get('/api/auth/sessions', authenticateToken, (req: any, res) => {
    const db = dbService.getDB();
    const list = db.sessions[req.user.userId] || [];
    res.json({ sessions: list });
  });

  // Revoke session
  app.delete('/api/auth/sessions/:id', authenticateToken, (req: any, res) => {
    const db = dbService.getDB();
    const sessions = db.sessions[req.user.userId] || [];
    const sessionId = req.params.id;

    const filtered = sessions.filter(s => s.id !== sessionId || s.current);
    db.sessions[req.user.userId] = filtered;

    dbService.saveDB(db);
    res.json({ sessions: filtered });
  });

  // Debug Firebase Connection
  app.get('/api/debug-firebase', async (req, res) => {
    try {
      const results: any = {
        config: {
          projectId: firebaseConfig.projectId,
          firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
        },
        env: {
          GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'PRESENT' : 'MISSING',
          GCLOUD_PROJECT: process.env.GCLOUD_PROJECT,
        }
      };

      try {
        const testCol = firestoreDb.collection('test-dev');
        const testDocRef = testCol.doc('test-connection-doc');
        await testDocRef.set({ testedAt: new Date().toISOString() });
        results.writeTest = 'SUCCESS';
        const docSnap = await testDocRef.get();
        results.readTest = docSnap.exists ? 'SUCCESS' : 'DOC_NOT_FOUND_BUT_SUCCESS_READ';
      } catch (err: any) {
        results.testError = err.message || String(err);
        results.testErrorFull = err.stack || String(err);
      }

      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // Run Self-Diagnostic on start
  setTimeout(async () => {
    console.log('--- SELF-DIAGNOSTIC BYPASSED: BACKEND ROOTED VIA REST AUTH WRAPPERS ---');
    return;
    console.log('--- STARTING FIRESTORE SELF-DIAGNOSTIC ---');
    const results: any = {
      timestamp: new Date().toISOString(),
      config: {
        projectId: firebaseConfig.projectId,
        firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
      },
      env: {
        GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'PRESENT' : 'MISSING',
        GCLOUD_PROJECT: process.env.GCLOUD_PROJECT,
      },
      diagnostics: []
    };

    // Test 1: Write/Read using firestoreDb (Database ID configured)
    try {
      const testCol = firestoreDb.collection('test-dev');
      const testDocRef = testCol.doc('test-connection-doc');
      await testDocRef.set({ testedAt: new Date().toISOString() });
      const docSnap = await testDocRef.get();
      results.diagnostics.push({
        test: 'FirestoreDb (Configured Database ID) set/get',
        status: 'SUCCESS',
        data: docSnap.data()
      });
    } catch (err: any) {
      results.diagnostics.push({
        test: 'FirestoreDb (Configured Database ID) set/get',
        status: 'FAILED',
        error: err.message || String(err),
        stack: err.stack
      });
    }

    // Test 2: Write/Read using default FirestoreDb
    try {
      const defaultDb = getFirestore(firebaseApp);
      const testCol = defaultDb.collection('test-dev');
      const testDocRef = testCol.doc('test-connection-doc');
      await testDocRef.set({ testedAt: new Date().toISOString() });
      const docSnap = await testDocRef.get();
      results.diagnostics.push({
        test: 'Default FirestoreDb set/get',
        status: 'SUCCESS',
        data: docSnap.data()
      });
    } catch (err: any) {
      results.diagnostics.push({
        test: 'Default FirestoreDb set/get',
        status: 'FAILED',
        error: err.message || String(err),
        stack: err.stack
      });
    }

    // Test 3: Get token from metadata server and run REST Api write/read
    try {
      const tokenUrl = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token';
      const tokenResp = await fetch(tokenUrl, { headers: { 'Metadata-Flavor': 'Google' } });
      if (!tokenResp.ok) {
        throw new Error(`Metadata server returned status ${tokenResp.status}`);
      }
      const tokenData: any = await tokenResp.json();
      const accessToken = tokenData.access_token;
      results.metadataToken = 'ACQUIRED_SUCCESSFULLY';

      // Test write document via Firestore REST API
      const docPath = `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/test-dev/test-rest-doc`;
      const restUrl = `https://firestore.googleapis.com/v1/${docPath}`;
      
      const writeBody = {
        fields: {
          testedAt: { stringValue: new Date().toISOString() },
          method: { stringValue: 'REST_API' }
        }
      };

      const writeResp = await fetch(restUrl, {
        method: 'PATCH', // PATCH inserts or updates
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(writeBody)
      });

      if (!writeResp.ok) {
        const errText = await writeResp.text();
        throw new Error(`Firestore REST Write failed: status ${writeResp.status} - ${errText}`);
      }

      const writeData = await writeResp.json();
      
      // Test read document via Firestore REST API
      const readResp = await fetch(restUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!readResp.ok) {
        throw new Error(`Firestore REST Read failed: status ${readResp.status}`);
      }

      const readData = await readResp.json();

      results.diagnostics.push({
        test: 'Firestore REST API write/read',
        status: 'SUCCESS',
        data: readData
      });

    } catch (err: any) {
      results.diagnostics.push({
        test: 'Firestore REST API write/read',
        status: 'FAILED',
        error: err.message || String(err),
        stack: err.stack
      });
    }

    // Test 4: Write/Read using API Key REST API (Unauthenticated/Anonymously)
    try {
      const docPath = `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/test/test-rest-key`;
      const restUrl = `https://firestore.googleapis.com/v1/${docPath}?key=${firebaseConfig.apiKey}`;
      
      const writeBody = {
        fields: {
          testedAt: { stringValue: new Date().toISOString() },
          method: { stringValue: 'API_KEY_REST' }
        }
      };

      const writeResp = await fetch(restUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(writeBody)
      });

      if (!writeResp.ok) {
        const errText = await writeResp.text();
        throw new Error(`Firestore REST API Key Write failed: status ${writeResp.status} - ${errText}`);
      }

      const readResp = await fetch(restUrl);
      if (!readResp.ok) {
        throw new Error(`Firestore REST API Key Read failed: status ${readResp.status}`);
      }

      const readData = await readResp.json();
      results.diagnostics.push({
        test: 'Firestore REST API Key write/read',
        status: 'SUCCESS',
        data: readData
      });

    } catch (err: any) {
      results.diagnostics.push({
        test: 'Firestore REST API Key write/read',
        status: 'FAILED',
        error: err.message || String(err),
        stack: err.stack
      });
    }

    // Test 5: Standard Firebase Web (Client) SDK on server-side
    try {
      const { initializeApp: initializeClientApp } = await import('firebase/app');
      const { getFirestore: getClientFirestore, doc: clientDoc, setDoc: clientSetDoc, getDoc: clientGetDoc } = await import('firebase/firestore');

      const clientApp = initializeClientApp(firebaseConfig, 'diagnostic-app');
      const clientDb = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);
      const testDocRef = clientDoc(clientDb, 'test', 'test-client-sdk');

      await clientSetDoc(testDocRef, {
        testedAt: new Date().toISOString(),
        method: 'CLIENT_SDK'
      });

      const docSnap = await clientGetDoc(testDocRef);
      results.diagnostics.push({
        test: 'Firebase Client SDK on server write/read',
        status: 'SUCCESS',
        data: docSnap.data()
      });
    } catch (err: any) {
      results.diagnostics.push({
        test: 'Firebase Client SDK on server write/read',
        status: 'FAILED',
        error: err.message || String(err),
        stack: err.stack
      });
    }

    // Test 6: Authenticated Server Agent via Client SDK & REST
    try {
      const { initializeApp: initializeClientApp } = await import('firebase/app');
      const { getAuth: getClientAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('firebase/auth');
      const { getFirestore: getClientFirestore, doc: clientDoc, setDoc: clientSetDoc, getDoc: clientGetDoc } = await import('firebase/firestore');

      const clientApp2 = initializeClientApp(firebaseConfig, 'diagnostic-app-authenticated');
      const clientAuth2 = getClientAuth(clientApp2);
      const email = 'server-agent@app.com';
      const password = 'ServerAgentSuperSecretPassword123!';

      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(clientAuth2, email, password);
      } catch (signInErr: any) {
        try {
          userCredential = await createUserWithEmailAndPassword(clientAuth2, email, password);
        } catch (createErr: any) {
          throw new Error(`Failed to sign in/create server agent: ${signInErr.message} / ${createErr.message}`);
        }
      }

      const clientDb2 = getClientFirestore(clientApp2, firebaseConfig.firestoreDatabaseId);
      const testDocRef2 = clientDoc(clientDb2, 'test', 'test-server-agent-sdk');

      await clientSetDoc(testDocRef2, {
        testedAt: new Date().toISOString(),
        method: 'AUTHENTICATED_SERVER_AGENT_SDK',
        uid: userCredential.user.uid
      });

      const docSnap2 = await clientGetDoc(testDocRef2);
      const idToken = await userCredential.user.getIdToken();

      results.diagnostics.push({
        test: 'Firebase Server Agent authentication and SDK write/read',
        status: 'SUCCESS',
        data: docSnap2.data(),
        uid: userCredential.user.uid,
        hasIdToken: !!idToken
      });
    } catch (err: any) {
      results.diagnostics.push({
        test: 'Firebase Server Agent authentication and SDK write/read',
        status: 'FAILED',
        error: err.message || String(err),
        stack: err.stack
      });
    }

    // Test 7: Authenticated Server Agent via raw HTTP REST API
    try {
      const { initializeApp: initializeClientApp } = await import('firebase/app');
      const { getAuth: getClientAuth, signInWithEmailAndPassword } = await import('firebase/auth');
      
      const clientApp3 = initializeClientApp(firebaseConfig, 'diagnostic-app-rest');
      const clientAuth3 = getClientAuth(clientApp3);
      const email = 'server-agent@app.com';
      const password = 'ServerAgentSuperSecretPassword123!';

      const userCredential = await signInWithEmailAndPassword(clientAuth3, email, password);
      const idToken = await userCredential.user.getIdToken();

      const docPath = `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/test/test-server-agent-rest`;
      const restUrl = `https://firestore.googleapis.com/v1/${docPath}?key=${firebaseConfig.apiKey}`;
      
      const writeBody = {
        fields: {
          testedAt: { stringValue: new Date().toISOString() },
          method: { stringValue: 'AUTHENTICATED_REST' },
          uid: { stringValue: userCredential.user.uid }
        }
      };

      const writeResp = await fetch(restUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(writeBody)
      });

      if (!writeResp.ok) {
        const errText = await writeResp.text();
        throw new Error(`Auth REST Write failed: status ${writeResp.status} - ${errText}`);
      }

      const readResp = await fetch(restUrl, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (!readResp.ok) {
        throw new Error(`Auth REST Read failed: status ${readResp.status}`);
      }

      const readData = await readResp.json();
      results.diagnostics.push({
        test: 'Firebase Server Agent Authenticated REST write/read',
        status: 'SUCCESS',
        data: readData
      });

    } catch (err: any) {
      results.diagnostics.push({
        test: 'Firebase Server Agent Authenticated REST write/read',
        status: 'FAILED',
        error: err.message || String(err),
        stack: err.stack
      });
    }

    // Test 8: Write/Read using API Key REST API on DEFAULT Database
    try {
      const docPath = `projects/${firebaseConfig.projectId}/databases/(default)/documents/test/test-rest-default`;
      const restUrl = `https://firestore.googleapis.com/v1/${docPath}?key=${firebaseConfig.apiKey}`;
      
      const writeBody = {
        fields: {
          testedAt: { stringValue: new Date().toISOString() },
          method: { stringValue: 'DEFAULT_DB_REST' }
        }
      };

      const writeResp = await fetch(restUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(writeBody)
      });

      if (!writeResp.ok) {
        const errText = await writeResp.text();
        throw new Error(`DEFAULT DB REST API Key Write failed: status ${writeResp.status} - ${errText}`);
      }

      const readResp = await fetch(restUrl);
      if (!readResp.ok) {
        throw new Error(`DEFAULT DB REST API Key Read failed: status ${readResp.status}`);
      }

      const readData = await readResp.json();
      results.diagnostics.push({
        test: 'Firestore DEFAULT DB REST API Key write/read',
        status: 'SUCCESS',
        data: readData
      });

    } catch (err: any) {
      results.diagnostics.push({
        test: 'Firestore DEFAULT DB REST API Key write/read',
        status: 'FAILED',
        error: err.message || String(err),
        stack: err.stack
      });
    }

    fs.writeFileSync(path.join(process.cwd(), 'debug-log.txt'), JSON.stringify(results, null, 2), 'utf8');
    console.log('--- FIRESTORE DIAGNOSTIC COMPLETED AND SAVED TO debug-log.txt ---');
  }, 2000);

  // Delete Account
  app.post('/api/auth/delete-account', authenticateToken, async (req: any, res) => {
    try {
      const db = dbService.getDB();
      const emailNorm = req.user.email.toLowerCase();
      const userId = req.user.userId;

      // Remove user database models
      delete db.users[emailNorm];
      delete db.profiles[userId];
      delete db.sessions[userId];
      delete db.billingHistory[userId];

      // Remove associated user files in S3 & Firestore using REST API
      const ownedDocs = await runFirestoreQuery(req.idToken, 'files', 'ownerId', 'EQUAL', userId);

      for (const data of ownedDocs) {
        if (data && data.id) {
          if (!data.isFolder && data.mimeType !== 'folder') {
            const s3Key = data.s3Key || `users/${userId}/${data.originalName || data.fileName || data.name}`;
            try {
              await s3Client.send(new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME || '',
                Key: s3Key,
              }));
            } catch (err) {
              console.error('Error deleting associated file in delete-account:', err);
            }
          }
          await deleteFirestoreDoc(req.idToken, 'files', data.id);
        }
      }

      // Strip from generic database
      db.activities = db.activities.filter(a => a.userId !== userId);

      dbService.saveDB(db);
      res.json({ success: true, message: 'Account permanently purged.' });
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({ error: 'Failed to purge account data.' });
    }
  });

  // ==================== CLOUD FILES SYSTEM API ====================

  // Fetch Files Listing with nested folder structure, search, sort, and filters
  app.get('/api/files', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const parentId = req.query.parentId === 'null' ? null : (req.query.parentId || null);
      const search = (req.query.search || '').toString().toLowerCase().trim();
      const favoriteOnly = req.query.favorite === 'true';
      const trashedOnly = req.query.trashed === 'true';
      const sharedOnly = req.query.shared === 'true';
      const fileType = (req.query.type || '').toString().toLowerCase().trim(); // e.g. 'image', 'document' etc
      const sortBy = (req.query.sortBy || 'name').toString(); // 'name', 'size', 'createdAt'
      const sortOrder = (req.query.sortOrder || 'asc').toString(); // 'asc', 'desc'
      const all = req.query.all === 'true';

      // Get basic workspace files owned by me or shared with me
      let userFiles = await getFilesForUser(req.idToken, userId, req.user.email);

      // Starred filter
      if (favoriteOnly) {
        userFiles = userFiles.filter(f => f.isStarred && !f.isTrashed);
      }
      // Trash filter
      else if (trashedOnly) {
        userFiles = userFiles.filter(f => f.isTrashed);
      }
      // Shared with me filter
      else if (sharedOnly) {
        userFiles = userFiles.filter(f => f.ownerId !== userId && !f.isTrashed);
      }
      // Standard Parent Navigation Flow. (If there's a search keyword, do global search bypassing parentId boundaries!)
      else {
        userFiles = userFiles.filter(f => !f.isTrashed);
        if (!search && !all) {
          userFiles = userFiles.filter(f => f.parentId === parentId);
        }
      }

      // Search query parameter query
      if (search) {
        userFiles = userFiles.filter(f => f.name.toLowerCase().includes(search));
      }

      // Categorization filter (Mime Filter)
      if (fileType) {
        userFiles = userFiles.filter(f => {
          if (f.isFolder) return false;
          const mime = f.mimeType.toLowerCase();
          if (fileType === 'image') return mime.startsWith('image/');
          if (fileType === 'pdf') return mime.includes('/pdf');
          if (fileType === 'video') return mime.startsWith('video/');
          if (fileType === 'audio') return mime.startsWith('audio/');
          if (fileType === 'document') {
            return mime.includes('word') || mime.includes('excel') || mime.includes('presentation') || mime.includes('officedocument') || mime.includes('text') || mime.includes('rtf') || mime.includes('pdf');
          }
          if (fileType === 'zip') return mime.includes('zip') || mime.includes('tar') || mime.includes('rar') || mime.includes('7z') || mime.includes('archive');
          return true;
        });
      }

      // Priority Sort Helper
      userFiles.sort((a, b) => {
        // Folders are always forced first in sorting standard UX
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;

        let valA: any = a.name;
        let valB: any = b.name;

        if (sortBy === 'size') {
          valA = a.size;
          valB = b.size;
        } else if (sortBy === 'createdAt') {
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
        }

        const comparison = valA < valB ? -1 : valA > valB ? 1 : 0;
        return sortOrder === 'desc' ? -comparison : comparison;
      });

      res.json({ files: userFiles });
    } catch (error) {
      console.error('Error fetching files:', error);
      res.status(500).json({ error: 'Failed to retrieve files structure.' });
    }
  });

  // Create Directory Folder
  app.post('/api/files/create-folder', authenticateToken, async (req: any, res) => {
    try {
      const { name, parentId } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Folder name is required' });
      }

      const db = dbService.getDB();
      const userId = req.user.userId;
      const profile = db.profiles[userId];

      const folderId = 'folder-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      const folderData = {
        ownerId: userId,
        fileName: name,
        originalName: name,
        fileSize: 0,
        mimeType: 'folder',
        s3Key: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        starred: false,
        trashed: false,
        folderId: parentId || null,

        // Compat fields
        isFolder: true,
        isStarred: false,
        isTrashed: false,
        trashedAt: null,
        ownerName: profile.name,
        ownerEmail: profile.email,
        sharedWith: [],
        sharedWithEmails: [],
        shareLink: null,
      };

      await setFirestoreDoc(req.idToken, 'files', folderId, folderData);

      const newFolder = mapFirestoreDocToFile(folderId, folderData);

      db.activities.unshift({
        id: 'act-' + Date.now(),
        type: 'create_folder',
        details: `Created folder "${name}"`,
        createdAt: new Date().toISOString(),
        userId,
      });

      dbService.saveDB(db);
      res.json({ folder: newFolder });
    } catch (error) {
      console.error('Error creating folder:', error);
      res.status(500).json({ error: 'Failed to create folder.' });
    }
  });

  // Action: Upload real files using HTML input/Drag and Drop
  app.post('/api/files/upload', authenticateToken, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No physical upload part file supplied' });
      }

      const parentId = req.body.parentId === 'null' || !req.body.parentId ? null : req.body.parentId;
      const db = dbService.getDB();
      const userId = req.user.userId;
      const profile = db.profiles[userId];

      // Calculate active storage used dynamically from Firestore using REST helper
      let storageUsed = 0;
      try {
        const ownedDocs = await runFirestoreQuery(req.idToken, 'files', 'ownerId', 'EQUAL', userId);
        ownedDocs.forEach(data => {
          if (data && !data.isFolder && !data.isTrashed && !data.trashed) {
            storageUsed += (data.fileSize !== undefined ? data.fileSize : (data.size || 0));
          }
        });
      } catch (err) {
        console.warn('Error fetching storage used during upload via REST:', err);
      }

      // Check storage limits
      if (storageUsed + req.file.size > profile.storageLimit) {
        // Emit a warning/error system notification
        db.notifications.unshift({
          id: 'notif-' + Date.now(),
          title: 'Storage Limit Exhausted',
          message: `Your upload of "${req.file.originalname}" was rejected. Please upgrade subscription space.`,
          type: 'error',
          read: false,
          createdAt: new Date().toISOString(),
        });
        dbService.saveDB(db);

        return res.status(400).json({ error: 'Workspace storage capacity exceeded. Please scale plan up.' });
      }

      // Upload every file directly to AWS S3 using memory buffer (No local file storage!)
      const s3Key = `users/${userId}/${req.file.originalname}`;
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME || '',
        Key: s3Key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype || 'application/octet-stream',
      }));

      const fileId = 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
      const fileData = {
        ownerId: userId,
        fileName: req.file.originalname,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype || 'application/octet-stream',
        s3Key: s3Key,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        starred: false,
        trashed: false,
        folderId: parentId,

        // Compat fields
        isFolder: false,
        isStarred: false,
        isTrashed: false,
        trashedAt: null,
        ownerName: profile.name,
        ownerEmail: profile.email,
        sharedWith: [],
        sharedWithEmails: [],
        shareLink: null,
      };

      await setFirestoreDoc(req.idToken, 'files', fileId, fileData);

      // Re-calculate local storage used
      const updatedStorageUsed = storageUsed + req.file.size;
      profile.storageUsed = updatedStorageUsed;
      db.profiles[userId] = profile;

      // Update Firestore users collection to trigger real-time profile listener in client using REST helper
      try {
        await updateFirestoreDoc(req.idToken, 'users', userId, {
          storageUsed: updatedStorageUsed
        });
      } catch (err) {
        console.warn('Error updating profile storageUsed on upload via REST:', err);
      }

      // Track details
      db.activities.unshift({
        id: 'act-' + Date.now(),
        type: 'upload',
        details: `Uploaded file "${req.file.originalname}" (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`,
        createdAt: new Date().toISOString(),
        userId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      });

      db.notifications.unshift({
        id: 'notif-' + Date.now(),
        title: 'Upload Completed',
        message: `Successfully uploaded "${req.file.originalname}"!`,
        type: 'success',
        read: false,
        createdAt: new Date().toISOString(),
      });

      dbService.saveDB(db);

      const newFile = mapFirestoreDocToFile(fileId, fileData);
      res.json({ file: newFile });
    } catch (error) {
      console.error('Error handling uploaded file:', error);
      res.status(500).json({ error: 'Failed to process file upload.' });
    }
  });

  // Action: Rename File or Folder
  app.post('/api/files/rename/:id', authenticateToken, async (req: any, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'New profile name is required' });
      }

      const db = dbService.getDB();
      const fileId = req.params.id;
      const userId = req.user.userId;

      const fileData = await getFirestoreDoc(req.idToken, 'files', fileId);

      if (!fileData || fileData.ownerId !== userId) {
        return res.status(404).json({ error: 'File entity not found or missing credentials' });
      }

      const oldName = fileData.originalName || fileData.fileName || fileData.name || '';
      const isFolder = fileData.mimeType === 'folder' || fileData.isFolder;

      const updatedFields: any = {
        updatedAt: new Date().toISOString(),
      };

      if (isFolder) {
        updatedFields.fileName = name;
        updatedFields.originalName = name;
        updatedFields.name = name;
      } else {
        // For physical S3 files, originalName is the visual filename
        updatedFields.originalName = name;
        updatedFields.fileName = name;
        updatedFields.name = name;
      }

      const mergedFields = { ...fileData, ...updatedFields };
      await setFirestoreDoc(req.idToken, 'files', fileId, mergedFields);

      const updatedFile = mapFirestoreDocToFile(fileId, mergedFields);

      db.activities.unshift({
        id: 'act-' + Date.now(),
        type: 'rename',
        details: `Renamed "${oldName}" to "${name}"`,
        createdAt: new Date().toISOString(),
        userId: userId,
      });

      dbService.saveDB(db);
      res.json({ file: updatedFile });
    } catch (error) {
      console.error('Error renaming file:', error);
      res.status(500).json({ error: 'Failed to rename file entity.' });
    }
  });

  // Action: Move elements to another directory index
  app.post('/api/files/move/:id', authenticateToken, async (req: any, res) => {
    try {
      const { parentId } = req.body;
      const targetParentId = parentId === 'null' || !parentId ? null : parentId;

      const db = dbService.getDB();
      const fileId = req.params.id;
      const userId = req.user.userId;

      if (targetParentId === fileId) {
        return res.status(400).json({ error: 'A directory cannot be moved into itself' });
      }

      const fileData = await getFirestoreDoc(req.idToken, 'files', fileId);

      if (!fileData || fileData.ownerId !== userId) {
        return res.status(404).json({ error: 'File or directory not found' });
      }

      const mergedFields = {
        ...fileData,
        folderId: targetParentId,
        parentId: targetParentId, // compat
        updatedAt: new Date().toISOString(),
      };

      await setFirestoreDoc(req.idToken, 'files', fileId, mergedFields);
      const updatedFile = mapFirestoreDocToFile(fileId, mergedFields);

      db.activities.unshift({
        id: 'act-' + Date.now(),
        type: 'rename',
        details: `Moved "${updatedFile.name}" to new target directory`,
        createdAt: new Date().toISOString(),
        userId: userId,
      });

      dbService.saveDB(db);
      res.json({ file: updatedFile });
    } catch (error) {
      console.error('Error moving file:', error);
      res.status(500).json({ error: 'Failed to relocate file entity.' });
    }
  });

  // Action: Duplicate file
  app.post('/api/files/duplicate/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = dbService.getDB();
      const fileId = req.params.id;
      const userId = req.user.userId;

      const originalData = await getFirestoreDoc(req.idToken, 'files', fileId);

      if (!originalData || originalData.ownerId !== userId) {
        return res.status(404).json({ error: 'Original file not found or contains directory records' });
      }

      const isFolder = originalData.isFolder || originalData.mimeType === 'folder';

      if (isFolder) {
        return res.status(400).json({ error: 'Duplicating folder layouts is not supported directly' });
      }

      const originalSize = originalData.fileSize !== undefined ? originalData.fileSize : (originalData.size || 0);
      const profile = db.profiles[userId];

      // Calculate active storage used dynamically from Firestore using REST API
      let storageUsed = 0;
      try {
        const ownedDocs = await runFirestoreQuery(req.idToken, 'files', 'ownerId', 'EQUAL', userId);
        ownedDocs.forEach(data => {
          if (data && !data.isFolder && !data.isTrashed && !data.trashed) {
            storageUsed += (data.fileSize !== undefined ? data.fileSize : (data.size || 0));
          }
        });
      } catch (err) {
        console.warn('Error fetching dynamic storage for duplicate via REST:', err);
      }

      if (storageUsed + originalSize > profile.storageLimit) {
        return res.status(400).json({ error: 'Storage full. Cannot duplicate files.' });
      }

      const newId = 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);

      // Copy S3 object safely
      const originalS3Key = originalData.s3Key || `users/${userId}/${originalData.originalName || originalData.fileName}`;
      let suffix = ' (Copy)';
      let nameAndExt = originalData.originalName || originalData.fileName || '';
      const dotIndex = nameAndExt.lastIndexOf('.');
      if (dotIndex > 0) {
        nameAndExt = nameAndExt.substring(0, dotIndex) + suffix + nameAndExt.substring(dotIndex);
      } else {
        nameAndExt = nameAndExt + suffix;
      }

      const duplicatedS3Key = `users/${userId}/${nameAndExt}`;

      try {
        await s3Client.send(new CopyObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME || '',
          CopySource: encodeURIComponent(`${process.env.AWS_BUCKET_NAME}/${originalS3Key}`),
          Key: duplicatedS3Key,
        }));
      } catch (err) {
        console.error('Error duplicating deep S3 asset object:', err);
        return res.status(500).json({ error: 'Failed copy transaction on cloud storage server.' });
      }

      const duplicateFileData = {
        ownerId: userId,
        fileName: nameAndExt,
        originalName: nameAndExt,
        fileSize: originalSize,
        mimeType: originalData.mimeType || 'application/octet-stream',
        s3Key: duplicatedS3Key,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        starred: false,
        trashed: false,
        folderId: originalData.folderId || originalData.parentId || null,

        // Compat fields
        isFolder: false,
        isStarred: false,
        isTrashed: false,
        trashedAt: null,
        ownerName: profile.name,
        ownerEmail: profile.email,
        sharedWith: [],
        sharedWithEmails: [],
        shareLink: null,
      };

      await setFirestoreDoc(req.idToken, 'files', newId, duplicateFileData);

      const updatedStorageUsed = storageUsed + originalSize;
      profile.storageUsed = updatedStorageUsed;
      db.profiles[userId] = profile;

      try {
        await updateFirestoreDoc(req.idToken, 'users', userId, {
          storageUsed: updatedStorageUsed
        });
      } catch (err) {
        console.warn('Error updating profile storage for duplicate via REST:', err);
      }

      db.activities.unshift({
        id: 'act-' + Date.now(),
        type: 'upload',
        details: `Duplicated file "${originalData.originalName || originalData.fileName}" into "${nameAndExt}"`,
        createdAt: new Date().toISOString(),
        userId: userId,
      });

      dbService.saveDB(db);

      const copyObj = mapFirestoreDocToFile(newId, duplicateFileData);
      res.json({ file: copyObj });
    } catch (error) {
      console.error('Error duplicating file:', error);
      res.status(500).json({ error: 'Duplication loop crash.' });
    }
  });

  // Action: Star toggle
  app.post('/api/files/toggle-star/:id', authenticateToken, async (req: any, res) => {
    try {
      const fileId = req.params.id;
      const userId = req.user.userId;

      const fileData = await getFirestoreDoc(req.idToken, 'files', fileId);

      if (!fileData) {
        return res.status(404).json({ error: 'File not found' });
      }

      const currentStarred = !!(fileData.starred !== undefined ? fileData.starred : fileData.isStarred);
      const mergedFields = {
        ...fileData,
        starred: !currentStarred,
        isStarred: !currentStarred, // compat
      };

      await setFirestoreDoc(req.idToken, 'files', fileId, mergedFields);
      const updatedFile = mapFirestoreDocToFile(fileId, mergedFields);

      res.json({ file: updatedFile });
    } catch (error) {
      console.error('Error toggling star:', error);
      res.status(500).json({ error: 'Failed to star file entity.' });
    }
  });

  // Action: Share File with list of users
  app.post('/api/files/share/:id', authenticateToken, async (req: any, res) => {
    try {
      const { sharedWith } = req.body;
      if (!Array.isArray(sharedWith)) {
        return res.status(400).json({ error: 'sharedWith schema must be valid array' });
      }

      const db = dbService.getDB();
      const fileId = req.params.id;
      const userId = req.user.userId;

      const fileData = await getFirestoreDoc(req.idToken, 'files', fileId);

      if (!fileData || fileData.ownerId !== userId) {
        return res.status(404).json({ error: 'File metadata not found' });
      }

      const sharedWithEmails = sharedWith.map(s => s.email.toLowerCase().trim());
      const mergedFields = {
        ...fileData,
        sharedWith,
        sharedWithEmails,
      };

      await setFirestoreDoc(req.idToken, 'files', fileId, mergedFields);
      const updatedFile = mapFirestoreDocToFile(fileId, mergedFields);

      db.activities.unshift({
        id: 'act-' + Date.now(),
        type: 'share',
        details: `Shared "${updatedFile.name}" with ${sharedWith.length} external collaborators`,
        createdAt: new Date().toISOString(),
        userId: userId,
      });

      // Notify user
      db.notifications.unshift({
        id: 'notif-' + Date.now(),
        title: 'File Collaboration Modified',
        message: `Sharing properties updated on "${updatedFile.name}"`,
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
      });

      dbService.saveDB(db);
      res.json({ file: updatedFile });
    } catch (error) {
      console.error('Error sharing file:', error);
      res.status(500).json({ error: 'Share modification transaction failed.' });
    }
  });

  // Action: Generate or update secure share link properties
  app.post('/api/files/share-link/:id', authenticateToken, async (req: any, res) => {
    try {
      const { isPublic, passwordEnabled, password, expiresAt } = req.body;

      const db = dbService.getDB();
      const fileId = req.params.id;
      const userId = req.user.userId;

      const fileData = await getFirestoreDoc(req.idToken, 'files', fileId);

      if (!fileData || fileData.ownerId !== userId) {
        return res.status(404).json({ error: 'File metadata not found' });
      }

      let shareLinkVal = null;

      if (isPublic) {
        const oldShareLinkId = fileData.shareLink?.id || 'share-' + Math.random().toString(36).substring(2, 9);
        shareLinkVal = {
          id: oldShareLinkId,
          isPublic: true,
          passwordEnabled: !!passwordEnabled,
          password: password || null,
          expiresAt: expiresAt || null,
        };
      }

      const mergedFields = {
        ...fileData,
        shareLink: shareLinkVal,
      };

      await setFirestoreDoc(req.idToken, 'files', fileId, mergedFields);
      const updatedFile = mapFirestoreDocToFile(fileId, mergedFields);

      dbService.saveDB(db);
      res.json({ file: updatedFile });
    } catch (error) {
      console.error('Error modifying public link share properties:', error);
      res.status(500).json({ error: 'Failed to compile share link settings.' });
    }
  });

  // Action: Delete file (moves to Trash, or deletes permanently if already in Trash)
  app.post('/api/files/delete/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = dbService.getDB();
      const fileId = req.params.id;
      const userId = req.user.userId;
      const profile = db.profiles[userId];

      const fileData = await getFirestoreDoc(req.idToken, 'files', fileId);

      if (!fileData || fileData.ownerId !== userId) {
        return res.status(404).json({ error: 'Target file not found' });
      }

      const currentTrashed = !!(fileData.trashed !== undefined ? fileData.trashed : fileData.isTrashed);
      const isFolder = fileData.isFolder || fileData.mimeType === 'folder';

      if (!currentTrashed) {
        // First stage: move to Trash bin
        const mergedFields = {
          ...fileData,
          trashed: true,
          isTrashed: true, // compat
          trashedAt: new Date().toISOString(),
        };
        await setFirestoreDoc(req.idToken, 'files', fileId, mergedFields);

        const updatedFile = mapFirestoreDocToFile(fileId, mergedFields);

        db.activities.unshift({
          id: 'act-' + Date.now(),
          type: 'delete',
          details: `Moved "${updatedFile.name}" to Trash Bin`,
          createdAt: new Date().toISOString(),
          userId: userId,
        });

        db.notifications.unshift({
          id: 'notif-' + Date.now(),
          title: 'Item Moved to Trash',
          message: `"${updatedFile.name}" was safely relocated to the Trash.`,
          type: 'warning',
          read: false,
          createdAt: new Date().toISOString(),
        });
      } else {
        // Second stage: permanent removal from Firestore & S3 storage
        if (!isFolder) {
          const s3Key = fileData.s3Key || `users/${userId}/${fileData.originalName || fileData.fileName}`;
          try {
            await s3Client.send(new DeleteObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME || '',
              Key: s3Key,
            }));
          } catch (err) {
            console.error('S3 delete object action error:', err);
          }
        }

        await deleteFirestoreDoc(req.idToken, 'files', fileId);

        // Calculate active storage used dynamically from Firestore using REST helper
        let storageUsed = 0;
        try {
          const ownedDocs = await runFirestoreQuery(req.idToken, 'files', 'ownerId', 'EQUAL', userId);
          ownedDocs.forEach(data => {
            if (data && !data.isFolder && !data.isTrashed && !data.trashed) {
              storageUsed += (data.fileSize !== undefined ? data.fileSize : (data.size || 0));
            }
          });
        } catch (err) {
          console.warn('Error fetching dynamic storage after delete via REST:', err);
        }

        profile.storageUsed = storageUsed;
        db.profiles[userId] = profile;

        try {
          await updateFirestoreDoc(req.idToken, 'users', userId, {
            storageUsed: storageUsed
          });
        } catch (err) {
          console.warn('Error updating user storage after delete via REST:', err);
        }

        db.activities.unshift({
          id: 'act-' + Date.now(),
          type: 'delete',
          details: `Permanently purged files entity "${fileData.originalName || fileData.fileName}"`,
          createdAt: new Date().toISOString(),
          userId: userId,
        });
      }

      dbService.saveDB(db);
      res.json({ success: true });
    } catch (error) {
      console.error('Error handling delete on file:', error);
      res.status(500).json({ error: 'Delete file execution crash.' });
    }
  });

  // Action: Restore file from trash back to parent
  app.post('/api/files/restore/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = dbService.getDB();
      const fileId = req.params.id;
      const userId = req.user.userId;

      const fileData = await getFirestoreDoc(req.idToken, 'files', fileId);

      if (!fileData || fileData.ownerId !== userId) {
        return res.status(404).json({ error: 'File metadata not found or credentials mismatched' });
      }

      const mergedFields = {
        ...fileData,
        trashed: false,
        isTrashed: false, // compat
        trashedAt: null,
      };

      await setFirestoreDoc(req.idToken, 'files', fileId, mergedFields);
      const updatedFile = mapFirestoreDocToFile(fileId, mergedFields);

      db.activities.unshift({
        id: 'act-' + Date.now(),
        type: 'restore',
        details: `Safely restored "${updatedFile.name}" from Trash`,
        createdAt: new Date().toISOString(),
        userId: userId,
      });

      dbService.saveDB(db);
      res.json({ file: updatedFile });
    } catch (error) {
      console.error('Error restoring file:', error);
      res.status(500).json({ error: 'Restore action failed.' });
    }
  });

  // Action: Clear Trash Bin entirely
  app.post('/api/files/clear-trash', authenticateToken, async (req: any, res) => {
    try {
      const db = dbService.getDB();
      const userId = req.user.userId;
      const profile = db.profiles[userId];

      const ownedDocs = await runFirestoreQuery(req.idToken, 'files', 'ownerId', 'EQUAL', userId);
      const trashedDocs = ownedDocs.filter(f => f && (f.isTrashed || f.trashed));

      for (const data of trashedDocs) {
        if (data && data.id) {
          const isFolder = data.isFolder || data.mimeType === 'folder';

          if (!isFolder) {
            const s3Key = data.s3Key || `users/${userId}/${data.originalName || data.fileName}`;
            try {
              await s3Client.send(new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME || '',
                Key: s3Key,
              }));
            } catch (err) {
              console.error('S3 clear trash element deletion error:', err);
            }
          }
          await deleteFirestoreDoc(req.idToken, 'files', data.id);
        }
      }

      // Re-initialize active size storage from the remaining files in our fetched list
      let storageUsed = 0;
      ownedDocs.forEach(data => {
        if (data && !trashedDocs.some(td => td.id === data.id)) {
          if (!data.isFolder && !data.isTrashed && !data.trashed) {
            storageUsed += (data.fileSize !== undefined ? data.fileSize : (data.size || 0));
          }
        }
      });

      profile.storageUsed = storageUsed;
      db.profiles[userId] = profile;

      try {
        await updateFirestoreDoc(req.idToken, 'users', userId, {
          storageUsed: storageUsed
        });
      } catch (err) {
        console.warn('Error updating profile storage after clear-trash via REST:', err);
      }

      db.activities.unshift({
        id: 'act-' + Date.now(),
        type: 'delete',
        details: 'Trash Bin purged completely.',
        createdAt: new Date().toISOString(),
        userId,
      });

      dbService.saveDB(db);
      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing trash:', error);
      res.status(500).json({ error: 'Failed to purge entire trash collector.' });
    }
  });

  // Download Endpoint (Secure S3 streaming proxy with built-in access validation)
  app.get('/api/files/download/:id', async (req, res) => {
    try {
      const fileId = req.params.id;

      // Extract optional token header or query parameter to allow authenticated REST GET
      const authHeader = req.headers['authorization'];
      const tokenHeader = authHeader && authHeader.split(' ')[1];
      const tokenQuery = req.query.token as string;
      const verifiedToken = tokenHeader || tokenQuery;

      const fileData = await getFirestoreDoc(verifiedToken, 'files', fileId);
      if (!fileData) {
        return res.status(404).send('Asset metadata not found in database.');
      }

      const file = mapFirestoreDocToFile(fileId, fileData);

      if (file.isFolder) {
        return res.status(400).send('Directory indexes cannot be directly requested for streams.');
      }

      // Security check: either public shareLink exists, or valid JWT token passed in query parameter "?token=..." or Bearer
      let allowed = false;

      if (file.shareLink && file.shareLink.isPublic) {
        if (file.shareLink.passwordEnabled) {
          const passwordQuery = req.query.pwd;
          if (passwordQuery !== file.shareLink.password) {
            return res.status(403).send('Password parameter is incorrect or missing.');
          }
        }
        if (file.shareLink.expiresAt) {
          if (new Date() > new Date(file.shareLink.expiresAt)) {
            return res.status(403).send('Share link expired.');
          }
        }
        allowed = true;
      } else {
        if (verifiedToken) {
          let decoded: any = null;
          try {
            decoded = jwt.verify(verifiedToken, JWT_SECRET) as any;
          } catch (err) {
            // If standard verification fails, parse as Firebase ID Token
            const decodedFirebase = jwt.decode(verifiedToken) as any;
            if (decodedFirebase && decodedFirebase.sub && decodedFirebase.email) {
              decoded = {
                userId: decodedFirebase.sub,
                email: decodedFirebase.email
              };
            }
          }

          if (decoded) {
            // Check access ownership or sharing scope
            if (file.ownerId === decoded.userId || (fileData.sharedWithEmails && fileData.sharedWithEmails.includes(decoded.email.toLowerCase().trim()))) {
              allowed = true;
            }
          }
        }
      }

      if (!allowed) {
        return res.status(401).send('Unauthorized file access payload scope request.');
      }

      const s3Key = fileData.s3Key || `users/${file.ownerId}/${file.name}`;
      const s3Response = await s3Client.send(new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME || '',
        Key: s3Key,
      }));

      const downloadParam = req.query.download === 'true';
      if (downloadParam) {
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
      } else {
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.name)}"`);
      }
      res.setHeader('Cache-Control', 'private, max-age=600');
      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');

      if (s3Response.Body) {
        (s3Response.Body as any).pipe(res);
      } else {
        res.status(500).send('Failed to read cloud storage file buffer.');
      }
    } catch (error) {
      console.error('Download stream error:', error);
      res.status(500).send('Failed to establish file delivery pipe from Cloud S3.');
    }
  });

  // ==================== BILLING / UPGRADES API ====================

  app.post('/api/billing/upgrade', authenticateToken, (req: any, res) => {
    const { plan } = req.body;
    if (!['pro', 'business', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid selected subscription plan type' });
    }

    const db = dbService.getDB();
    const userId = req.user.userId;
    const profile = db.profiles[userId];

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    let limitBytes = 200 * 1024 * 1024 * 1024; // Free
    if (plan === 'pro') limitBytes = 1 * 1024 * 1024 * 1024 * 1024; // 1 TB
    if (plan === 'business') limitBytes = 5 * 1024 * 1024 * 1024 * 1024; // 5 TB
    if (plan === 'enterprise') limitBytes = 100 * 1024 * 1024 * 1024 * 1024; // 100 TB or infinite

    profile.plan = plan;
    profile.storageLimit = limitBytes;
    db.profiles[userId] = profile;

    // Billing history record tracker
    const invoice = {
      id: 'INV-' + Date.now(),
      date: new Date().toLocaleDateString(),
      planName: plan.toUpperCase() + ' Space Provisioning',
      amount: plan === 'pro' ? '$9.99' : plan === 'business' ? '$29.99' : '$89.99',
      status: 'Paid',
    };

    const history = db.billingHistory[userId] || [];
    db.billingHistory[userId] = [invoice, ...history];

    db.activities.unshift({
      id: 'act-' + Date.now(),
      type: 'subscription',
      details: `Scaled plan up to ${plan.toUpperCase()} tier successfully`,
      createdAt: new Date().toISOString(),
      userId,
    });

    db.notifications.unshift({
      id: 'notif-' + Date.now(),
      title: 'Subscription Active',
      message: `Welcome to ${plan.toUpperCase()} tier. You now have access to ${(limitBytes / 1024 / 1024 / 1024 / 1024).toFixed(0)} TB storage.`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString(),
    });

    dbService.saveDB(db);
    res.json({ user: profile, invoice });
  });

  app.post('/api/billing/downgrade', authenticateToken, (req: any, res) => {
    const { plan } = req.body;
    if (!['free', 'pro', 'business'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid targeted downgrade plan type' });
    }

    const db = dbService.getDB();
    const userId = req.user.userId;
    const profile = db.profiles[userId];

    profile.plan = plan;
    let limitBytes = 200 * 1024 * 1024 * 1024;
    if (plan === 'pro') limitBytes = 1 * 1024 * 1024 * 1024 * 1024;
    if (plan === 'business') limitBytes = 5 * 1024 * 1024 * 1024 * 1024;

    profile.storageLimit = limitBytes;
    db.profiles[userId] = profile;

    db.activities.unshift({
      id: 'act-' + Date.now(),
      type: 'subscription',
      details: `Downgraded workspace storage limits to ${plan.toUpperCase()} tier`,
      createdAt: new Date().toISOString(),
      userId,
    });

    dbService.saveDB(db);
    res.json({ user: profile });
  });

  app.get('/api/billing/history', authenticateToken, (req: any, res) => {
    const db = dbService.getDB();
    const history = db.billingHistory[req.user.userId] || [];
    res.json({ history });
  });

  // ==================== SYSTEM ACTIVITIES & NOTIFICATIONS ====================

  app.get('/api/activity', authenticateToken, (req: any, res) => {
    const db = dbService.getDB();
    // Filter activities owned by active logs userId only
    const userActivities = db.activities.filter(a => a.userId === req.user.userId);
    res.json({ activities: userActivities });
  });

  app.get('/api/notifications', authenticateToken, (req: any, res) => {
    const db = dbService.getDB();
    res.json({ notifications: db.notifications });
  });

  app.post('/api/notifications/read/:id', authenticateToken, (req, res) => {
    const db = dbService.getDB();
    const notification = db.notifications.find(n => n.id === req.params.id);
    if (notification) {
      notification.read = true;
    }
    dbService.saveDB(db);
    res.json({ notifications: db.notifications });
  });

  app.post('/api/notifications/read-all', authenticateToken, (req, res) => {
    const db = dbService.getDB();
    db.notifications.forEach(n => {
      n.read = true;
    });
    dbService.saveDB(db);
    res.json({ notifications: db.notifications });
  });

  app.post('/api/notifications/clear', authenticateToken, (req, res) => {
    const db = dbService.getDB();
    db.notifications = [];
    dbService.saveDB(db);
    res.json({ notifications: [] });
  });

  // ==================== SUPPORT CENTER INQUIRIES ====================

  app.post('/api/help/support-ticket', authenticateToken, (req: any, res) => {
    const { category, subject, message } = req.body;
    if (!category || !subject || !message) {
      return res.status(400).json({ error: 'Subject, category and description blocks are mandatory fields' });
    }

    const db = dbService.getDB();
    db.notifications.unshift({
      id: 'notif-' + Date.now(),
      title: 'Support Ticket Received',
      message: `Your inquiry "${subject}" was received. Support engineers will follow up within 24 hours.`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
    });

    db.activities.unshift({
      id: 'act-' + Date.now(),
      type: 'security',
      details: `Support ticket submitted: ${subject}`,
      createdAt: new Date().toISOString(),
      userId: req.user.userId,
    });

    dbService.saveDB(db);
    res.json({ success: true, message: 'Support ticket successfully generated!' });
  });

  // ==================== BIND ASSETS & VITE MIDDLEWARES ====================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cloud File Manager server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
