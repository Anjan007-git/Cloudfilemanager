import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Eye, EyeOff, ShieldCheck, ArrowLeft, Cloud, Sparkles, Check, AlertCircle } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithRedirect, 
  signInWithPopup,
  GoogleAuthProvider, 
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase.js';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface LoginFormProps {
  onLoginSuccess: (token: string, user: any) => void;
  onBackToLanding: () => void;
}

export default function LoginForm({ onLoginSuccess, onBackToLanding }: LoginFormProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password strength visual indicator mechanics
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    text: 'Too Short',
    color: 'bg-red-400',
    textColor: 'text-red-500'
  });

  useEffect(() => {
    if (mode !== 'register') return;

    if (!password) {
      setPasswordStrength({ score: 0, text: 'Empty', color: 'bg-slate-200', textColor: 'text-slate-400' });
      return;
    }
    if (password.length < 6) {
      setPasswordStrength({ score: 1, text: 'Weak (Too Short)', color: 'bg-red-400', textColor: 'text-red-500' });
      return;
    }

    let score = 2;
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (hasLetters && hasNumbers) score += 1;
    if (hasSpecial) score += 1;
    if (password.length >= 10) score += 1;

    if (score <= 2) {
      setPasswordStrength({ score: 2, text: 'Medium', color: 'bg-amber-400', textColor: 'text-amber-500' });
    } else if (score === 3) {
      setPasswordStrength({ score: 3, text: 'Strong', color: 'bg-blue-500', textColor: 'text-blue-550' });
    } else {
      setPasswordStrength({ score: 4, text: 'Excellent (Very Secure)', color: 'bg-emerald-500', textColor: 'text-emerald-500' });
    }
  }, [password, mode]);

  // Map Firebase exception codes to graceful user-friendly error banners
  const getFriendlyErrorMessage = (err: any) => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/unauthorized-domain':
        return `This domain (${window.location.hostname}) is unauthorized for Google Sign-In. Go to your Firebase Console > Authentication > Settings > Authorized domains, and add both "${window.location.hostname}" and the parent Domain to the list.`;
      case 'auth/invalid-email':
        return 'Please enter a valid corporate email address format.';
      case 'auth/invalid-credential':
        return 'Incorrect email or security key combination. Please try again.';
      case 'auth/wrong-password':
        return 'The entry password you supplied is incorrect. Reset your keys if forgotten.';
      case 'auth/user-not-found':
        return 'No user operator matches this email address.';
      case 'auth/email-already-in-use':
        return 'This email address is already active in our cloud vaults.';
      case 'auth/weak-password':
        return 'Password is too weak. Security rules require at least 6 characters.';
      case 'auth/network-request-failed':
        return 'Secure connection failed. Check your network configuration.';
      case 'auth/popup-closed-by-user':
        return 'The Google sign-in popup was closed before completion. This often happens inside iframe environments like the AI Studio preview. Try allowing popups, or open the app in a new tab, or use the email sign-in / registration form below.';
      case 'auth/cancelled-popup-request':
        return 'SSO Authorization request was cancelled.';
      default:
        return err?.message || 'Authentication sequence failed. Please verify credentials.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const emailTrimmed = email.trim().toLowerCase();

    try {
      if (!emailTrimmed) {
        throw new Error('Please input a valid email address.');
      }

      if (mode === 'register') {
        if (!name.trim()) {
          throw new Error('Please provide your full identity name.');
        }
        if (password.length < 6) {
          throw new Error('Security keys must be at least 6 characters long.');
        }
        if (password !== confirmPassword) {
          throw new Error('Security key passwords do not match.');
        }

        try {
          // Initialize Firebase account registration
          sessionStorage.setItem('cfm_registration_in_progress', 'true');
          const credentials = await createUserWithEmailAndPassword(auth, emailTrimmed, password);
          const user = credentials.user;

          // Set Firebase display name
          await updateProfile(user, { displayName: name.trim() });

          // Try automatically sending a verification email
          try {
            await sendEmailVerification(user);
          } catch (verifErr) {
            console.error("sendEmailVerification failure", verifErr);
          }

          // Check if profile exists and synchronize default stats in Firestore
          const profileRef = doc(db, 'users', user.uid);
          const now = new Date().toISOString();

          const profileData = {
            uid: user.uid,
            id: user.uid,
            fullName: name.trim(),
            name: name.trim(),
            email: user.email || '',
            createdAt: now,
            updatedAt: now,
            plan: 'free' as const,
            storageUsed: 0,
            storageLimit: 200 * 1024 * 1024 * 1024, // 200 GB
            totalFiles: 0,
            downloads: 0,
            sharedFiles: 0,
            mfaEnabled: false,
          };

          try {
            await setDoc(profileRef, profileData);
          } catch (err: any) {
            handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
          }

          // Sign out immediately so we block this user session until they verify
          await auth.signOut();

          setSuccessMessage("Verification email sent. Please verify your email before signing in.");
          setMode('login');
        } finally {
          sessionStorage.removeItem('cfm_registration_in_progress');
        }
      } else {
        // Standard Email/Password unlock logic
        const credentials = await signInWithEmailAndPassword(auth, emailTrimmed, password);
        const user = credentials.user;

        // Reload user stats to check emailVerified status
        await user.reload();
        const freshUser = auth.currentUser;

        if (freshUser && !freshUser.emailVerified) {
          // Block login
          await auth.signOut();
          throw new Error("Please verify your email before accessing Cloud File Manager.");
        }

        const idToken = await user.getIdToken();

        // 9. Add temporary logs:
        console.log("AUTH USER:", auth.currentUser);
        console.log("EMAIL VERIFIED:", auth.currentUser?.emailVerified);
        console.log("BEFORE FIRESTORE READ:", auth.currentUser);

        // Read real workspace metrics from Firestore
        const profileRef = doc(db, 'users', user.uid);
        let profileSnap;
        
        // 8. Move all Firestore reads behind:
        if (auth.currentUser) {
          try {
            profileSnap = await getDoc(profileRef);
          } catch (err: any) {
            handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          }
        } else {
          console.error("NO AUTH USER AT GETDOC TIME!");
        }
        
        const now = new Date().toISOString();

        let profileData;

        if (profileSnap && profileSnap.exists()) {
          const loadedData = profileSnap.data();
          profileData = {
            ...loadedData,
            id: loadedData.uid || user.uid,
            name: loadedData.fullName || loadedData.name || user.displayName || user.email?.split('@')[0] || 'Cloud Operator',
            mfaEnabled: loadedData.mfaEnabled || false,
            plan: (loadedData.plan || 'free').toLowerCase()
          };
          if (auth.currentUser) {
            try {
              await updateDoc(profileRef, { updatedAt: now });
            } catch (err: any) {
              handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
            }
          }
        } else {
          // Fallback provisioning if authenticated account lacks schema
          profileData = {
            uid: user.uid,
            id: user.uid,
            fullName: user.displayName || name || user.email?.split('@')[0] || 'Cloud Operator',
            name: user.displayName || name || user.email?.split('@')[0] || 'Cloud Operator',
            email: user.email || '',
            createdAt: now,
            updatedAt: now,
            plan: 'free' as const,
            storageUsed: 0,
            storageLimit: 200 * 1024 * 1024 * 1024, // 200 GB
            totalFiles: 0,
            downloads: 0,
            sharedFiles: 0,
            mfaEnabled: false,
          };
          if (auth.currentUser) {
            try {
              await setDoc(profileRef, profileData);
            } catch (err: any) {
              handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
            }
          }
        }

        onLoginSuccess(idToken, profileData);
      }
    } catch (err: any) {
      console.error('Firebase authentication cycle exception', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      // Try popup login style first which is extremely robust under sandboxed preview iframes.
      const result = await signInWithPopup(auth, provider);
      
      if (result?.user) {
        // Retrieve ID token
        const idToken = await result.user.getIdToken();

        // Check if profile exists and synchronize default stats in Firestore
        const profileRef = doc(db, 'users', result.user.uid);
        const now = new Date().toISOString();
        let profileData;

        try {
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            profileData = profileSnap.data();
          }
        } catch (err) {
          console.error("Error reading profile", err);
        }

        if (!profileData) {
          profileData = {
            uid: result.user.uid,
            id: result.user.uid,
            fullName: result.user.displayName || result.user.email?.split('@')[0] || 'Cloud Operator',
            name: result.user.displayName || result.user.email?.split('@')[0] || 'Cloud Operator',
            email: result.user.email || '',
            createdAt: now,
            updatedAt: now,
            plan: 'free' as const,
            storageUsed: 0,
            storageLimit: 200 * 1024 * 1024 * 1024,
            totalFiles: 0,
            downloads: 0,
            sharedFiles: 0,
            mfaEnabled: false,
          };
          try {
            await setDoc(profileRef, profileData);
          } catch (err: any) {
            handleFirestoreError(err, OperationType.CREATE, `users/${result.user.uid}`);
          }
        }

        onLoginSuccess(idToken, profileData);
      }
    } catch (err: any) {
      console.warn('Google verification popup failed or blocked, attempting fallback redirect...', err);
      try {
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
      } catch (redirectErr: any) {
        console.error('Google verification redirect failure', redirectErr);
        setError(getFriendlyErrorMessage(redirectErr));
        setLoading(false);
      }
    } finally {
      if (auth.currentUser) {
        setLoading(false);
      }
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const emailTrimmed = email.trim();

    try {
      if (!emailTrimmed) {
        throw new Error('Please fill in your registered corporate email.');
      }
      await sendPasswordResetEmail(auth, emailTrimmed);
      setForgotSuccess(true);
    } catch (err: any) {
      console.error('Forgot password reset failure event', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC] relative overflow-hidden" id="auth-root">
      {/* Decorative background gradients */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Subtle layout grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
        className="w-full max-w-[440px] bg-white rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-100/80 relative z-10 overflow-hidden p-8 sm:p-10 space-y-8"
      >
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <button 
            onClick={onBackToLanding}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-blue-600 transition-all font-medium group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Go Back</span>
          </button>
          
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
            <Cloud className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">CFM Platform</span>
          </div>
        </div>

        {/* Lead head */}
        <div className="space-y-2">
          <h2 className="text-3xl font-display font-medium tracking-tight text-slate-900 leading-tight">
            {mode === 'login' ? 'Access Secure Vault' : mode === 'register' ? 'Deploy Cloud Space' : 'Recover Access Keys'}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {mode === 'login' ? 'Please log in to manage your high-security S3 workspace.' : mode === 'register' ? 'Deploy a verified private node with 200GB free capacity.' : 'Recover your automated credentials links.'}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="space-y-3">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-100 flex items-start gap-2.5 shadow-sm"
            >
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5">
                <span className="block font-bold">Security Alert</span>
                <span className="text-slate-600 font-medium leading-relaxed">{error}</span>
              </div>
            </motion.div>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="space-y-3">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-2xl border border-emerald-100 flex items-start gap-2.5 shadow-sm"
            >
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5">
                <span className="block font-bold">Verification Pending</span>
                <span className="text-slate-600 font-medium leading-relaxed">{successMessage}</span>
              </div>
            </motion.div>
          </div>
        )}

        {mode !== 'forgot' ? (
          <div className="space-y-6">
            {/* 1. Google Single Sign-on Integration */}
            <div className="space-y-2">
              <span className="block text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">Authorized cloud SSO</span>
              <button
                id="google-sso-login-btn"
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full inline-flex items-center justify-between px-5 py-4 border border-blue-100 bg-gradient-to-r from-blue-50/40 to-cyan-50/20 hover:from-blue-50 hover:to-cyan-50 text-xs rounded-2xl transition-all duration-300 relative group active:scale-[0.99] shadow-sm cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-white border border-blue-100 rounded-lg shadow-sm">
                    {/* Simplified Google Colored Vector representation */}
                    <svg className="w-4 h-4" viewBox="0 0 24 24" width="16" height="16">
                      <path fill="#4285F4" d="M23.745 12.27c0-.77-.07-1.54-.19-2.29H12v4.35h6.6c-.28 1.5-.113 2.76-.96 3.8l3.6 2.79c2.1-1.93 3.3-4.77 3.3-8.65z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.6-2.79c-1.01.68-2.3 1.09-3.79 1.09-2.91 0-5.38-1.97-6.26-4.62H2.18v2.87C4.16 20.12 7.81 24 12 24z" />
                      <path fill="#FBBC05" d="M5.74 14.77c-.22-.68-.35-1.4-.35-2.15s.13-1.47.35-2.15V7.6H2.18A12.01 12.01 0 000 12c0 1.63.33 3.19.92 4.62l4.82-3.85z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 7.81 0 4.16 3.88 2.18 7.6l4.82 3.85c.88-2.65 3.35-4.7 6.26-4.7s2.3 1.09 3.79 1.09z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="block font-display font-medium text-slate-850 text-[12px]">Continue with Google</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-blue-600 font-bold font-mono text-[9px] uppercase bg-blue-100/40 px-2 py-1 rounded-full">
                  <Sparkles className="w-2.5 h-2.5 text-cyan-600 animate-pulse" />
                  <span>SSO Secure</span>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between text-[9px] uppercase font-mono tracking-widest text-slate-400 font-bold my-4">
              <span className="h-px bg-slate-200/60 w-1/4"></span>
              <span>or securely authenticate</span>
              <span className="h-px bg-slate-200/60 w-1/4"></span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">User Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      id="register-input-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-slate-800 shadow-sm"
                      placeholder="Rahul Sharma"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Corporate Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    id="login-input-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-slate-800 shadow-sm"
                    placeholder="email@enterprise.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Access Password</label>
                  {mode === 'login' && (
                    <button 
                      id="forgot-mode-toggle"
                      type="button" 
                      onClick={() => setMode('forgot')}
                      className="text-[10px] text-blue-600 font-bold hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    id="login-input-pwd"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-slate-800 shadow-sm"
                    placeholder="••••••••••••"
                  />
                  <button 
                    id="toggle-pwd-visibility"
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password strength visualizer during registration */}
              {mode === 'register' && password && (
                <div className="space-y-1.5 bg-slate-50 border border-slate-100 p-3 rounded-2xl transition-all">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-bold uppercase tracking-wider font-mono">Password Strength</span>
                    <span className={`font-extrabold ${passwordStrength.textColor}`}>{passwordStrength.text}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
                    <div className={`h-full flex-1 transition-all ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-200'}`} />
                    <div className={`h-full flex-1 transition-all ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-200'}`} />
                    <div className={`h-full flex-1 transition-all ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-200'}`} />
                    <div className={`h-full flex-1 transition-all ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-slate-200'}`} />
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      id="register-input-confirm-pwd"
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-slate-800 shadow-sm"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>
              )}

              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center px-4 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-xs font-bold text-white rounded-2xl shadow-xl shadow-blue-500/15 hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 active:scale-[0.98] cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Authenticating secure vault...</span>
                  </div>
                ) : mode === 'login' ? 'Unlock Storage Console' : 'Deploy Dynamic Workspaces'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100">
              {mode === 'login' ? (
                <p className="text-xs text-slate-500">
                  New remote operator?{' '}
                  <button 
                    id="register-mode-toggle"
                    type="button" 
                    onClick={() => { setMode('register'); setError(null); }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Register Free Workspace
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Already registered?{' '}
                  <button 
                    id="login-mode-toggle"
                    type="button" 
                    onClick={() => { setMode('login'); setError(null); }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Sign in to secure vault
                  </button>
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Forgot Password Dialog */
          <form onSubmit={handleForgotSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {forgotSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 text-center py-6 text-slate-700"
                >
                  <div className="p-3 bg-emerald-50 text-emerald-700 rounded-full inline-flex border border-emerald-100">
                    <ShieldCheck className="w-6 h-6 animate-bounce" />
                  </div>
                  <h4 className="font-display font-bold text-lg text-slate-900">Keys Recovery Transmitted</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    A secure password recovery email has been sent to <span className="font-semibold text-slate-800">{email}</span>. Please click the link inside to set your new security credentials.
                  </p>
                  <button 
                    type="button" 
                    onClick={() => { setMode('login'); setForgotSuccess(false); }}
                    className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition-all cursor-pointer"
                  >
                    Return to login console
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Registered Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-slate-800 shadow-sm"
                        placeholder="email@enterprise.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-2xl shadow-lg shadow-blue-500/10 transition-all cursor-pointer inline-flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Dispatching recovery link...</span>
                      </div>
                    ) : 'Transmit Decryption Keys'}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setMode('login')}
                    className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-xs text-slate-600 font-semibold rounded-2xl border border-slate-200/60 cursor-pointer"
                  >
                    Cancel Recovery
                  </button>
                </div>
              )}
            </AnimatePresence>
          </form>
        )}
      </motion.div>
    </div>
  );
}
