import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, HardDrive, Share2, Star, Trash2, Clock, Settings, HelpCircle, LogOut, 
  Menu, X, Bell, Search, Activity as ActivityIcon, ChevronRight, User, Plus,
  FileText, Shield, Sparkles, CheckCircle, AlertTriangle, RefreshCw, LayoutGrid, Folder, Users, ChevronDown
} from 'lucide-react';

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './firebase.js';
import { doc, onSnapshot, setDoc, updateDoc, getDoc } from 'firebase/firestore';

// Modular Visualizer Imports
import LandingPage from './components/LandingPage.js';
import LoginForm from './components/LoginForm.js';
import DashboardView from './components/DashboardView.js';
import MyFilesView from './components/MyFilesView.js';
import StorageView from './components/StorageView.js';
import SettingsView from './components/SettingsView.js';
import HelpCenterView from './components/HelpCenterView.js';
import { CloudFile, Activity, SystemNotification, UserProfile } from './types.js';

export default function App() {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStep, setAuthStep] = useState<'landing' | 'login'>('landing');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Shell Layout properties
  const [activeView, setActiveView] = useState<string>('dashboard'); // 'dashboard', 'files', 'shared', 'starred', 'recent', 'trash', 'storage', 'settings', 'help'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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

  // Restore session on load natively via Firebase Auth with zero layout shifts or flickering
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          localStorage.setItem('cfm_token', idToken);
          setToken(idToken);
          
          // Connect a live, double-bound listener to the user document in Firestore
          const userDocRef = doc(db, 'users', fbUser.uid);
          const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
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
              setIsAuthenticated(true);
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
              setDoc(userDocRef, freshProfile).catch(err => {
                handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}`);
              });
              setUser(freshProfile as any);
              setIsAuthenticated(true);
            }
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${fbUser.uid}`);
          });

          return () => {
            unsubscribeSnapshot();
          };
        } catch (error) {
          console.error("Auth status restoration handshakes error", error);
        }
      } else {
        localStorage.removeItem('cfm_token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Sync state loops of authenticated files data
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchFiles();
      fetchActivities();
      fetchNotifications();
    }
  }, [isAuthenticated, token, selectedFolderId, activeView]);

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

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setFiles(data.files || []);

        // Aggregate active files sizes and count metrics directly from the collection
        if (auth.currentUser) {
          const allResp = await fetch('/api/files', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const allData = await allResp.json();
          if (allResp.ok && allData.files) {
            const allFilesList = allData.files as CloudFile[];
            const activeFiles = allFilesList.filter(f => !f.isFolder && !f.isTrashed);
            const computedStorageUsed = activeFiles.reduce((acc, f) => acc + (f.size || 0), 0);
            const computedTotalFiles = activeFiles.length;
            const computedSharedFiles = allFilesList.filter(f => !f.isTrashed && (f.sharedWith?.length > 0 || f.shareLink?.isPublic)).length;

            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userDocRef, {
              storageUsed: computedStorageUsed,
              totalFiles: computedTotalFiles,
              sharedFiles: computedSharedFiles
            }).catch(e => {
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
      const resp = await fetch('/api/activity', {
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
      const resp = await fetch('/api/notifications', {
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
    localStorage.removeItem('cfm_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthStep('landing');
    setActiveView('dashboard');
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      const resp = await fetch(`/api/notifications/read/${id}`, {
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
      const resp = await fetch('/api/notifications/read-all', {
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
      const resp = await fetch('/api/notifications/clear', {
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
      const response = await fetch('/api/files/create-folder', {
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

  const navigationMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid className="w-4.5 h-4.5" /> },
    { id: 'files', label: 'My Files', icon: <Folder className="w-4.5 h-4.5" /> },
    { id: 'shared', label: 'Shared with me', icon: <Users className="w-4.5 h-4.5" /> },
    { id: 'recent', label: 'Recent', icon: <Clock className="w-4.5 h-4.5" /> },
    { id: 'trash', label: 'Trash', icon: <Trash2 className="w-4.5 h-4.5" /> },
    { id: 'storage', label: 'Subscription Vault', icon: <Sparkles className="w-4.5 h-4.5" /> },
    { id: 'help', label: 'Compliance Center', icon: <Shield className="w-4.5 h-4.5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4.5 h-4.5" /> }
  ];

  if (!isAuthenticated) {
    if (authStep === 'landing') {
      return <LandingPage onGetStarted={() => setAuthStep('login')} onLoginClick={() => setAuthStep('login')} />;
    }
    return <LoginForm onLoginSuccess={handleLoginSuccess} onBackToLanding={() => setAuthStep('landing')} />;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex p-0 md:p-4 text-slate-800 font-sans" id="applet-console-root">
      
      {/* 1. ULTRA PREMIUM SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 bg-gradient-to-b from-[#1e5ae6] to-[#0e3fa3] text-white z-50 w-68 flex flex-col justify-between transform transition-all duration-300 pointer-events-auto md:my-2 md:ml-2 md:h-[calc(100vh-2.2rem)] md:rounded-3xl border border-white/10 shadow-2xl ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:flex-shrink-0`}>
        
        <div className="flex-1 flex flex-col pt-7 pb-4 overflow-y-auto">
          {/* Executive Header Logo */}
          <div className="flex items-center justify-between px-6 pb-6 border-b border-white/10">
            <div className="flex items-center space-x-3 text-white">
              <div className="p-2.5 bg-white/10 rounded-2xl border border-white/15 relative">
                <Cloud className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[9px] font-bold text-slate-900 border-2 border-[#1e5ae6]">1</span>
              </div>
              <div className="space-y-0.5">
                <span className="font-display font-bold text-base tracking-tight block leading-none">CloudFile</span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#06b6d4] font-semibold block mt-1">Manager</span>
              </div>
            </div>
            
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-1 px-1.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white lg:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Luxury Rounded Menu List */}
          <nav className="mt-7 flex-1 px-4 space-y-1.5">
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
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 gap-3 text-xs font-semibold leading-none cursor-pointer ${
                    isActive 
                      ? 'bg-[#1042AA]/90 text-white shadow-lg shadow-black/10 border border-white/5 font-bold' 
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Storage Panel */}
        <div className="px-5 py-4 border-t border-white/10 space-y-2.5">
          <span className="text-[9px] uppercase font-mono tracking-widest font-bold text-white/50 block">STORAGE</span>
          <div className="flex justify-between items-baseline text-xs font-semibold text-white/90">
            <span>{user ? (user.storageUsed / (1024 * 1024 * 1024)).toFixed(1) : 0} GB</span>
            <span className="text-white/50 text-[10px]">of {user ? (user.storageLimit / (1024 * 1024 * 1024)).toFixed(0) : 200} GB used</span>
          </div>
          <div className="w-full bg-black/15 h-2 rounded-full overflow-hidden border border-white/5">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-blue-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${user ? Math.min(100, (user.storageUsed / user.storageLimit) * 100) : 0}%` }}
            />
          </div>
          <button
            id="sidebar-upgrade-link-btn"
            onClick={() => setActiveView('storage')}
            className="w-full mt-2 py-2.5 bg-white/10 hover:bg-white/15 active:scale-[0.99] border border-white/10 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center"
          >
            Upgrade Storage
          </button>
        </div>

        {/* Corporate bottom node profiles */}
        <div className="px-5 pb-5 pt-3 border-t border-white/10 space-y-4">
          <button 
            onClick={() => setActiveView('settings')}
            className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/8 p-2.5 rounded-2xl border border-white/5 text-left transition-all"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-400 to-[#1e5ae6] flex items-center justify-center text-slate-900 font-display font-semibold text-xs border border-white/20 shadow">
              {getInitials(user?.name || '')}
            </div>
            <div className="truncate flex-1 space-y-0.5">
              <span className="font-semibold text-white text-xs block truncate">{user?.name || 'Alex Johnson'}</span>
              <span className="text-[10px] text-white/60 block truncate">{user?.email || 'alex.johnson@mail.com'}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-white/50" />
          </button>

          <div className="flex items-center justify-between px-2 pt-1">
            <button 
              id="footer-shortcut-settings"
              onClick={() => setActiveView('settings')}
              title="Settings"
              className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
            <button 
              id="footer-shortcut-help"
              onClick={() => setActiveView('help')}
              title="Compliance & Support"
              className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <HelpCircle className="w-4.5 h-4.5" />
            </button>
            <button 
              id="footer-shortcut-logout"
              onClick={handleLogout}
              title="Sign Out Securely"
              className="p-1 rounded text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

      </aside>

      {/* Backdrop overlay on mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-sm" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 2. CHOOSE MAIN LAYOUT SCREEN */}
      <div className="flex-1 flex flex-col overflow-hidden px-4 md:px-6">
        
        {/* Dynamic header toolbar */}
        <header className="bg-[#F8FAFC] h-20 flex items-center justify-between border-b border-slate-200/40 px-1">
          <div className="flex items-center gap-3.5">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 border border-slate-250 lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop breadcrumbs indicators */}
            <div className="hidden sm:inline-flex items-center space-x-2 text-[10px] uppercase font-bold tracking-widest text-[#06B6D4] font-mono leading-none">
              <Cloud className="w-4 h-4 text-slate-400" />
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span>S3 SYSTEM CONSOLE</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-slate-900 font-black">{activeView.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Right Header parameter items */}
          <div className="flex items-center space-x-4">
            
            {/* Quick header folder trigger dropdown */}
            <div className="relative">
              <button 
                id="header-create-folder-toggle"
                onClick={() => setIsHeaderFolderOpen(!isHeaderFolderOpen)}
                className="hidden md:inline-flex items-center space-x-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-55 rounded-xl font-bold text-xs text-slate-700 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 text-slate-500" />
                <span>New Directory Folder</span>
              </button>

              <AnimatePresence>
                {isHeaderFolderOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsHeaderFolderOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute right-0 mt-3 w-68 bg-white border border-slate-250/70 shadow-2xl rounded-2xl p-5 z-50 text-xs space-y-4"
                    >
                      <form onSubmit={handleHeaderFolderSubmit} className="space-y-3.5">
                        <label className="block text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">Folder Name</label>
                        <input 
                          id="header-folder-input"
                          type="text"
                          required
                          value={headerFolderName}
                          onChange={(e) => setHeaderFolderName(e.target.value)}
                          placeholder="Design Blueprints"
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-semibold text-slate-800"
                        />
                        <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 font-bold text-white rounded-xl shadow-md cursor-pointer">
                          Create Folder
                        </button>
                      </form>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Notification system */}
            <div className="relative">
              <button 
                id="header-notification-bell"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2.5 rounded-xl bg-white border border-slate-200/60 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors relative cursor-pointer shadow-sm"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
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
                      className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl p-5 z-50 text-xs space-y-3.5"
                    >
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                        <span className="font-bold text-slate-900 font-display">System Alerts ({unreadCount})</span>
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
                            <div key={n.id} className={`py-3 text-xs flex flex-col justify-between items-start gap-1 ${n.read ? 'opacity-40' : ''}`}>
                              <div className="flex items-start gap-2">
                                <span className={`flex h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'error' ? 'bg-red-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                <div className="space-y-0.5">
                                  <p className="font-bold text-slate-800 leading-snug">{n.title}</p>
                                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">{n.message}</p>
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

            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-display font-black text-xs flex items-center justify-center shadow-md animate-pulse">
              {getInitials(user?.name || '')}
            </div>

          </div>
        </header>

        {/* 3. SCROLLABLE SCREEN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto pt-4 sm:pt-6">
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
                  <DashboardView 
                    user={user}
                    files={files}
                    activities={activities}
                    onUploadClick={() => setActiveView('files')}
                    onCreateFolderClick={() => setActiveView('files')}
                    onNavigateView={(v) => setActiveView(v)}
                    onSelectFolder={setSelectedFolderId}
                  />
                )}

                {['files', 'shared', 'starred', 'recent', 'trash'].includes(activeView) && (
                  <MyFilesView 
                    files={files}
                    onRefresh={fetchFiles}
                    token={token!}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={setSelectedFolderId}
                    onTrackActivity={() => { fetchActivities(); fetchNotifications(); fetchMe(token!); }}
                  />
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

    </div>
  );
}
