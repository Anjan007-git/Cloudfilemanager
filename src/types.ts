export interface SharedUser {
  email: string;
  permission: 'owner' | 'editor' | 'viewer' | 'download_only';
}

export interface ShareLink {
  id: string;
  isPublic: boolean;
  passwordEnabled: boolean;
  password?: string | null;
  expiresAt?: string | null;
}

export interface CloudFile {
  id: string;
  name: string;
  size: number; // in bytes
  mimeType: string;
  url: string; // download url
  parentId: string | null; // for folders structure
  isFolder: boolean;
  isStarred: boolean;
  isTrashed: boolean;
  trashedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  sharedWith: SharedUser[];
  shareLink: ShareLink | null;
}

export interface Activity {
  id: string;
  type: 'upload' | 'delete' | 'restore' | 'share' | 'create_folder' | 'rename' | 'security' | 'subscription';
  details: string;
  createdAt: string;
  userId: string;
  fileName?: string;
  fileSize?: number;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface UserSession {
  id: string;
  device: string;
  ip: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  storageUsed: number; // bytes
  storageLimit: number; // bytes
  plan: 'free' | 'pro' | 'business' | 'enterprise';
  createdAt: string;
  mfaEnabled: boolean;
}

export interface SubscriptionPlan {
  id: 'free' | 'pro' | 'business' | 'enterprise';
  name: string;
  storageLimit: number; // bytes
  priceMonthly: number;
  priceYearly: number;
  features: string[];
}
