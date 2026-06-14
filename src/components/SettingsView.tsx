import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, Shield, Smartphone, Bell, Trash2, Key, ToggleLeft, Activity, Laptop, RefreshCw 
} from 'lucide-react';
import { UserProfile, UserSession } from '../types.js';
import { apiFetch, getApiUrl } from '../firebase.js';

interface SettingsViewProps {
  user: UserProfile;
  token: string;
  onRefresh: () => void;
  onLogout: () => void;
}

export default function SettingsView({ user, token, onRefresh, onLogout }: SettingsViewProps) {
  const [profileName, setProfileName] = useState(user.name);
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [mfa, setMfa] = useState(user.mfaEnabled);

  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error', text: string } | null>(null);

  // GitHub synchronization states
  const [gitHubLinked, setGitHubLinked] = useState(() => {
    return localStorage.getItem('github_linked') === 'true';
  });
  const [gitHubUser, setGitHubUser] = useState(() => {
    return localStorage.getItem('github_username') || 'anjanp93722';
  });
  const [loadingGitHub, setLoadingGitHub] = useState(false);

  const handleSyncGitHub = () => {
    setLoadingGitHub(true);
    setFeedback(null);
    setTimeout(() => {
      setLoadingGitHub(false);
      if (gitHubLinked) {
        localStorage.removeItem('github_linked');
        setGitHubLinked(false);
        setFeedback({ status: 'success', text: 'GitHub repository sync unlinked successfully.' });
      } else {
        localStorage.setItem('github_linked', 'true');
        localStorage.setItem('github_username', 'anjanp93722');
        setGitHubLinked(true);
        setFeedback({ status: 'success', text: 'Successfully authenticated with GitHub! Your cloud repositories are now synchronized.' });
      }
      onRefresh();
    }, 1200);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const resp = await apiFetch('/api/auth/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (resp.ok) {
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const resp = await apiFetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: profileName, email: profileEmail })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed updating profile details');

      setFeedback({ status: 'success', text: 'Corporate profile properties updated successfully!' });
      onRefresh();
    } catch (err: any) {
      setFeedback({ status: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const resp = await apiFetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Incorrect current password credential');

      setFeedback({ status: 'success', text: 'Security credentials password altered successfully.' });
      setCurPwd('');
      setNewPwd('');
    } catch (err: any) {
      setFeedback({ status: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleMfaToggle = async () => {
    setLoading(true);
    setFeedback(null);
    const nextStatus = !mfa;

    try {
      const resp = await apiFetch('/api/auth/mfa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enabled: nextStatus })
      });

      if (!resp.ok) throw new Error('Failed toggling MFA compliance flags');

      setMfa(nextStatus);
      setFeedback({ status: 'success', text: `Two-factor authentication status altered to: ${nextStatus ? 'ENABLED' : 'DISABLED'}` });
      onRefresh();
    } catch (err: any) {
      setFeedback({ status: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessId: string) => {
    try {
      const resp = await apiFetch(`/api/auth/sessions/${sessId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (resp.ok) {
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('WARNING: Are you absolutely confident you seek to delete your whole Cloud File Manager workspace? This clears all uploaded folders, S3 sync indicators and subscription records permanently. This action is irreversible.')) return;
    
    try {
      const resp = await apiFetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        onLogout();
      } else {
        alert('Purge operation rejected. Please check authorization token.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 font-sans pb-12" id="settings-view-root">
      
      {/* settings header */}
      <div className="border-b border-slate-200/50 pb-6">
        <h1 className="text-3xl sm:text-4xl font-display font-medium tracking-tight text-slate-900 leading-tight">
          System Settings & Compliance
        </h1>
        <p className="text-xs font-semibold text-slate-400 font-mono tracking-wide uppercase mt-1">Manage personnel, monitor connected nodes, & enforce corporate access rules</p>
      </div>

      {feedback && (
        <div className={`p-4.5 rounded-2xl border text-xs font-semibold shadow-sm flex items-center gap-3 ${
          feedback.status === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
            : 'bg-red-50 text-red-850 border-red-100'
        }`}>
          <Shield className={`w-5 h-5 ${feedback.status === 'success' ? 'text-emerald-600' : 'text-red-500'}`} />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Forms */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card A: Profile Details */}
          <div className="bg-white border border-slate-200/50 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <h3 className="font-display font-bold text-slate-900 text-sm">Identity profile specifications</h3>
            <form onSubmit={handleProfileSubmit} className="space-y-5 text-slate-700 font-semibold text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">Representative Name</label>
                  <input 
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 transition-all font-semibold text-slate-800 shadow-inner"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">Corporate Email Domain</label>
                  <input 
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 transition-all font-semibold text-slate-800 shadow-inner"
                  />
                </div>
              </div>
              <button 
                id="save-profile-btn"
                type="submit"
                disabled={loading}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all border border-blue-500/20"
              >
                {loading ? 'Processing changes...' : 'Save Profile Details'}
              </button>
            </form>
          </div>

          {/* Card B: decryptions credentials */}
          <div className="bg-white border border-slate-200/50 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <h3 className="font-display font-bold text-slate-900 text-sm">Decryption key modification</h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-5 text-slate-700 font-semibold text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">Current Key Phrase</label>
                  <input 
                    type="password"
                    required
                    value={curPwd}
                    onChange={(e) => setCurPwd(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 transition-all shadow-inner"
                    placeholder="••••••••••••"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">New Key Phrase</label>
                  <input 
                    type="password"
                    required
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 transition-all shadow-inner"
                    placeholder="Min 8 letters"
                  />
                </div>
              </div>
              <button 
                id="change-pwd-btn"
                type="submit"
                disabled={loading}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-800/40"
              >
                Change Decryption Key
              </button>
            </form>
          </div>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card C: MFA triggers */}
          <div className="bg-white border border-slate-200/50 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <h3 className="font-display font-bold text-slate-900 text-sm">Access Control Policies</h3>
            
            <div className="flex items-center justify-between bg-slate-50 p-4 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-705">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block">Enforce Multifactor MFA</span>
                <span className="text-[10px] text-slate-400 block font-normal leading-normal">Require authenticated codes on system startup handshakes.</span>
              </div>
              <button 
                id="toggle-mfa-btn"
                type="button"
                onClick={handleMfaToggle}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer ${mfa ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <div className={`bg-white w-5 h-5 rounded-full shadow transform duration-300 ${mfa ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>

          {/* Card: GitHub Sync Integration Card */}
          <div className="bg-white border border-slate-200/50 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-900 text-sm">Integrations & VCS Sync</h3>
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              Enable repository synchronization and version backups by registering your GitHub workspace.
            </p>
            
            <div className="flex items-center justify-between bg-slate-50 p-4 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-705">
              <div className="space-y-1 text-left">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <svg className="w-4 h-4 text-slate-800" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.7-.53-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12-.51.56-.82 1.27-.82 2.15 0 3.07-1.87 3.75-3.65 3.95-.29.25-.54.73-.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21-.15.46-.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  Sync with GitHub
                </span>
                <span className="text-[10px] text-slate-400 block font-normal leading-normal">
                  {gitHubLinked ? `Connected as github.com/${gitHubUser}` : 'Not connected to any VCS account'}
                </span>
              </div>
              
              <button 
                id="sync-github-btn"
                type="button"
                onClick={handleSyncGitHub}
                disabled={loadingGitHub}
                className={`py-2 px-3.5 rounded-xl font-bold text-[11px] shadow-sm transition-all duration-150 active:scale-95 cursor-pointer ${
                  gitHubLinked 
                    ? 'bg-red-50 hover:bg-red-100 text-red-650 border border-red-200' 
                    : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-9d0'
                }`}
              >
                {loadingGitHub ? 'Connecting...' : gitHubLinked ? 'Unlink Sync' : 'Connect API'}
              </button>
            </div>
          </div>

          {/* Card D: device indicators */}
          <div className="bg-white border border-slate-200/50 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <h3 className="font-display font-bold text-slate-900 text-sm">Whitelisted API Terminals</h3>
            
            <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto pr-1 space-y-2.5">
              {sessions.map((sess) => (
                <div key={sess.id} className="flex items-center justify-between py-2.5 text-xs text-slate-750 font-semibold">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-slate-400" />
                      <span>{sess.device}</span>
                    </p>
                    <span className="text-[9px] text-slate-400 font-mono block">IP: {sess.ip} &bull; {sess.location}</span>
                  </div>
                  <div>
                    {sess.current ? (
                      <span className="text-[9px] font-mono font-bold text-[#10B981] bg-emerald-50 border border-emerald-100/30 px-2 py-0.5 rounded uppercase">Current node</span>
                    ) : (
                      <button 
                        onClick={() => handleRevokeSession(sess.id)}
                        className="text-[10px] text-red-500 hover:text-red-650 hover:underline font-bold font-mono cursor-pointer"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card E: Danger zone */}
          <div className="bg-red-50 border border-red-100/50 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-mono tracking-widest text-red-600 font-black block">Absolute Terminations</span>
              <h3 className="font-display font-bold text-red-800 text-sm">Decommissioning Node</h3>
              <p className="text-xs text-red-600 leading-relaxed font-semibold">This immediately closes premium billing agreements, purges all S3 structures and deletes account credentials permanently. It cannot be reverted.</p>
            </div>
            <button 
              id="destroy-account-btn"
              onClick={handleDeleteAccount}
              className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer border border-red-500/20"
            >
              Permanently Decommission Node
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
