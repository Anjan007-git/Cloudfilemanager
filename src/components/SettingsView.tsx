import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, Shield, Smartphone, Bell, Trash2, Key, ToggleLeft, Activity, Laptop, RefreshCw 
} from 'lucide-react';
import { UserProfile, UserSession } from '../types.js';

interface SettingsViewProps {
  user: UserProfile;
  token: string;
  onRefresh: () => void;
  onLogout: () => void;
}

export default function SettingsView({ user, token, onRefresh, onLogout }: SettingsViewProps) {
  // States
  const [profileName, setProfileName] = useState(user.name);
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [mfa, setMfa] = useState(user.mfaEnabled);

  // Password modification state management
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  
  // Handlers state
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const resp = await fetch('/api/auth/sessions', {
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
      const resp = await fetch('/api/auth/update-profile', {
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
      const resp = await fetch('/api/auth/update-password', {
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
      const resp = await fetch('/api/auth/mfa', {
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
      const resp = await fetch(`/api/auth/sessions/${sessId}`, {
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
      const resp = await fetch('/api/auth/delete-account', {
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
    <div className="space-y-6 font-sans" id="settings-view-root">
      
      {/* settings header */}
      <div className="border-b border-slate-200/50 pb-5">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">Workspace Settings & Compliance</h1>
        <p className="text-xs text-slate-400 mt-1">Manage profile properties, secure device key revocation logs, and multi-factor compliance standards.</p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold ${
          feedback.status === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: forms */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card A: Account Profile Details Form */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-display font-medium text-slate-800 text-sm">Corporate Manager Identity</h3>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">Full Representative Name</label>
                  <input 
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">Authenticated Corporate Email</label>
                  <input 
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-semibold text-slate-800"
                  />
                </div>
              </div>
              <button 
                id="save-profile-btn"
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                {loading ? 'Transmitting properties...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Card B: Decryption Keys Password Modification Form */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-display font-medium text-slate-800 text-sm">Altering Password decryptions</h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">Current Password Key</label>
                  <input 
                    type="password"
                    required
                    value={curPwd}
                    onChange={(e) => setCurPwd(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    placeholder="••••••••••••"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">New Decryption Password</label>
                  <input 
                    type="password"
                    required
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    placeholder="Minimum 8 characters"
                  />
                </div>
              </div>
              <button 
                id="change-pwd-btn"
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-850 font-bold text-xs rounded-xl"
              >
                Modify Access Password
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Security configs, sessions & delete account */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card C: Multi-Factor Authentication Compliance */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-display font-medium text-slate-800 text-sm">Safety Compliance Guard</h3>
            
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="font-semibold text-slate-800 block">Two-Factor Authentication</span>
                <span className="text-[10px] text-slate-400">Forces MFA prompt on standard login handshakes.</span>
              </div>
              <button 
                id="toggle-mfa-btn"
                type="button"
                onClick={handleMfaToggle}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${mfa ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <div className={`bg-white w-5 h-5 rounded-full shadow transform duration-300 ${mfa ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>

          {/* Card D: Registered Device Session Lists */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-display font-medium text-slate-800 text-sm">Active Connected Devices</h3>
            
            <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto pr-2 space-y-2">
              {sessions.map((sess) => (
                <div key={sess.id} className="flex items-center justify-between py-2 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sess.device}</span>
                    </p>
                    <span className="text-[9px] text-slate-400 font-mono block">IP: {sess.ip} | {sess.location}</span>
                  </div>
                  <div>
                    {sess.current ? (
                      <span className="text-[9px] font-mono font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded uppercase">Current Active</span>
                    ) : (
                      <button 
                        onClick={() => handleRevokeSession(sess.id)}
                        className="text-[10px] text-red-500 hover:underline font-semibold font-mono"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card E: Danger Territory */}
          <div className="bg-red-50 border border-red-100 rounded-3xl p-5 sm:p-6 space-y-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-red-600 font-extrabold block">Danger Zone block</span>
              <h3 className="font-display font-semibold text-red-800 text-sm mt-0.5">Terminating Corporate Account</h3>
              <p className="text-xs text-red-600 mt-1">This wipes everything, and cancels all active S3 connections instantly. Receipts cannot be recovered.</p>
            </div>
            <button 
              id="destroy-account-btn"
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow"
            >
              Permanently Purge Workspace
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
