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
    // Disabled - New users start with 0 files, 0 GB storage used, and 0 activities.
    // All stats and feeds are computed dynamically based on actual user activity.
  }
};
