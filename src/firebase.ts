import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId); // CRITICAL: The app will break without this line
export const auth = getAuth(app);

// Connectivity check as outlined in guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or connection state.");
    }
  }
}
testConnection();

// Structured Error Handler according to skill specifications
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
          })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Preferred strategy: Set VITE_API_URL to "/api" or default to "/api"
  let apiBase = (import.meta as any).env.VITE_API_URL || '/api';
  
  if (apiBase.endsWith('/')) {
    apiBase = apiBase.slice(0, -1);
  }

  // Prevent double prepend of /api
  if (apiBase === '/api' && cleanPath.startsWith('/api')) {
    return cleanPath;
  }
  
  if (cleanPath.startsWith(apiBase)) {
    return cleanPath;
  }

  return `${apiBase}${cleanPath}`;
}

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const url = getApiUrl(input);
  console.log("API REQUEST:", url);

  const newInit: RequestInit = { ...(init || {}) };
  const headers = new Headers(newInit.headers || {});
  
  if (!headers.has('Authorization')) {
    const fbUser = auth.currentUser;
    if (fbUser) {
      try {
        const idToken = await fbUser.getIdToken();
        headers.set('Authorization', `Bearer ${idToken}`);
      } catch (err) {
        console.error('Could not fetch ID token for apiFetch', err);
      }
    } else {
      const cachedToken = localStorage.getItem('cfm_token');
      if (cachedToken) {
        headers.set('Authorization', `Bearer ${cachedToken}`);
      }
    }
  }
  newInit.headers = headers;

  console.log("AUTH USER:", auth.currentUser);
  console.log("TOKEN:", await auth.currentUser?.getIdToken());
  console.log("REQUEST HEADERS:", [...headers.entries()]);

  return fetch(url, newInit);
}


