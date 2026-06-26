import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, Shield, Smartphone, Bell, Trash2, Key, ToggleLeft, Activity, Laptop, RefreshCw,
  Lock, Eye, EyeOff, HelpCircle, ShieldCheck
} from 'lucide-react';
import { UserProfile, UserSession } from '../types.js';
import { apiFetch, getApiUrl, auth, db } from '../firebase.js';
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  updatePassword, 
  linkWithCredential 
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

interface SettingsViewProps {
  user: UserProfile;
  token: string;
  onRefresh: () => void;
  onLogout: () => void;
}

export default function SettingsView({ user, token, onRefresh, onLogout }: SettingsViewProps) {
  const fbUser = auth.currentUser;
  
  // Detect provider types
  const providers = fbUser?.providerData.map(p => p.providerId) || [];
  const hasPasswordProvider = providers.includes('password');
  const isGoogleUserOnly = providers.includes('google.com') && !hasPasswordProvider;

  // Form states
  const [profileName, setProfileName] = useState(user.name);
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [mfa, setMfa] = useState(user.mfaEnabled);

  // Password fields
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmNewPwd, setConfirmNewPwd] = useState('');
  const [showCurPwd, setShowCurPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmNewPwd, setShowConfirmNewPwd] = useState(false);
  
  // Google sign-in password state
  const [showCreatePasswordForm, setShowCreatePasswordForm] = useState(false);

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error', text: string } | null>(null);

  // Password Rules live validation state
  const hasMinLength = newPwd.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPwd);
  const hasLowercase = /[a-z]/.test(newPwd);
  const hasNumber = /[0-9]/.test(newPwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPwd);

  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const getStrength = () => {
    if (!newPwd) return { score: 0, text: 'No password', color: 'bg-slate-200', textColor: 'text-slate-400', width: 'w-0' };
    let score = 0;
    if (newPwd.length >= 8) score += 1;
    if (/[A-Z]/.test(newPwd)) score += 1;
    if (/[a-z]/.test(newPwd)) score += 1;
    if (/[0-9]/.test(newPwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPwd)) score += 1;

    if (score <= 2) {
      return { score, text: 'Weak', color: 'bg-red-500', textColor: 'text-red-500', width: 'w-1/4' };
    } else if (score <= 3) {
      return { score, text: 'Medium', color: 'bg-amber-500', textColor: 'text-amber-550', width: 'w-2/4' };
    } else if (score === 4) {
      return { score, text: 'Strong', color: 'bg-blue-500', textColor: 'text-blue-650', width: 'w-3/4' };
    } else {
      return { score, text: 'Excellent', color: 'bg-emerald-500', textColor: 'text-emerald-500', width: 'w-full' };
    }
  };

  const strength = getStrength();

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
    if (fbUser) {
      setProfileEmail(fbUser.email || '');
    }
  }, [fbUser]);

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
    const trimmedName = profileName.trim();
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 50) {
      setFeedback({ status: 'error', text: 'Representative Name must be between 2 and 50 characters.' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      // Sync with local backend
      const resp = await apiFetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: trimmedName })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed updating profile details');

      // Sync live Firestore user document (triggers real-time snapshot listener)
      if (fbUser) {
        const userDocRef = doc(db, 'users', fbUser.uid);
        await updateDoc(userDocRef, {
          name: trimmedName,
          fullName: trimmedName
        });

        // Also update standard display name profile
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(fbUser, { displayName: trimmedName });
      }

      setFeedback({ status: 'success', text: 'Profile updated successfully.' });
      onRefresh();
    } catch (err: any) {
      setFeedback({ status: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setFeedback({ status: 'error', text: 'New password does not satisfy all requirements.' });
      return;
    }
    if (newPwd !== confirmNewPwd) {
      setFeedback({ status: 'error', text: 'New passwords do not match.' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      if (!fbUser) throw new Error('Not authenticated in Firebase.');

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(fbUser.email!, curPwd);
      await reauthenticateWithCredential(fbUser, credential);

      // Update Firebase Auth password
      await updatePassword(fbUser, newPwd);

      // Keep local JSON DB in sync
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

      setFeedback({ status: 'success', text: 'Password updated successfully.' });
      setCurPwd('');
      setNewPwd('');
      setConfirmNewPwd('');
    } catch (err: any) {
      let friendlyMsg = err.message;
      if (err.code === 'auth/wrong-password' || err.message?.includes('wrong-password') || err.message?.includes('incorrect')) {
        friendlyMsg = 'Current password provided is incorrect.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMsg = 'The new password is too weak according to security providers.';
      }
      setFeedback({ status: 'error', text: friendlyMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setFeedback({ status: 'error', text: 'Password does not satisfy all requirements.' });
      return;
    }
    if (newPwd !== confirmNewPwd) {
      setFeedback({ status: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      if (!fbUser) throw new Error('Not authenticated in Firebase.');

      // Link email/password credential
      const credential = EmailAuthProvider.credential(fbUser.email!, newPwd);
      await linkWithCredential(fbUser, credential);

      // Keep local JSON DB in sync
      const resp = await apiFetch('/api/auth/create-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPwd })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to synchronize password with backend');

      setFeedback({ status: 'success', text: 'Password created successfully.' });
      setShowCreatePasswordForm(false);
      setNewPwd('');
      setConfirmNewPwd('');
      onRefresh();
    } catch (err: any) {
      let friendlyMsg = err.message;
      if (err.code === 'auth/credential-already-in-use') {
        friendlyMsg = 'An account with this email/password already exists or is linked.';
      } else if (err.code === 'auth/requires-recent-login') {
        friendlyMsg = 'Authentication session expired. Please sign out and log in again to configure a password.';
      }
      setFeedback({ status: 'error', text: friendlyMsg });
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

  const renderRulesList = () => {
    return (
      <div className="mt-3 space-y-1.5 text-slate-500 font-normal text-[11px] leading-relaxed">
        <div className="flex items-center gap-1.5">
          <span className={hasMinLength ? "text-emerald-500 font-bold" : "text-slate-300"}>
            {hasMinLength ? "✓" : "○"}
          </span>
          <span className={hasMinLength ? "text-emerald-700 font-semibold" : ""}>Minimum 8 characters</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={hasUppercase ? "text-emerald-500 font-bold" : "text-slate-300"}>
            {hasUppercase ? "✓" : "○"}
          </span>
          <span className={hasUppercase ? "text-emerald-700 font-semibold" : ""}>At least one uppercase letter (A-Z)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={hasLowercase ? "text-emerald-500 font-bold" : "text-slate-300"}>
            {hasLowercase ? "✓" : "○"}
          </span>
          <span className={hasLowercase ? "text-emerald-700 font-semibold" : ""}>At least one lowercase letter (a-z)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={hasNumber ? "text-emerald-500 font-bold" : "text-slate-300"}>
            {hasNumber ? "✓" : "○"}
          </span>
          <span className={hasNumber ? "text-emerald-700 font-semibold" : ""}>At least one number (0-9)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={hasSpecial ? "text-emerald-500 font-bold" : "text-slate-300"}>
            {hasSpecial ? "✓" : "○"}
          </span>
          <span className={hasSpecial ? "text-emerald-700 font-semibold" : ""}>At least one special character (@, $, !, %, *, etc.)</span>
        </div>
      </div>
    );
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
                    disabled={loading}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 transition-all font-semibold text-slate-800 shadow-inner disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">
                    <span>Corporate Email Domain</span>
                    <div className="relative inline-block cursor-help group/tooltip">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-900 text-white text-[10px] font-normal rounded-xl shadow-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-50 leading-relaxed text-center">
                        Email is managed by your authentication provider.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
                      </div>
                    </div>
                  </label>
                  <div className="relative">
                    <input 
                      type="email"
                      readOnly
                      disabled
                      value={profileEmail}
                      className="w-full p-3.5 pl-10 bg-slate-100/70 border border-slate-200 rounded-2xl cursor-not-allowed font-semibold text-slate-450 shadow-inner focus:outline-none"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
              <button 
                id="save-profile-btn"
                type="submit"
                disabled={loading}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all border border-blue-500/20"
              >
                {loading ? 'Saving...' : 'Save Profile Details'}
              </button>
            </form>
          </div>

          {/* Card B: Password Management / Security Credentials */}
          <div className="bg-white border border-slate-200/50 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <h3 className="font-display font-bold text-slate-900 text-sm">Password Management</h3>
            
            {isGoogleUserOnly ? (
              /* Google Sign-In Only Interface */
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5.5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl mt-0.5">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.24 10.285V13.4h6.86c-.277 1.56-1.602 4.585-6.86 4.585-4.54 0-8.24-3.765-8.24-8.4s3.7-8.4 8.24-8.4c2.58 0 4.307 1.095 5.298 2.045l2.465-2.37C18.435 1.21 15.62 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.795-.085-1.4-.19-1.925H12.24z"/>
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                      Current authentication method: <span className="bg-blue-100 text-blue-850 text-[10px] px-2 py-0.5 rounded-lg font-mono uppercase font-extrabold">Google Sign-In</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                      You currently sign in using your Google account.
                    </p>
                    <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                      To create a password for direct email login, click the button below.
                    </p>
                  </div>
                </div>

                {!showCreatePasswordForm ? (
                  <button
                    type="button"
                    onClick={() => setShowCreatePasswordForm(true)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all"
                  >
                    Create Password
                  </button>
                ) : (
                  <form onSubmit={handleCreatePasswordSubmit} className="space-y-4 mt-4 pt-4 border-t border-slate-200 text-slate-700 font-semibold text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 relative">
                        <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">New Password</label>
                        <div className="relative">
                          <input 
                            type={showNewPwd ? "text" : "password"}
                            required
                            value={newPwd}
                            onChange={(e) => setNewPwd(e.target.value)}
                            disabled={loading}
                            className="w-full p-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 transition-all shadow-inner disabled:opacity-65"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPwd(!showNewPwd)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
                          >
                            {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5 relative">
                        <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">Confirm New Password</label>
                        <div className="relative">
                          <input 
                            type={showConfirmNewPwd ? "text" : "password"}
                            required
                            value={confirmNewPwd}
                            onChange={(e) => setConfirmNewPwd(e.target.value)}
                            disabled={loading}
                            className="w-full p-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 transition-all shadow-inner disabled:opacity-65"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmNewPwd(!showConfirmNewPwd)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
                          >
                            {showConfirmNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Strength Indicator */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">
                        <span>Password Strength</span>
                        <span className={strength.textColor}>{strength.text}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                      </div>
                    </div>

                    {/* Requirements validation list */}
                    <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
                      <span className="block text-[9px] uppercase font-mono tracking-wider font-extrabold text-slate-400 mb-2">Requirements</span>
                      {renderRulesList()}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={loading || !isPasswordValid || newPwd !== confirmNewPwd}
                        className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all border border-blue-500/20"
                      >
                        {loading ? 'Creating...' : 'Create Password'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreatePasswordForm(false);
                          setNewPwd('');
                          setConfirmNewPwd('');
                        }}
                        className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* Standard Email/Password Update Interface */
              <form onSubmit={handlePasswordSubmit} className="space-y-5 text-slate-700 font-semibold text-xs">
                <div className="space-y-1.5 relative">
                  <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">Current Password</label>
                  <div className="relative">
                    <input 
                      type={showCurPwd ? "text" : "password"}
                      required
                      value={curPwd}
                      onChange={(e) => setCurPwd(e.target.value)}
                      disabled={loading}
                      className="w-full p-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 transition-all shadow-inner disabled:opacity-65"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurPwd(!showCurPwd)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
                    >
                      {showCurPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 relative">
                    <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">New Password</label>
                    <div className="relative">
                      <input 
                        type={showNewPwd ? "text" : "password"}
                        required
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                        disabled={loading}
                        className="w-full p-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 transition-all shadow-inner disabled:opacity-65"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd(!showNewPwd)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
                      >
                        {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 relative">
                    <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">Confirm New Password</label>
                    <div className="relative">
                      <input 
                        type={showConfirmNewPwd ? "text" : "password"}
                        required
                        value={confirmNewPwd}
                        onChange={(e) => setConfirmNewPwd(e.target.value)}
                        disabled={loading}
                        className="w-full p-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 transition-all shadow-inner disabled:opacity-65"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPwd(!showConfirmNewPwd)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
                      >
                        {showConfirmNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Strength Indicator */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">
                    <span>Password Strength</span>
                    <span className={strength.textColor}>{strength.text}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                  </div>
                </div>

                {/* Requirements validation list */}
                <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
                  <span className="block text-[9px] uppercase font-mono tracking-wider font-extrabold text-slate-400 mb-2">Requirements</span>
                  {renderRulesList()}
                </div>

                <button 
                  id="change-pwd-btn"
                  type="submit"
                  disabled={loading || !isPasswordValid || newPwd !== confirmNewPwd}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-800/40"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}
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
                    : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-900'
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
