import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, Eye, EyeOff, ShieldCheck, Play, ArrowLeft, Cloud } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: (token: string, user: any) => void;
  onBackToLanding: () => void;
}

export default function LoginForm({ onLoginSuccess, onBackToLanding }: LoginFormProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login' ? { email, password } : { email, password, name };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong during login or registers.');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Google Single Sign-on simulation for Rahul Sharma
  const handleGoogleMockLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed Google authenticating handshake.');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setForgotSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 font-sans" id="auth-root">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6"
      >
        {/* Header Branding */}
        <div className="flex items-center justify-between">
          <button 
            onClick={onBackToLanding}
            className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-indigo-600 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
          <div className="flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-indigo-600" />
            <span className="text-xs uppercase font-mono tracking-widest text-slate-400 font-bold">Cloud Manager</span>
          </div>
        </div>

        {/* Form headers */}
        <div className="text-center">
          <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
            {mode === 'login' ? 'Access Secure Vault' : mode === 'register' ? 'Deploy Cloud Account' : 'Recover Access Keys'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' ? 'Authentication compliance check v2.4' : mode === 'register' ? 'Registering initializes 200GB free capacity.' : 'Provide verification email to receive key reset instructions.'}
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-100 flex items-start gap-2">
            <span className="flex h-2 w-2 rounded-full bg-red-600 mt-1.5 flex-shrink-0 animate-pulse"></span>
            <span>{error}</span>
          </div>
        )}

        {mode !== 'forgot' ? (
          <>
            {/* 1. Google Single Sign-on integration block for Developer audit */}
            <button
              id="google-sso-login-btn"
              type="button"
              onClick={handleGoogleMockLogin}
              className="w-full inline-flex items-center justify-center px-4 py-3.5 border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-150 hover:text-indigo-600 rounded-xl transition-all duration-300 relative group active:scale-[0.98] shadow-sm"
            >
              {/* Simulated Google colorful circles or standard icon */}
              <div className="absolute left-4 p-1 bg-white border border-slate-200 rounded-md">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-slate-800 font-mono font-bold">Google Auth: Rahul Sharma</span>
            </button>

            <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold my-4">
              <span className="h-px bg-slate-200 w-1/3"></span>
              <span>or utilize credentials</span>
              <span className="h-px bg-slate-200 w-1/3"></span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 mb-1.5">User Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      id="register-input-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all text-slate-800"
                      placeholder="Rahul Sharma"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 mb-1.5">Corporate Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    id="login-input-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all text-slate-800"
                    placeholder="email@enterprise.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500">Access Password</label>
                  {mode === 'login' && (
                    <button 
                      id="forgot-mode-toggle"
                      type="button" 
                      onClick={() => setMode('forgot')}
                      className="text-[10px] text-indigo-600 font-bold hover:underline"
                    >
                      Forgot keys?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    id="login-input-pwd"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all text-slate-800"
                    placeholder="••••••••••••"
                  />
                  <button 
                    id="toggle-pwd-visibility"
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-slate-900 text-xs font-bold text-white rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? 'Performing authorization check...' : mode === 'login' ? 'Unlock Storage Dashboard' : 'Deploy Virtual Cloud Spaces'}
              </button>
            </form>

            <div className="text-center pt-2">
              {mode === 'login' ? (
                <p className="text-xs text-slate-500">
                  New operator?{' '}
                  <button 
                    id="register-mode-toggle"
                    type="button" 
                    onClick={() => { setMode('register'); setError(null); }}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    Register free workspace
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Already registered?{' '}
                  <button 
                    id="login-mode-toggle"
                    type="button" 
                    onClick={() => { setMode('login'); setError(null); }}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    Enter secure vault
                  </button>
                </p>
              )}
            </div>
          </>
        ) : (
          /* Forgot Password Dialog Template */
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            {forgotSuccess ? (
              <div className="space-y-4 text-center py-6 text-slate-700">
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-full inline-flex border border-emerald-100">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-display font-bold text-lg">Keys Recovery Transmitted!</h4>
                <p className="text-xs text-slate-500">Password recovery token containing validation triggers was delivered. Please review your email inbox.</p>
                <button 
                  type="button" 
                  onClick={() => { setMode('login'); setForgotSuccess(false); }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-xl transition-all"
                >
                  Return to authorization block
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 mb-1.5">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all text-slate-800"
                      placeholder="email@enterprise.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-slate-900 text-xs font-bold text-white rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? 'Locating repository keys...' : 'Transmit decryption keys'}
                </button>

                <button 
                  type="button" 
                  onClick={() => setMode('login')}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-semibold rounded-xl"
                >
                  Cancel Recovery
                </button>
              </>
            )}
          </form>
        )}
      </motion.div>
    </div>
  );
}
