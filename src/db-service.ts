import fs from 'fs';
import path from 'path';
import { CloudFile, Activity, SystemNotification, UserProfile, UserSession } from './types.js';

const DB_FILE = path.join(process.cwd(), 'db.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads folder exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface DBStructure {
  users: Record<string, any>; // email -> hashed password, name, id etc
  profiles: Record<string, UserProfile>; // userId -> Profile
  files: CloudFile[];
  activities: Activity[];
  notifications: SystemNotification[];
  sessions: Record<string, UserSession[]>; // userId -> SessionLog[]
  billingHistory: Record<string, any[]>; // userId -> billing invoice records
}

const DEFAULT_DB: DBStructure = {
  users: {},
  profiles: {},
  files: [],
  activities: [],
  notifications: [],
  sessions: {},
  billingHistory: {}
};

function readDB(): DBStructure {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Failed reading DB, resetting to default', error);
  }
  writeDB(DEFAULT_DB);
  return DEFAULT_DB;
}

function writeDB(db: DBStructure) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed writing DB', error);
  }
}

// Global functions to read and write database records cleanly
export const dbService = {
  getDB: () => readDB(),
  saveDB: (db: DBStructure) => writeDB(db),

  // Seed user with demo files if they is new
  seedDemoData(userId: string, userName: string, userEmail: string) {
    const db = readDB();
    
    // Check if user already has files in db
    const hasFiles = db.files.some(f => f.ownerId === userId);
    if (hasFiles) return;

    // Default directories
    const folders: CloudFile[] = [
      {
        id: 'folder-work',
        name: 'Enterprise Projects',
        size: 0,
        mimeType: 'folder',
        url: '',
        parentId: null,
        isFolder: true,
        isStarred: true,
        isTrashed: false,
        trashedAt: null,
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        ownerId: userId,
        ownerName: userName,
        ownerEmail: userEmail,
        sharedWith: [],
        shareLink: null
      },
      {
        id: 'folder-media',
        name: 'Marketing Assets',
        size: 0,
        mimeType: 'folder',
        url: '',
        parentId: null,
        isFolder: true,
        isStarred: false,
        isTrashed: false,
        trashedAt: null,
        createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
        ownerId: userId,
        ownerName: userName,
        ownerEmail: userEmail,
        sharedWith: [],
        shareLink: null
      },
      {
        id: 'folder-financials',
        name: 'Finance & Q3 Reports',
        size: 0,
        mimeType: 'folder',
        url: '',
        parentId: 'folder-work',
        isFolder: true,
        isStarred: false,
        isTrashed: false,
        trashedAt: null,
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        ownerId: userId,
        ownerName: userName,
        ownerEmail: userEmail,
        sharedWith: [],
        shareLink: null
      }
    ];

    // Some dummy files to showcase the premium dashboards
    const files: CloudFile[] = [
      {
        id: 'file-demo-1',
        name: 'Q3 Enterprise Presentation.pdf',
        size: 14200000, // 14.2 MB
        mimeType: 'application/pdf',
        url: '/api/files/download/file-demo-1',
        parentId: 'folder-financials',
        isFolder: false,
        isStarred: true,
        isTrashed: false,
        trashedAt: null,
        createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        ownerId: userId,
        ownerName: userName,
        ownerEmail: userEmail,
        sharedWith: [
          { email: 'director@enterprise.com', permission: 'viewer' }
        ],
        shareLink: {
          id: 'share-1',
          isPublic: true,
          passwordEnabled: false
        }
      },
      {
        id: 'file-demo-2',
        name: 'Company Logo Grid (High-Res).png',
        size: 4200000, // 4.2 MB
        mimeType: 'image/png',
        url: '/api/files/download/file-demo-2',
        parentId: 'folder-media',
        isFolder: false,
        isStarred: false,
        isTrashed: false,
        trashedAt: null,
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        ownerId: userId,
        ownerName: userName,
        ownerEmail: userEmail,
        sharedWith: [],
        shareLink: null
      },
      {
        id: 'file-demo-3',
        name: 'Enterprise Security Schema.doc',
        size: 850000, // 850 KB
        mimeType: 'application/msword',
        url: '/api/files/download/file-demo-3',
        parentId: null,
        isFolder: false,
        isStarred: true,
        isTrashed: false,
        trashedAt: null,
        createdAt: new Date(Date.now() - 4 * 12 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 12 * 3600 * 1000).toISOString(),
        ownerId: userId,
        ownerName: userName,
        ownerEmail: userEmail,
        sharedWith: [],
        shareLink: null
      },
      {
        id: 'file-demo-4',
        name: 'System Architecture Audit.xlsx',
        size: 1920000, // 1.92 MB
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        url: '/api/files/download/file-demo-4',
        parentId: null,
        isFolder: false,
        isStarred: false,
        isTrashed: false,
        trashedAt: null,
        createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
        ownerId: userId,
        ownerName: userName,
        ownerEmail: userEmail,
        sharedWith: [],
        shareLink: null
      }
    ];

    // Insert these into filesystem so download references work without erroring out
    files.forEach(f => {
      const dummyFilePath = path.join(UPLOADS_DIR, f.id);
      fs.writeFileSync(dummyFilePath, `This is standard simulated binary data storage for the enterprise cloud file manager demo file: ${f.name}`);
    });

    // Populate db profiles storage with demo data
    db.files = [...db.files, ...folders, ...files];

    // Seed activity list
    const startupActivities: Activity[] = [
      {
        id: 'act-1',
        type: 'subscription',
        details: 'Enterprise space provisioned instantly on Cloud File Manager',
        createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
        userId
      },
      {
        id: 'act-2',
        type: 'create_folder',
        details: 'Created directory Marketing Assets',
        createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
        userId
      },
      {
        id: 'act-3',
        type: 'upload',
        details: 'Uploaded Company Logo Grid (High-Res).png',
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        userId,
        fileName: 'Company Logo Grid (High-Res).png',
        fileSize: 4200000
      }
    ];
    db.activities = [...db.activities, ...startupActivities];

    // Seed alert warnings or system notifications
    const startNotifications: SystemNotification[] = [
      {
        id: 'notif-1',
        title: 'Welcome to Cloud File Manager',
        message: 'Your high-performance workspace is active. Let\'s scale your enterprise storage securely.',
        type: 'success',
        read: false,
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'notif-2',
        title: 'Two-Factor Authentication Recommended',
        message: 'Enable 2FA inside profile configuration to meet compliance guarantees.',
        type: 'warning',
        read: false,
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
      }
    ];
    db.notifications = [...db.notifications, ...startNotifications];

    // Calculate user profile storageUsed correctly
    const profile = db.profiles[userId];
    if (profile) {
      const totalUsed = files.reduce((acc, current) => acc + current.size, 0);
      profile.storageUsed = totalUsed;
    }

    writeDB(db);
  }
};
