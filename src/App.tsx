import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, HardDrive, Share2, Star, Trash2, Clock, Settings, HelpCircle, LogOut, 
  Menu, X, Bell, Search, Upload, Activity as ActivityIcon, ChevronRight, User, Plus,
  FileText, Shield, Sparkles, CheckCircle, AlertTriangle, RefreshCw, LayoutGrid, Folder, Users, ChevronDown
} from 'lucide-react';

import { onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType, apiFetch } from './firebase.js';
import { doc, onSnapshot, setDoc, updateDoc, getDoc } from 'firebase/firestore';

// Modular Visualizer Imports
import LandingPage from './components/LandingPage.js';
import LoginForm from './components/LoginForm.js';
import DashboardView from './components/DashboardView.js';
import MyFilesView from './components/MyFilesView.js';
import StorageView from './components/StorageView.js';
import SettingsView from './components/SettingsView.js';
import HelpCenterView from './components/HelpCenterView.js';
import ErrorBoundary from './components/ErrorBoundary.js';
import { CloudFile, Activity, SystemNotification, UserProfile } from './types.js';

export default function App() {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const loadedUserRef = useRef<string | null>(null);
  const [authStep, setAuthStep] = useState<'landing' | 'login'>('landing');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [redirectUser, setRedirectUser] = useState<any>(null);

  // Shell Layout properties
  const [activeView, setActiveView] = useState<string>('dashboard'); // 'dashboard', 'files', 'shared', 'starred', 'recent', 'trash', 'storage', 'settings', 'help'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  // Real-time Database Collections states
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  
  // Folders selections
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Quick folders creators states inside root layout
  const [isHeaderFolderOpen, setIsHeaderFolderOpen] = useState(false);
  const [headerFolderName, setHeaderFolderName] = useState('');

  // Notifications dropdown
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Search states moved to global header
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Restore session on load natively via Firebase Auth with zero layout shifts or flickering
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;
    let isMounted = true;

    const redirectResolvedRef = { current: false };
    const authFiredRef = { current: false };

    const evaluateCheckingAuth = (hasUser: boolean) => {
      if (!hasUser) {
        if (redirectResolvedRef.current && authFiredRef.current) {
          console.log("SETTING CHECKING FALSE (No user, redirect completed, auth callback fired)");
          setCheckingAuth(false);
        }
      }
    };

    const setupAuthAndRedirect = async () => {
      // 1. Verify getRedirectResult(auth) is executed on startup & processes secure redirect logins
      const redirectPromise = getRedirectResult(auth)
        .then((result) => {
          console.log("Redirect Result:", result);
          console.log("auth.currentUser:", auth.currentUser);
          if (result?.user) {
            setRedirectUser(result.user);
          }
          redirectResolvedRef.current = true;
          if (isMounted) {
            evaluateCheckingAuth(!!auth.currentUser);
          }
        })
        .catch((error) => {
          console.error("Firebase auth redirect result resolution failure:", error);
          redirectResolvedRef.current = true;
          if (isMounted) {
            evaluateCheckingAuth(!!auth.currentUser);
          }
        });

      // 2. Register onAuthStateChanged to track overall login/session states
      const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
        console.log("AUTH CALLBACK");
        console.log("fbUser:", fbUser);
        console.log("uid:", fbUser?.uid);
        authFiredRef.current = true;
        if (!isMounted) return;

        if (fbUser) {
          // 3. Before checking emailVerified, force refresh the user:
          try {
            await fbUser.reload();
          } catch (e) {
            console.error("Failed to reload user in onAuthStateChanged:", e);
          }
          // 4. Re-read the user after reload:
          const refreshedUser = auth.currentUser;

          const isPasswordUser = fbUser.providerData.some(p => p.providerId === 'password');
          // 5. Only block access if refreshedUser exists AND refreshedUser.emailVerified is false.
          if (isPasswordUser && refreshedUser && !refreshedUser.emailVerified) {
            if (sessionStorage.getItem('cfm_registration_in_progress') === 'true') {
              console.log("Allowing unverified password login temporarily for profile creation");
            } else {
              console.log("Blocking unverified password login UI transition (No immediate signOut inside listener)");
              // 6. Do not sign out immediately from onAuthStateChanged.
              if (isMounted) {
                setCheckingAuth(false);
              }
              return;
            }
          }

          try {
            const idToken = await fbUser.getIdToken();
            localStorage.setItem('cfm_token', idToken);
            setToken(idToken);
            
            // 8. Move all Firestore reads behind:
            if (auth.currentUser) {
              // 9. Add temporary logs:
              console.log("AUTH USER:", auth.currentUser);
              console.log("EMAIL VERIFIED:", auth.currentUser?.emailVerified);
              console.log("BEFORE FIRESTORE READ:", auth.currentUser);

              // Connect a live, double-bound listener to the user document in Firestore
              const userDocRef = doc(db, 'users', fbUser.uid);
              
              if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
              }

              unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
              if (!isMounted) return;
              if (docSnap.exists()) {
                const profile = docSnap.data();
                setUser({
                  ...profile,
                  id: profile.uid || fbUser.uid,
                  name: profile.fullName || profile.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Cloud Operator',
                  email: profile.email || fbUser.email || '',
                  storageUsed: profile.storageUsed ?? 0,
                  storageLimit: profile.storageLimit ?? 200 * 1024 * 1024 * 1024,
                  plan: (profile.plan || 'free').toLowerCase() as any,
                  mfaEnabled: profile.mfaEnabled ?? false
                } as UserProfile);
                console.log("SETTING AUTH TRUE");
                setIsAuthenticated(true);
                console.log("SETTING CHECKING FALSE");
                setCheckingAuth(false);
              } else {
                // Gracefully provision schema documents if missing
                const now = new Date().toISOString();
                const freshProfile = {
                  uid: fbUser.uid,
                  id: fbUser.uid,
                  fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Cloud Operator',
                  name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Cloud Operator',
                  email: fbUser.email || '',
                  createdAt: now,
                  updatedAt: now,
                  plan: 'free',
                  storageUsed: 0,
                  storageLimit: 200 * 1024 * 1024 * 1024, // 200 GB
                  totalFiles: 0,
                  downloads: 0,
                  sharedFiles: 0,
                  mfaEnabled: false
                };
                setDoc(userDocRef, freshProfile).then(() => {
                  if (!isMounted) return;
                  setUser(freshProfile as any);
                  console.log("SETTING AUTH TRUE");
                  setIsAuthenticated(true);
                  console.log("SETTING CHECKING FALSE");
                  setCheckingAuth(false);
                }).catch(err => {
                  console.error("FIRESTORE FAILURE", err);
                  handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}`);
                  if (isMounted) {
                    console.log("SETTING CHECKING FALSE");
                    setCheckingAuth(false);
                  }
                });
              }
            }, (error) => {
              console.error("FIRESTORE FAILURE", error);
              handleFirestoreError(error, OperationType.GET, `users/${fbUser.uid}`);
              if (isMounted) {
                console.log("SETTING CHECKING FALSE");
                setCheckingAuth(false);
              }
            });
            }

          } catch (error) {
            console.error("Auth status restoration handshakes error", error);
            if (isMounted) {
              console.log("SETTING CHECKING FALSE");
              setCheckingAuth(false);
            }
          }
        } else {
          console.error("AUTH STATE CLEARED");
          if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
            unsubscribeSnapshot = null;
          }
          localStorage.removeItem('cfm_token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
          setFiles([]);
          setActivities([]);
          setNotifications([]);
          setSelectedFolderId(null);
          setSearchQuery('');
          setShowSearchResults(false);
          setRedirectUser(null);
          evaluateCheckingAuth(false);
        }
      });

      await redirectPromise;
      return unsubscribeAuth;
    };

    const setupPromise = setupAuthAndRedirect();

    return () => {
      isMounted = false;
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
      setupPromise.then(unsub => {
        if (unsub) unsub();
      });
    };
  }, []);

  // Sync state loops of authenticated files data
  useEffect(() => {
    if (isAuthenticated && token && user) {
      const userId = user.id;
      if (loadedUserRef.current !== userId) {
        setIsSyncingData(true);
        // Clear all user-specific state before loading next account
        setFiles([]);
        setActivities([]);
        setNotifications([]);
        setSelectedFolderId(null);
        setSearchQuery('');
        setShowSearchResults(false);
        
        Promise.all([
          fetchFiles(),
          fetchActivities(),
          fetchNotifications()
        ]).then(() => {
          loadedUserRef.current = userId;
          setIsSyncingData(false);
        }).catch((err) => {
          console.error("Initial data sync failure:", err);
          loadedUserRef.current = userId;
          setIsSyncingData(false);
        });
      } else {
        fetchFiles();
        fetchActivities();
        fetchNotifications();
      }
    } else {
      loadedUserRef.current = null;
      setIsSyncingData(false);
    }
  }, [isAuthenticated, token, user, selectedFolderId, activeView]);

  const fetchMe = async (authToken: string) => {
    // Kept for backward compatibility if child views call onRefresh / fetchMe manually
    if (!auth.currentUser) return;
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const profile = docSnap.data();
        setUser({
          ...profile,
          id: profile.uid || auth.currentUser.uid,
          name: profile.fullName || profile.name || auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Cloud Operator',
          email: profile.email || auth.currentUser.email || '',
          storageUsed: profile.storageUsed ?? 0,
          storageLimit: profile.storageLimit ?? 200 * 1024 * 1024 * 1024,
          plan: (profile.plan || 'free').toLowerCase() as any,
          mfaEnabled: profile.mfaEnabled ?? false
        } as UserProfile);
      }
    } catch (e) {
      console.error("FIRESTORE FAILURE", e);
      console.error('Session handshakes error', e);
    }
  };

  const fetchFiles = async () => {
    if (!token) return;
    try {
      let url = '/api/files?';
      if (activeView === 'starred') url += 'favorite=true';
      else if (activeView === 'trash') url += 'trashed=true';
      else if (activeView === 'shared') url += 'shared=true';
      else if (activeView === 'recent') url += 'sortBy=createdAt&sortOrder=desc';
      else url += `parentId=${selectedFolderId || 'null'}`;

      const response = await apiFetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setFiles(prev => {
          const fetchedItemIds = new Set((data.files || []).map((f: CloudFile) => f.id));
          const merged = [...(data.files || [])];
          
          prev.forEach(f => {
            if (!fetchedItemIds.has(f.id)) {
              const ageMs = Date.now() - new Date(f.createdAt).getTime();
              const fileMatchesContext = 
                (activeView === 'dashboard') ||
                (activeView === 'recent') ||
                (activeView === 'starred' && f.isStarred) ||
                (activeView === 'trash' && f.isTrashed) ||
                (activeView === 'shared' && f.ownerId !== (auth.currentUser?.uid || '')) ||
                (activeView === 'files' && f.parentId === selectedFolderId);
              
              if (ageMs < 45000 && fileMatchesContext) {
                merged.unshift(f);
              }
            }
          });
          
          return merged;
        });

        // Aggregate active files sizes and count metrics directly from the collection
        if (auth.currentUser) {
          const allResp = await apiFetch('/api/files?all=true', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const allData = await allResp.json();
          if (allResp.ok && allData.files) {
            const allFilesList = allData.files as CloudFile[];
            const activeFiles = allFilesList.filter(f => !f.isFolder && !f.isTrashed);
            const computedStorageUsed = activeFiles.reduce((acc, f) => acc + (f.size || 0), 0);
            const computedTotalFiles = activeFiles.length;
            const computedSharedFiles = allFilesList.filter(f => !f.isTrashed && (f.sharedWith?.length > 0 || f.shareLink?.isPublic)).length;

            setUser(prev => {
              if (!prev) return null;
              return {
                ...prev,
                storageUsed: computedStorageUsed,
                totalFiles: computedTotalFiles,
                sharedFiles: computedSharedFiles
              };
            });

            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userDocRef, {
              storageUsed: computedStorageUsed,
              totalFiles: computedTotalFiles,
              sharedFiles: computedSharedFiles
            }).catch(e => {
              console.error("FIRESTORE FAILURE", e);
              handleFirestoreError(e, OperationType.UPDATE, `users/${auth.currentUser?.uid}`);
            });
          }
        }
      }
    } catch (e) {
      console.error('Error loading cloud items', e);
    }
  };

  const fetchActivities = async () => {
    if (!token) return;
    try {
      const resp = await apiFetch('/api/activity', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (resp.ok) {
        setActivities(data.activities || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const resp = await apiFetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (resp.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoginSuccess = (authToken: string, userData: any) => {
    localStorage.setItem('cfm_token', authToken);
    setToken(authToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Firebase cloud logout failure', e);
    }
    console.error("AUTH STATE CLEARED");
    localStorage.removeItem('cfm_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setFiles([]);
    setActivities([]);
    setNotifications([]);
    setSelectedFolderId(null);
    setSearchQuery('');
    setShowSearchResults(false);
    setRedirectUser(null);
    setAuthStep('landing');
    setActiveView('dashboard');
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      const resp = await apiFetch(`/api/notifications/read/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (resp.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const resp = await apiFetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (resp.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearNotifications = async () => {
    try {
      const resp = await apiFetch('/api/notifications/clear', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (resp.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleHeaderFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerFolderName.trim()) return;

    try {
      const response = await apiFetch('/api/files/create-folder', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: headerFolderName.trim(), parentId: selectedFolderId }),
      });

      if (response.ok) {
        setHeaderFolderName('');
        setIsHeaderFolderOpen(false);
        fetchFiles();
        fetchActivities();
        fetchNotifications();
        fetchMe(token!);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'CF';
    const split = nameStr.trim().split(' ');
    if (split.length >= 2) {
      return (split[0][0] + split[1][0]).toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Centralized upload queue state
  const [uploadQueue, setUploadQueue] = useState<any[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const globalFileInputRef = useRef<HTMLInputElement>(null);

  const handleClearCompletedUploads = () => {
    setUploadQueue(prev => prev.filter(q => q.status === 'uploading'));
  };

  const triggerGlobalUpload = () => {
    if (globalFileInputRef.current) {
      globalFileInputRef.current.value = '';
      globalFileInputRef.current.click();
    }
  };

  const handleGlobalFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesUpload(e.target.files);
    }
  };

  const handleFilesUpload = async (items: FileList | File[]) => {
    const queueList = [...uploadQueue];

    for (let i = 0; i < items.length; i++) {
      const element = items[i];
      const trackingId = 'q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      
      const newQueueItem = {
        id: trackingId,
        name: element.name,
        size: element.size,
        progress: 10,
        status: 'uploading',
        part: element
      };

      queueList.push(newQueueItem);
      setUploadQueue([...queueList]);

      const formData = new FormData();
      formData.append('file', element);
      if (selectedFolderId) {
        formData.append('parentId', selectedFolderId);
      }

      // Simulate smooth progress meter ticks
      let simulateProgress = 10;
      const progressTimer = setInterval(() => {
        if (simulateProgress < 85) {
          simulateProgress += 15;
          setUploadQueue(prev => prev.map(item => item.id === trackingId ? { ...item, progress: simulateProgress } : item));
        }
      }, 250);

      try {
        const response = await apiFetch('/api/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        clearInterval(progressTimer);

        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.error || 'Upload failed');
        }
        const uploadedFile = resData.file;

        setUploadQueue(prev => prev.map(item => item.id === trackingId ? { ...item, progress: 100, status: 'completed' } : item));
        
        // Trigger success toast
        setSuccessToast(`Successfully uploaded ${element.name}`);
        setTimeout(() => setSuccessToast(null), 4000);

        if (uploadedFile) {
          setFiles(prev => {
            if (prev.some(f => f.id === uploadedFile.id)) return prev;
            return [uploadedFile, ...prev];
          });
        }

        // Refresh all collections in background to update stats instantly!
        fetchFiles();
        fetchActivities();
        fetchNotifications();
        if (token) {
          fetchMe(token);
        }

      } catch (err: any) {
        clearInterval(progressTimer);
        setUploadQueue(prev => prev.map(item => item.id === trackingId ? { ...item, status: 'error', progress: 0, errorMsg: err.message } : item));
      }
    }
  };

  const navigationMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'files', label: 'My Files', icon: <Folder className="w-4 h-4" /> },
    { id: 'shared', label: 'Shared with me', icon: <Users className="w-4 h-4" /> },
    { id: 'recent', label: 'Recent', icon: <Clock className="w-4 h-4" /> },
    { id: 'starred', label: 'Starred', icon: <Star className="w-4 h-4" /> },
    { id: 'trash', label: 'Trash', icon: <Trash2 className="w-4 h-4" /> },
    { id: 'storage', label: 'Subscription Vault', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  console.log("Current route decision:", {
    hasCurrentUser: !!auth.currentUser,
    redirectUser: !!redirectUser
  });

  if (checkingAuth || isSyncingData) {
    return (
      <div className="h-screen w-full bg-[#F4F7FB] flex flex-col items-center justify-center p-6 text-slate-800 font-sans" id="auth-loading-screen">
        <div className="space-y-6 text-center max-w-sm flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl animate-pulse pointer-events-none w-20 h-20 -m-2" />
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl border border-slate-200/50 relative z-10">
              <Cloud className="w-8 h-8 text-[#005AE2] animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-display font-bold text-slate-950 text-sm tracking-tight">Synchronizing CloudFile Node</h3>
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed uppercase tracking-widest font-mono">
              Verifying MFA credentials...
            </p>
          </div>

          <div className="h-1.5 w-32 bg-slate-200 rounded-full overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full w-20 animate-[loading_1.5s_infinite_ease-in-out]" style={{ animationName: 'loading' }} />
          </div>
          
          <style>{`
            @keyframes loading {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(150%); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (!checkingAuth && !isAuthenticated) {
    if (authStep === 'landing') {
      return <LandingPage onGetStarted={() => setAuthStep('login')} onLoginClick={() => setAuthStep('login')} />;
    }
    return <LoginForm onLoginSuccess={handleLoginSuccess} onBackToLanding={() => setAuthStep('landing')} />;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="h-screen w-full overflow-hidden bg-[#F4F7FB] flex p-0 md:p-4 text-slate-800 font-sans relative" id="applet-console-root">
      
      {/* 1. ULTRA PREMIUM SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 bg-gradient-to-b from-[#005AE2] via-[#004CC9] to-[#00389C] text-white z-50 w-72 flex flex-col transform transition-all duration-200 pointer-events-auto overflow-hidden h-full ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:static md:translate-x-0 md:flex-shrink-0 md:h-full md:rounded-[24px] border border-white/10 shadow-2xl md:mr-2`}>
        
        {/* TOP: Brand Logo & Title */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center text-white">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-blue-950/20 mr-3">
              <Cloud className="w-5 h-5 text-[#005AE2] fill-[#005AE2]/10" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display font-bold text-[16px] tracking-tight text-white leading-none">CloudFile</span>
              <span className="text-[10px] text-blue-200/75 font-medium tracking-wide block mt-1">Enterprise Cloud</span>
            </div>
          </div>
          
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-full text-white/70 hover:bg-white/15 hover:text-white md:hidden cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* CENTER: Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto scrollbar-none py-3 px-3">
          <nav className="space-y-1">
            {navigationMenu.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  id={`sidebar-nav-${item.id}`}
                  key={item.id}
                  onClick={() => { 
                    setActiveView(item.id); 
                    setSelectedFolderId(null); 
                    setSidebarOpen(false); 
                  }}
                  className={`w-full flex items-center px-4 py-2 rounded-full transition-all duration-200 gap-3 text-xs font-semibold leading-none cursor-pointer group ${
                    isActive 
                      ? 'bg-white text-[#005AE2] shadow-md shadow-blue-950/15 font-bold border-none' 
                      : 'text-white/85 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <span className={`transition-transform duration-200 shrink-0 ${isActive ? 'text-[#005AE2]' : 'text-white/70 group-hover:text-white'}`}>
                    {item.icon}
                  </span>
                  <span className="tracking-wide text-[12.5px]">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM: Fixed, Pinned Content (Storage & Account Profile) */}
        <div className="flex-shrink-0">
          {/* Storage Section */}
          <div className="px-6 py-3.5 border-t border-white/10 space-y-2">
            <span className="text-[10px] font-semibold text-blue-200/80 block uppercase tracking-wider">Storage Usage</span>
            <div className="flex items-center justify-between text-xs text-white/85">
              <span className="font-bold text-white">{user ? formatBytes(user.storageUsed) : '0 B'}</span>
              <span className="text-blue-100/70">of {user ? formatBytes(user.storageLimit) : '200 GB'}</span>
            </div>
            <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-cyan-400 h-full rounded-full transition-all duration-500 shadow-sm" 
                style={{ width: `${user ? Math.min(100, (user.storageUsed / user.storageLimit) * 100) : 0}%` }}
              />
            </div>
            <button
              id="sidebar-upgrade-link-btn"
              onClick={() => setActiveView('storage')}
              className="w-full py-2 bg-white/10 hover:bg-white/15 active:scale-95 border border-white/15 text-white text-[11px] font-bold rounded-full transition-all cursor-pointer text-center shadow"
            >
              Upgrade Storage
            </button>
          </div>

          {/* User Account Card */}
          <div className="px-6 pb-5 pt-3.5 border-t border-white/10 space-y-3">
            <button 
              onClick={() => setActiveView('settings')}
              className="w-full flex items-center justify-between bg-white/10 hover:bg-white/15 p-2 rounded-2xl border border-white/10 text-left transition-all duration-200 group shadow-lg shadow-black/5 cursor-pointer"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shrink-0 text-[#005AE2] font-display font-extrabold text-xs shadow border border-white/20">
                  {getInitials(user?.name || '')}
                </div>
                <div className="truncate flex-1">
                  <span className="font-bold text-white text-xs block truncate leading-tight">{user?.name || 'FastFlickFusion'}</span>
                  <span className="text-[10px] text-blue-200/70 block truncate leading-none mt-0.5">{user?.email || 'fastflickfusion@gmail.com'}</span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-white/55 transition-transform duration-200 group-hover:translate-y-0.5 ml-1 flex-shrink-0" />
            </button>

            {/* Bottom Action Icons */}
            <div className="flex items-center justify-around px-1 pt-2.5 border-t border-white/10 text-white/70">
              <button 
                id="footer-shortcut-settings"
                onClick={() => setActiveView('settings')}
                title="Settings"
                className="p-1.5 rounded-full text-white/75 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <Settings className="w-4.5 h-4.5" />
              </button>
              <button 
                id="footer-shortcut-help"
                onClick={() => setActiveView('help')}
                title="Compliance & Support"
                className="p-1.5 rounded-full text-white/75 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <HelpCircle className="w-4.5 h-4.5" />
              </button>
              <button 
                id="footer-shortcut-logout"
                onClick={handleLogout}
                title="Sign Out Securely"
                className="p-1.5 rounded-full text-white/75 hover:bg-red-500/20 hover:text-red-200 transition-all cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

      </aside>

      {/* Backdrop overlay on mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 z-40 md:hidden backdrop-blur-sm" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 2. CHOOSE MAIN LAYOUT SCREEN */}
      <div className="flex-1 flex flex-col overflow-hidden px-4 md:px-8">
        
        {/* Premium Redesigned Top Header Panel */}
        <header className="py-3 flex items-center justify-between border-b border-slate-100 flex-shrink-0 gap-4 mt-1 mb-2 select-none">
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            {/* Mobile menu trigger */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 rounded-xl text-slate-500 hover:bg-white hover:border-slate-300 border border-slate-200 md:hidden cursor-pointer shadow-sm transition-all flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Workspace Search Bar */}
            <div className="relative flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  placeholder="Search files and folders..."
                  className="w-full pl-11 pr-16 py-2.5 bg-slate-50/60 hover:bg-slate-50 border border-slate-200/60 rounded-2xl text-[13px] font-semibold focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm transition-all text-slate-850 placeholder:text-slate-400/80"
                />
                <div className="absolute right-4.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center space-x-1 pointer-events-none">
                  <kbd className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-[9px] font-bold text-slate-400/90 shadow-sm">⌘K</kbd>
                </div>
              </div>

              {/* Search Dropdown Suggestion Panel */}
              <AnimatePresence>
                {showSearchResults && searchQuery.trim() && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSearchResults(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 8, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.99 }}
                      className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden text-left"
                    >
                      <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span>SUGGESTED FILES & DIRECTORIES</span>
                        <span>{files.filter(f => !f.isTrashed && f.name.toLowerCase().includes(searchQuery.toLowerCase())).length} item(s)</span>
                      </div>

                      {files.filter(f => !f.isTrashed && f.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 italic">
                          No matching items found for "{searchQuery}"
                        </div>
                      ) : (
                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                          {files.filter(f => !f.isTrashed && f.name.toLowerCase().includes(searchQuery.toLowerCase())).map((file) => (
                            <button
                              key={file.id}
                              onClick={() => {
                                if (file.isFolder) {
                                  setSelectedFolderId(file.id);
                                  setActiveView('files');
                                } else {
                                  if (file.url) {
                                    window.open(file.url, '_blank');
                                  }
                                }
                                setSearchQuery('');
                                setShowSearchResults(false);
                              }}
                              className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-50/50 transition-all cursor-pointer text-left"
                            >
                              <div className="flex items-center space-x-3 truncate">
                                <div className="p-2 rounded-xl bg-slate-100 flex-shrink-0">
                                  {file.isFolder ? (
                                    <Folder className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-blue-500" />
                                  )}
                                </div>
                                <div className="truncate">
                                  <p className="text-xs font-bold text-slate-800 truncate leading-tight">{file.name}</p>
                                  <p className="text-[10px] text-slate-400 block mt-1">
                                    {file.isFolder ? 'Folder' : `${formatBytes(file.size)} • ${file.mimeType}`}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2 text-[10px] font-bold text-blue-600">
                                <span>Open</span>
                                <ChevronRight className="w-3 h-3" />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Header actions ordered EXACTLY Notification -> New Folder -> Upload -> Profile */}
          <div className="flex items-center space-x-3.5 flex-shrink-0">
            
            {/* 1. NOTIFICATION BELL */}
            <div className="relative">
              <button 
                id="header-notification-bell"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-3 rounded-2xl bg-white border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 text-slate-500 hover:text-slate-700 transition-all relative cursor-pointer shadow-sm active:scale-95"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 shadow-2xl rounded-3xl p-6 z-50 text-xs space-y-3.5"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <span className="font-bold text-slate-900 font-display text-sm">System Alerts ({unreadCount})</span>
                        <div className="space-x-3.5 text-[10px] font-bold font-mono uppercase">
                          <button onClick={handleMarkAllNotificationsRead} className="text-blue-600 hover:underline cursor-pointer">Read All</button>
                          <button onClick={handleClearNotifications} className="text-slate-400 hover:underline cursor-pointer">Clear</button>
                        </div>
                      </div>

                      {notifications.length === 0 ? (
                        <p className="text-center py-8 text-slate-400 italic font-semibold">No operational message logs recorded.</p>
                      ) : (
                        <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                          {notifications.map(n => (
                            <div key={n.id} className={`py-3 text-xs flex flex-col justify-between items-start gap-1 ${n.read ? 'opacity-45' : ''}`}>
                              <div className="flex items-start gap-2">
                                <span className={`flex h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'error' ? 'bg-red-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                <div className="space-y-0.5">
                                  <p className="font-bold text-slate-800 leading-snug">{n.title}</p>
                                  <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">{n.message}</p>
                                </div>
                              </div>
                              {!n.read && (
                                <button onClick={() => handleMarkNotificationRead(n.id)} className="text-[9px] text-blue-600 font-bold self-end hover:underline mt-1 cursor-pointer">Mark read</button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* 2. NEW FOLDER BUTTON */}
            <div className="relative">
              <button 
                id="header-create-folder-toggle"
                onClick={() => setIsHeaderFolderOpen(!isHeaderFolderOpen)}
                className="inline-flex items-center space-x-2 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-2xl font-bold text-xs text-slate-700 cursor-pointer shadow-sm transition-all duration-150 active:scale-95"
              >
                <Folder className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">New Folder</span>
              </button>

              <AnimatePresence>
                {isHeaderFolderOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsHeaderFolderOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute right-0 mt-3 w-72 bg-white border border-slate-200 shadow-2xl rounded-3xl p-6 z-50 text-xs space-y-4"
                    >
                      <form onSubmit={handleHeaderFolderSubmit} className="space-y-4 text-left">
                        <label className="block text-xs font-semibold text-slate-700">Folder Name</label>
                        <input 
                          id="header-folder-input"
                          type="text"
                          required
                          value={headerFolderName}
                          onChange={(e) => setHeaderFolderName(e.target.value)}
                          placeholder="Design Blueprints"
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 font-semibold text-slate-800"
                        />
                        <button type="submit" className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 font-bold text-white rounded-2xl shadow-md transition-all cursor-pointer">
                          Create Folder
                        </button>
                      </form>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* 3. UPLOAD BUTTON */}
            <button 
              onClick={triggerGlobalUpload}
              className="h-10 px-5 inline-flex items-center justify-center gap-2 bg-[#005AE2] hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/10 active:scale-95 cursor-pointer transition-all duration-150"
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Upload</span>
            </button>

            {/* 4. PROFILE BADGE */}
            <button 
              onClick={() => setActiveView('settings')}
              className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-display font-black text-xs flex items-center justify-center shadow-md hover:scale-105 duration-150 relative transition-transform cursor-pointer"
            >
              {getInitials(user?.name || '')}
            </button>

          </div>
        </header>

        {/* Dynamic header path info */}
        {selectedFolderId && (
          <div className="flex items-center justify-between mb-4 mt-4 px-1 flex-shrink-0">
            <button 
              onClick={() => setSelectedFolderId(null)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 tracking-wide transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>←</span>
              <span>Back to Root Workspace</span>
            </button>
          </div>
        )}

        {/* 3. SCROLLABLE SCREEN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto pt-6 pb-8 scroll-smooth">
          {user && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView + selectedFolderId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.18 }}
                className="max-w-7xl mx-auto"
              >
                {activeView === 'dashboard' && (
                  <ErrorBoundary areaName="Dashboard" onReset={fetchFiles}>
                    <DashboardView 
                      user={user}
                      files={files}
                      activities={activities}
                      onUploadClick={triggerGlobalUpload}
                      onCreateFolderClick={() => setActiveView('files')}
                      onNavigateView={(v) => setActiveView(v)}
                      onSelectFolder={setSelectedFolderId}
                      token={token!}
                      onRefresh={fetchFiles}
                    />
                  </ErrorBoundary>
                )}

                {['files', 'shared', 'starred', 'recent', 'trash'].includes(activeView) && (
                  <ErrorBoundary areaName="Files Workspace" onReset={fetchFiles}>
                    <MyFilesView 
                      files={files}
                      onRefresh={fetchFiles}
                      token={token!}
                      selectedFolderId={selectedFolderId}
                      onSelectFolder={setSelectedFolderId}
                      onTrackActivity={() => { fetchActivities(); fetchNotifications(); fetchMe(token!); }}
                      uploadQueue={uploadQueue}
                      onUploadFiles={handleFilesUpload}
                      onClearCompletedUploads={handleClearCompletedUploads}
                      activeView={activeView}
                    />
                  </ErrorBoundary>
                )}

                {activeView === 'storage' && (
                  <StorageView 
                    user={user}
                    token={token!}
                    onRefresh={() => fetchMe(token!)}
                  />
                )}

                {activeView === 'settings' && (
                  <SettingsView 
                    user={user}
                    token={token!}
                    onRefresh={() => fetchMe(token!)}
                    onLogout={handleLogout}
                  />
                )}

                {activeView === 'help' && (
                  <HelpCenterView 
                    token={token!}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

      </div>

      {/* Hidden file input for central global uploads */}
      <input 
        type="file" 
        multiple 
        ref={globalFileInputRef} 
        onChange={handleGlobalFileInputChange} 
        className="hidden" 
      />

      {/* Elegant Real-time Floating Upload Queue monitor */}
      {uploadQueue.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-white border border-slate-200 text-slate-700 rounded-3xl p-5 space-y-4 shadow-2xl z-50 w-80 max-w-full font-sans" id="central-uploader-monitor">
          <div className="flex items-center justify-between pb-3 border-b border-slate-150">
            <div className="flex items-center space-x-2.5">
              <span className={`flex h-2.5 w-2.5 rounded-full ${uploadQueue.some(q => q.status === 'uploading') ? 'bg-blue-600 animate-pulse' : 'bg-emerald-500'}`}></span>
              <p className="font-display font-semibold text-slate-800 text-sm">
                {uploadQueue.some(q => q.status === 'uploading') ? 'Uploading files' : 'Upload completed'}
              </p>
            </div>
            <button 
              onClick={handleClearCompletedUploads}
              className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
              title="Close Queue Monitor"
            >
              <X className="w-4 h-4 font-bold" />
            </button>
          </div>
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {uploadQueue.map(item => (
              <div key={item.id} className="flex items-center justify-between text-xs bg-slate-50 hover:bg-slate-100/60 p-3 rounded-2xl border border-slate-100/80 transition-all hover:shadow-xs">
                <div className="flex items-center space-x-3 w-2/3">
                  <div className="p-2 bg-white rounded-xl border border-slate-200/50 text-blue-500 shadow-xs">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                  </div>
                  <div className="truncate text-left space-y-0.5">
                    <p className="font-semibold text-slate-800 truncate pr-1" title={item.name}>{item.name}</p>
                    <span className="text-[10px] text-slate-400 font-medium font-sans block">{formatBytes(item.size)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {item.status === 'uploading' && (
                    <span className="text-blue-600 bg-blue-50 border border-blue-100 font-semibold px-2 py-0.5 rounded-full text-[10.5px] animate-pulse">
                      {item.progress}%
                    </span>
                  )}
                  {item.status === 'completed' && (
                    <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 font-semibold px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1.5">
                      ✓ Uploaded
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span className="text-red-600 bg-red-50 border border-red-100 font-semibold px-2.5 py-0.5 rounded-full text-[10px]" title={item.errorMsg}>
                      ⚠ Error
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Elegant Success Toast Overlay */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-6 bg-white border border-slate-205 text-slate-800 rounded-3xl p-5 shadow-2xl z-50 flex items-center space-x-4 max-w-sm"
            id="success-upload-toast"
          >
            <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100 shadow-sm flex items-center justify-center">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 font-sans mb-0.5">Upload completed</p>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed truncate max-w-[200px]" title={successToast}>
                {successToast}
              </p>
            </div>
            <button onClick={() => setSuccessToast(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-50 rounded-full cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
