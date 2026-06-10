import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, HardDrive, Share2, Star, Trash2, Clock, Settings, HelpCircle, LogOut, 
  Menu, X, Bell, Search, Activity as ActivityIcon, ChevronRight, User, Plus,
  FileText, Shield, Sparkles, CheckCircle, AlertTriangle, RefreshCw
} from 'lucide-react';

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

  // Restore session on load if possible
  useEffect(() => {
    const savedToken = localStorage.getItem('cfm_token');
    if (savedToken) {
      setToken(savedToken);
      fetchMe(savedToken);
    }
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
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        // Token stale, flush
        localStorage.removeItem('cfm_token');
        setToken(null);
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

  // Login successful
  const handleLoginSuccess = (authToken: string, userData: any) => {
    localStorage.setItem('cfm_token', authToken);
    setToken(authToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Logout clear session
  const handleLogout = () => {
    localStorage.removeItem('cfm_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthStep('landing');
    setActiveView('dashboard');
  };

  // Notification helpers
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

  // Header folder creator form
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Profile circular initials generator
  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'CF';
    const split = nameStr.trim().split(' ');
    if (split.length >= 2) {
      return (split[0][0] + split[1][0]).toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };

  // Menu Options Definitions
  const navigationMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: <Cloud className="w-4 h-4" /> },
    { id: 'files', label: 'My Files', icon: <HardDrive className="w-4 h-4" /> },
    { id: 'shared', label: 'Shared With Me', icon: <Share2 className="w-4 h-4" /> },
    { id: 'recent', label: 'Recent', icon: <Clock className="w-4 h-4" /> },
    { id: 'starred', label: 'Starred', icon: <Star className="w-4 h-4" /> },
    { id: 'trash', label: 'Trash', icon: <Trash2 className="w-4 h-4" /> },
    { id: 'storage', label: 'Storage & Space', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'help', label: 'Help Center', icon: <HelpCircle className="w-4 h-4" /> }
  ];

  // Render logic block
  if (!isAuthenticated) {
    if (authStep === 'landing') {
      return <LandingPage onGetStarted={() => setAuthStep('login')} onLoginClick={() => setAuthStep('login')} />;
    }
    return <LoginForm onLoginSuccess={handleLoginSuccess} onBackToLanding={() => setAuthStep('landing')} />;
  }

  // Active unread alerts
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 flex" id="applet-console-root">
      
      {/* ==================== 1. SIDEBAR NAVIGATION ==================== */}
      <aside className={`fixed inset-y-0 left-0 bg-slate-900 text-slate-400 z-50 w-64 border-r border-slate-800 flex flex-col justify-between transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:flex-shrink-0`}>
        
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          {/* Logo Branding */}
          <div className="flex items-center justify-between px-6 pb-6 border-b border-slate-800">
            <div className="flex items-center space-x-3 text-white">
              <div className="p-2.5 bg-indigo-600 rounded-xl">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-display font-bold text-base tracking-tight block leading-none text-slate-100">Cloud File Manager</span>
                <span className="text-[9px] uppercase font-mono tracking-widest text-indigo-400 font-extrabold block mt-0.5">CFM Platform</span>
              </div>
            </div>
            {/* Close sidebar button on mobile */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links list */}
          <nav className="mt-6 flex-1 px-4 space-y-1 text-xs font-semibold">
            {navigationMenu.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  id={`sidebar-nav-${item.id}`}
                  key={item.id}
                  onClick={() => { 
                    setActiveView(item.id); 
                    setSelectedFolderId(null); // clean root path selection
                    setSidebarOpen(false); 
                  }}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all gap-3 cursor-pointer ${
                    isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User initials-avatar and active profile settings */}
        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 flex items-center justify-center text-slate-900 font-display font-extrabold text-sm border-2 border-slate-705">
              {getInitials(user?.name || '')}
            </div>
            <div className="truncate">
              <span className="font-bold text-slate-200 text-xs block truncate">{user?.name}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">{user?.plan} Customer</span>
            </div>
          </div>

          <button 
            id="sidebar-logout"
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-slate-800 hover:bg-red-950 hover:text-red-400 rounded-xl text-slate-300 font-bold text-[11px] gap-2 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Securely</span>
          </button>
        </div>

      </aside>

      {/* Backdrop overlay on mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ==================== 2. MAIN COGNITIVE LAYOUT ==================== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header toolbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200/60 h-18 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm">
          <div className="flex items-center gap-3.5">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop header breadcrumbs */}
            <div className="hidden sm:inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 font-mono">
              <Cloud className="w-4 h-4 text-slate-500" />
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-slate-700 uppercase">{activeView.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Right utility parameters */}
          <div className="flex items-center space-x-4">
            
            {/* Quick folder trigger dropdown form */}
            <div className="relative">
              <button 
                id="header-create-folder-toggle"
                onClick={() => setIsHeaderFolderOpen(!isHeaderFolderOpen)}
                className="hidden md:inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-55 border border-slate-200 rounded-lg hover:bg-slate-100 font-semibold text-[11px] text-slate-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
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
                      className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 shadow-xl rounded-2xl p-4.5 z-50 text-xs"
                    >
                      <form onSubmit={handleHeaderFolderSubmit} className="space-y-3">
                        <label className="block text-[10px] uppercase font-mono font-bold text-slate-400">Folder Name</label>
                        <input 
                          id="header-folder-input"
                          type="text"
                          required
                          value={headerFolderName}
                          onChange={(e) => setHeaderFolderName(e.target.value)}
                          placeholder="Q3 Analytics Files"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                        />
                        <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-slate-950 font-bold text-white rounded-xl">
                          Create Folder
                        </button>
                      </form>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Notification triggers Bells dropdown */}
            <div className="relative">
              <button 
                id="header-notification-bell"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors relative cursor-pointer"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-red-500"></span>
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
                      className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 z-50 text-xs space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="font-bold text-slate-800">Workspace Alerts ({unreadCount})</span>
                        <div className="space-x-2 text-[10px] font-bold">
                          <button onClick={handleMarkAllNotificationsRead} className="text-indigo-600 hover:underline">Read All</button>
                          <button onClick={handleClearNotifications} className="text-slate-400 hover:underline">Clear</button>
                        </div>
                      </div>

                      {notifications.length === 0 ? (
                        <p className="text-center py-6 text-slate-400 italic">No alert messages logged.</p>
                      ) : (
                        <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                          {notifications.map(n => (
                            <div key={n.id} className={`py-2 text-xs flex flex-col justify-between items-start gap-1 ${n.read ? 'opacity-60' : ''}`}>
                              <div className="flex items-start gap-1.5">
                                <span className={`flex h-1.5 w-1.5 rounded-full mt-1.5 ${n.type === 'error' ? 'bg-red-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                <div>
                                  <p className="font-semibold text-slate-800 leading-tight">{n.title}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                                </div>
                              </div>
                              {!n.read && (
                                <button onClick={() => handleMarkNotificationRead(n.id)} className="text-[9px] text-indigo-600 font-bold self-end">Mark read</button>
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

            {/* Profile Avatar initials */}
            <div className="h-8.5 w-8.5 rounded-full bg-slate-900 text-white font-display font-bold text-xs flex items-center justify-center shadow">
              {getInitials(user?.name || '')}
            </div>

          </div>
        </header>

        {/* ==================== 3. SCROLLABLE SCREEN CONTENT AREA ==================== */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {user && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView + selectedFolderId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
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
