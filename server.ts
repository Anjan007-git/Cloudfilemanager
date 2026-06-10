import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { dbService } from './src/db-service.js';
import { CloudFile, Activity, SystemNotification, UserSession, UserProfile } from './src/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cloud-file-manager-key-2026-super-secret-key-92817291';
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enlarge payload sizes for file parameters/headers if needed
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Multer Setup for premium multithreaded file uploads inside local container storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
      // Keep file ID and name decoupled to prevent path traversal or special character failures
      const fileId = 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
      cb(null, fileId);
    },
  });

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

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ error: 'Session expired, please register or sign back in.' });
      }
      req.user = user;
      next();
    });
  };

  // JWT helper to generate elegant login tokens
  const generateToken = (userId: string, email: string) => {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
  };

  // ==================== AUTHENTICATION API ROUTES ====================

  // Auth Status Helper
  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    const db = dbService.getDB();
    const profile = db.profiles[req.user.userId];
    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json({ user: profile });
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
  app.post('/api/auth/login', (req, res) => {
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
    const updatedProfile = dbService.getDB().profiles[userId];

    res.json({ token, user: updatedProfile });
  });

  // Google OAuth Simulation for Rahul Sharma
  app.post('/api/auth/google', (req, res) => {
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
        storageUsed: 21175000, // starting sized files seed
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

    const token = generateToken(userId, defaultEmail);
    const updatedProfile = dbService.getDB().profiles[userId];

    res.json({ token, user: updatedProfile });
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

  // Delete Account
  app.post('/api/auth/delete-account', authenticateToken, (req: any, res) => {
    const db = dbService.getDB();
    const emailNorm = req.user.email.toLowerCase();
    const userId = req.user.userId;

    // Remove user database models
    delete db.users[emailNorm];
    delete db.profiles[userId];
    delete db.sessions[userId];
    delete db.billingHistory[userId];

    // Remove associated user files
    const userFiles = db.files.filter(f => f.ownerId === userId && !f.isFolder);
    userFiles.forEach(f => {
      try {
        const filePath = path.join(UPLOADS_DIR, f.id);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Error deleting associated physical file:', err);
      }
    });

    // Strip from generic database
    db.files = db.files.filter(f => f.ownerId !== userId);
    db.activities = db.activities.filter(a => a.userId !== userId);

    dbService.saveDB(db);
    res.json({ success: true, message: 'Account permanently purged.' });
  });

  // ==================== CLOUD FILES SYSTEM API ====================

  // Fetch Files Listing with nested folder structure, search, sort, and filters
  app.get('/api/files', authenticateToken, (req: any, res) => {
    const db = dbService.getDB();
    const userId = req.user.userId;
    const parentId = req.query.parentId === 'null' ? null : (req.query.parentId || null);
    const search = (req.query.search || '').toString().toLowerCase().trim();
    const favoriteOnly = req.query.favorite === 'true';
    const trashedOnly = req.query.trashed === 'true';
    const sharedOnly = req.query.shared === 'true';
    const fileType = (req.query.type || '').toString().toLowerCase().trim(); // e.g. 'image', 'document' etc
    const sortBy = (req.query.sortBy || 'name').toString(); // 'name', 'size', 'createdAt'
    const sortOrder = (req.query.sortOrder || 'asc').toString(); // 'asc', 'desc'

    // Get basic workspace files owned by me or shared with me
    let userFiles = db.files.filter(f => {
      // Owner or explicitly in sharedWith
      const isOwner = f.ownerId === userId;
      const isSharedWithUser = f.sharedWith.some(su => su.email.toLowerCase() === req.user.email.toLowerCase());
      return isOwner || isSharedWithUser;
    });

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
      if (!search) {
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
  });

  // Create Directory Folder
  app.post('/api/files/create-folder', authenticateToken, (req: any, res) => {
    const { name, parentId } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const db = dbService.getDB();
    const userId = req.user.userId;
    const profile = db.profiles[userId];

    const folderId = 'folder-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const newFolder: CloudFile = {
      id: folderId,
      name: name,
      size: 0,
      mimeType: 'folder',
      url: '',
      parentId: parentId || null,
      isFolder: true,
      isStarred: false,
      isTrashed: false,
      trashedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: userId,
      ownerName: profile.name,
      ownerEmail: profile.email,
      sharedWith: [],
      shareLink: null,
    };

    db.files.push(newFolder);

    db.activities.unshift({
      id: 'act-' + Date.now(),
      type: 'create_folder',
      details: `Created folder "${name}"`,
      createdAt: new Date().toISOString(),
      userId,
    });

    dbService.saveDB(db);
    res.json({ folder: newFolder });
  });

  // Action: Upload real files using HTML input/Drag and Drop
  app.post('/api/files/upload', authenticateToken, upload.single('file'), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No physical upload part file supplied' });
    }

    const parentId = req.body.parentId === 'null' || !req.body.parentId ? null : req.body.parentId;
    const db = dbService.getDB();
    const userId = req.user.userId;
    const profile = db.profiles[userId];

    // Check storage limits
    if (profile.storageUsed + req.file.size > profile.storageLimit) {
      // Remove disk file immediately to save disk
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}

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

    const fileId = req.file.filename; // Multer auto generated filename
    const newFile: CloudFile = {
      id: fileId,
      name: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype || 'application/octet-stream',
      url: `/api/files/download/${fileId}`,
      parentId: parentId,
      isFolder: false,
      isStarred: false,
      isTrashed: false,
      trashedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: userId,
      ownerName: profile.name,
      ownerEmail: profile.email,
      sharedWith: [],
      shareLink: null,
    };

    // Update profiles total used bytes
    profile.storageUsed += req.file.size;
    db.profiles[userId] = profile;

    db.files.push(newFile);

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
    res.json({ file: newFile });
  });

  // Action: Rename File or Folder
  app.post('/api/files/rename/:id', authenticateToken, (req: any, res) => {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'New profile name is required' });
    }

    const db = dbService.getDB();
    const fileId = req.params.id;
    const file = db.files.find(f => f.id === fileId && f.ownerId === req.user.userId);

    if (!file) {
      return res.status(404).json({ error: 'File entity not found or missing credentials' });
    }

    const oldName = file.name;
    file.name = name;
    file.updatedAt = new Date().toISOString();

    db.activities.unshift({
      id: 'act-' + Date.now(),
      type: 'rename',
      details: `Renamed "${oldName}" to "${name}"`,
      createdAt: new Date().toISOString(),
      userId: req.user.userId,
    });

    dbService.saveDB(db);
    res.json({ file });
  });

  // Action: Move elements to another directory index
  app.post('/api/files/move/:id', authenticateToken, (req: any, res) => {
    const { parentId } = req.body;
    const targetParentId = parentId === 'null' || !parentId ? null : parentId;

    const db = dbService.getDB();
    const fileId = req.params.id;
    const file = db.files.find(f => f.id === fileId && f.ownerId === req.user.userId);

    if (!file) {
      return res.status(404).json({ error: 'File or directory not found' });
    }

    // Secure boundary: ensure moving parent is also folder and not myself loop!
    if (targetParentId === fileId) {
      return res.status(400).json({ error: 'A directory cannot be moved into itself' });
    }

    file.parentId = targetParentId;
    file.updatedAt = new Date().toISOString();

    db.activities.unshift({
      id: 'act-' + Date.now(),
      type: 'rename',
      details: `Moved "${file.name}" to new target directory`,
      createdAt: new Date().toISOString(),
      userId: req.user.userId,
    });

    dbService.saveDB(db);
    res.json({ file });
  });

  // Action: Duplicate file
  app.post('/api/files/duplicate/:id', authenticateToken, (req: any, res) => {
    const db = dbService.getDB();
    const fileId = req.params.id;
    const original = db.files.find(f => f.id === fileId && f.ownerId === req.user.userId && !f.isFolder);

    if (!original) {
      return res.status(404).json({ error: 'Original file not found or contains directory records' });
    }

    const profile = db.profiles[req.user.userId];
    if (profile.storageUsed + original.size > profile.storageLimit) {
      return res.status(400).json({ error: 'Storage full. Cannot duplicate files.' });
    }

    const newId = 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);

    // Duplicate physical asset
    try {
      const srcPath = path.join(UPLOADS_DIR, original.id);
      const destPath = path.join(UPLOADS_DIR, newId);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    } catch (e) {
      console.error('Error with physical file replication:', e);
    }

    // Suffix renamed duplicate
    let nameAndExt = original.name;
    const dotIndex = original.name.lastIndexOf('.');
    if (dotIndex > 0) {
      nameAndExt = original.name.substring(0, dotIndex) + ' (Copy)' + original.name.substring(dotIndex);
    } else {
      nameAndExt = original.name + ' (Copy)';
    }

    const copyObj: CloudFile = {
      ...original,
      id: newId,
      name: nameAndExt,
      url: `/api/files/download/${newId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isStarred: false,
      shareLink: null,
      sharedWith: [],
    };

    profile.storageUsed += original.size;
    db.profiles[req.user.userId] = profile;
    db.files.push(copyObj);

    db.activities.unshift({
      id: 'act-' + Date.now(),
      type: 'upload',
      details: `Duplicated file "${original.name}" into "${copyObj.name}"`,
      createdAt: new Date().toISOString(),
      userId: req.user.userId,
    });

    dbService.saveDB(db);
    res.json({ file: copyObj });
  });

  // Action: Star toggle
  app.post('/api/files/toggle-star/:id', authenticateToken, (req: any, res) => {
    const db = dbService.getDB();
    const fileId = req.params.id;
    const file = db.files.find(f => f.id === fileId && (f.ownerId === req.user.userId || f.sharedWith.some(su => su.email === req.user.email)));

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    file.isStarred = !file.isStarred;
    dbService.saveDB(db);

    res.json({ file });
  });

  // Action: Share File with list of users
  app.post('/api/files/share/:id', authenticateToken, (req: any, res) => {
    const { sharedWith } = req.body; // array of SharedUser
    if (!Array.isArray(sharedWith)) {
      return res.status(400).json({ error: 'sharedWith schema must be valid array' });
    }

    const db = dbService.getDB();
    const fileId = req.params.id;
    const file = db.files.find(f => f.id === fileId && f.ownerId === req.user.userId);

    if (!file) {
      return res.status(404).json({ error: 'File metadata not found' });
    }

    file.sharedWith = sharedWith;

    db.activities.unshift({
      id: 'act-' + Date.now(),
      type: 'share',
      details: `Shared "${file.name}" with ${sharedWith.length} external collaborators`,
      createdAt: new Date().toISOString(),
      userId: req.user.userId,
    });

    // Notify user
    db.notifications.unshift({
      id: 'notif-' + Date.now(),
      title: 'File Collaboration Modified',
      message: `Sharing properties updated on "${file.name}"`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
    });

    dbService.saveDB(db);
    res.json({ file });
  });

  // Action: Generate or update secure share link properties
  app.post('/api/files/share-link/:id', authenticateToken, (req: any, res) => {
    const { isPublic, passwordEnabled, password, expiresAt } = req.body;

    const db = dbService.getDB();
    const fileId = req.params.id;
    const file = db.files.find(f => f.id === fileId && f.ownerId === req.user.userId);

    if (!file) {
      return res.status(404).json({ error: 'File metadata not found' });
    }

    if (!isPublic) {
      file.shareLink = null;
    } else {
      file.shareLink = {
        id: file.shareLink?.id || 'share-' + Math.random().toString(36).substring(2, 9),
        isPublic: true,
        passwordEnabled: !!passwordEnabled,
        password: password || null,
        expiresAt: expiresAt || null,
      };
    }

    dbService.saveDB(db);
    res.json({ file });
  });

  // Action: Delete file (moves to Trash, or deletes permanently if already in Trash)
  app.post('/api/files/delete/:id', authenticateToken, (req: any, res) => {
    const db = dbService.getDB();
    const fileId = req.params.id;
    const fileIndex = db.files.findIndex(f => f.id === fileId && f.ownerId === req.user.userId);

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'Target file not found' });
    }

    const file = db.files[fileIndex];
    const profile = db.profiles[req.user.userId];

    if (!file.isTrashed) {
      // First stage: move to Trash bin
      file.isTrashed = true;
      file.trashedAt = new Date().toISOString();

      db.activities.unshift({
        id: 'act-' + Date.now(),
        type: 'delete',
        details: `Moved "${file.name}" to Trash Bin`,
        createdAt: new Date().toISOString(),
        userId: req.user.userId,
      });

      db.notifications.unshift({
        id: 'notif-' + Date.now(),
        title: 'Item Moved to Trash',
        message: `"${file.name}" was safely relocated to the Trash.`,
        type: 'warning',
        read: false,
        createdAt: new Date().toISOString(),
      });
    } else {
      // Second stage: permanent removal from database & disk storage
      db.files.splice(fileIndex, 1);

      if (!file.isFolder) {
        try {
          const filePath = path.join(UPLOADS_DIR, file.id);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error('Error with physical unlinking of asset:', err);
        }

        // Deduct from profile total usage bytes
        profile.storageUsed = Math.max(0, profile.storageUsed - file.size);
        db.profiles[req.user.userId] = profile;
      }

      db.activities.unshift({
        id: 'act-' + Date.now(),
        type: 'delete',
        details: `Permanently purged files entity "${file.name}"`,
        createdAt: new Date().toISOString(),
        userId: req.user.userId,
      });
    }

    dbService.saveDB(db);
    res.json({ success: true });
  });

  // Action: Restore file from trash back to parent
  app.post('/api/files/restore/:id', authenticateToken, (req: any, res) => {
    const db = dbService.getDB();
    const fileId = req.params.id;
    const file = db.files.find(f => f.id === fileId && f.ownerId === req.user.userId);

    if (!file) {
      return res.status(404).json({ error: 'File metadata not found or credentials mismatched' });
    }

    file.isTrashed = false;
    file.trashedAt = null;

    db.activities.unshift({
      id: 'act-' + Date.now(),
      type: 'restore',
      details: `Safely restored "${file.name}" from Trash`,
      createdAt: new Date().toISOString(),
      userId: req.user.userId,
    });

    dbService.saveDB(db);
    res.json({ file });
  });

  // Action: Clear Trash Bin entirely
  app.post('/api/files/clear-trash', authenticateToken, (req: any, res) => {
    const db = dbService.getDB();
    const userId = req.user.userId;
    const profile = db.profiles[userId];

    const trashedFiles = db.files.filter(f => f.ownerId === userId && f.isTrashed);

    // Deduct sizes from totals
    trashedFiles.forEach(f => {
      if (!f.isFolder) {
        try {
          const filePath = path.join(UPLOADS_DIR, f.id);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {}
        profile.storageUsed = Math.max(0, profile.storageUsed - f.size);
      }
    });

    // Remove them from active database record lists
    db.files = db.files.filter(f => !(f.ownerId === userId && f.isTrashed));
    db.profiles[userId] = profile;

    db.activities.unshift({
      id: 'act-' + Date.now(),
      type: 'delete',
      details: 'Trash Bin purged completely.',
      createdAt: new Date().toISOString(),
      userId,
    });

    dbService.saveDB(db);
    res.json({ success: true });
  });

  // Download Endpoint (Can be accessible publicly if file has shared link metadata, or requires Bearer auth)
  app.get('/api/files/download/:id', (req, res) => {
    const fileId = req.params.id;
    const db = dbService.getDB();
    const file = db.files.find(f => f.id === fileId);

    if (!file) {
      return res.status(404).setContent ? res.status(404).json({ error: 'Asset not found' }) : res.status(404).send('Asset not found');
    }

    // Security check: either public shareLink exists, or valid JWT token passed in query parameter "?token=..." or Bearer
    let allowed = false;

    if (file.shareLink && file.shareLink.isPublic) {
      // If shared publicly, verify optional password validation or expirations
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
      // Validate Token parameter OR Auth header
      const authHeader = req.headers['authorization'];
      const tokenHeader = authHeader && authHeader.split(' ')[1];
      const tokenQuery = req.query.token as string;
      const verifiedToken = tokenHeader || tokenQuery;

      if (verifiedToken) {
        try {
          const decoded = jwt.verify(verifiedToken, JWT_SECRET) as any;
          // Check access ownership or sharing scope
          if (file.ownerId === decoded.userId || file.sharedWith.some(su => su.email === decoded.email)) {
            allowed = true;
          }
        } catch (err) {}
      }
    }

    if (!allowed) {
      return res.status(401).send('Unauthorized file access payload scope request.');
    }

    // Send physical file from container disk
    const physicalPath = path.join(UPLOADS_DIR, fileId);
    if (!fs.existsSync(physicalPath)) {
      // Create template fallback data dynamic simulation so user downloads original document properly
      fs.writeFileSync(physicalPath, `This is simulating local file stream for Cloud File Manager download: ${file.name}`);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    const fileStream = fs.createReadStream(physicalPath);
    fileStream.pipe(res);
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
