import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, Shield, Zap, RefreshCw, Smartphone, Archive, History, FolderOpen, Lock, 
  ArrowRight, Check, Star, Mail, User, HelpCircle, ChevronDown, ChevronUp, Globe, FileText
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLoginClick: () => void;
}

export default function LandingPage({ onGetStarted, onLoginClick }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactForm.name && contactForm.email && contactForm.message) {
      setContactSubmitted(true);
      setTimeout(() => {
        setContactSubmitted(false);
        setContactForm({ name: '', email: '', message: '' });
      }, 3000);
    }
  };

  // Pricing calculations
  const priceMultiplier = billingPeriod === 'yearly' ? 0.8 : 1; // 20% discount

  const featuresList = [
    { icon: <Shield className="w-5 h-5 text-indigo-600" />, title: "Secure Storage", desc: "Military-grade AES 256 encryption at rest and TLS 1.3 in transit." },
    { icon: <Zap className="w-5 h-5 text-indigo-600" />, title: "Lightning Uploads", desc: "High-performance parallel streaming speeds up transfers by up to 400%." },
    { icon: <RefreshCw className="w-5 h-5 text-indigo-600" />, title: "Real-time Sync", desc: "Instantly synchronizes assets across workstations, web clients, and mobile tablets." },
    { icon: <ArrowRight className="w-5 h-5 text-indigo-600" />, title: "Secure Sharing Links", desc: "Public, password-protected, or timed expiring download links." },
    { icon: <Smartphone className="w-5 h-5 text-indigo-600" />, title: "Cross-Device Continuity", desc: "Access entire workspaces on any screen without installation." },
    { icon: <Archive className="w-5 h-5 text-indigo-600" />, title: "Automatic Backup", desc: "Interval automated snapshots keep critical data continuously protected." },
    { icon: <History className="w-5 h-5 text-indigo-600" />, title: "Advanced Version History", desc: "Restore previous iteration uploads up to 90 days prior." },
    { icon: <FolderOpen className="w-5 h-5 text-indigo-600" />, title: "Dynamic Folder Nesting", desc: "Structured tag collections and deep sub-folder architectures." },
    { icon: <Lock className="w-5 h-5 text-indigo-600" />, title: "Enterprise Compliance Audit", desc: "Comprehensive session audit logging for internal reporting." },
  ];

  const pricingPlans = [
    {
      id: 'free',
      name: "Free Workspace",
      storage: "200 GB",
      price: 0,
      badge: "Individual",
      desc: "Perfect for testing cloud tools and backup safety margins.",
      features: [
        "200 GB Secure Space",
        "Single uploads up to 50MB",
        "Basic file sharing links",
        "Public share directories",
        "Standard helpdesk ticketing"
      ]
    },
    {
      id: 'pro',
      name: "Global Pro",
      storage: "1 TB",
      price: 9.99,
      badge: "Popular Plan",
      desc: "Architectures for content creators and remote experts.",
      features: [
        "1 TB Enterprise Storage",
        "Single uploads up to 5GB",
        "Password-protected lock-links",
        "Time-expires link triggers",
        "Micro activity metrics logs",
        "Accelerate CDN uploads",
        "Priority live email support"
      ]
    },
    {
      id: 'business',
      name: "Business Server",
      storage: "5 TB",
      price: 29.99,
      badge: "Recommended",
      desc: "Built to power team workflows and high-speed media projects.",
      features: [
        "5 TB Fully Managed Space",
        "Single uploads up to 20GB",
        "Advanced folder read/write authorization",
        "Unlimited custom links",
        "90-day comprehensive historical logs",
        "Custom branded portal assets",
        "2FA team-wide compliance controls",
        "Dedicated VIP line 24/7"
      ]
    }
  ];

  const faqItems = [
    { q: "How secure is Cloud File Manager?", a: "Every single asset uploaded is instantly split and encrypted using client-side military grade AES-256 standard and stored redundantly. Communication is protected via state-of-the-art TLS 1.3 handshake protocols." },
    { q: "Can we configure sharing permission levels?", a: "Absolutely. When sharing files or nested folder structures, you can dynamically assign Viewer, Editor, or Download-Only restrictions to target emails." },
    { q: "Is there a custom local backup utility available?", a: "Yes, our web client supports real-time sync states. Once synchronized, local and cloud items mirror adjustments in real time automatically." },
    { q: "What happens if we reach our current storage ceiling?", a: "We notify you before storage is exhausted. You can easily scale to higher capacities instantly via Subscription Settings." },
    { q: "Do you support Google Account Authentication?", a: "Yes, Cloud File Manager includes Google Single-Sign-On (OAuth). You can authenticate and sync workspace profiles with a single tap securely." }
  ];

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-500 selection:text-white" id="landing-page-root">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight text-slate-900 block leading-none">Cloud File Manager</span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-600 font-semibold">Premium Platform</span>
            </div>
          </div>

          <nav className="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-indigo-600 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center space-x-4">
            <button 
              id="header-login-btn"
              onClick={onLoginClick} 
              className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors px-4 py-2"
            >
              Sign In
            </button>
            <button 
              id="header-cta-btn"
              onClick={onGetStarted} 
              className="hidden sm:inline-flex items-center justify-center text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/15"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 text-center lg:text-left">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6"
              >
                <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
                <span>Version 2.4 Enterprise Release</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight text-slate-900 leading-[1.1]"
              >
                Your secure portal for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-500">enterprise-grade</span> cloud file sync.
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0"
              >
                Collaborate safely with colleagues, monitor performance logs, and manage TB scales with beautiful file explorer control. Backed by TLS 1.3 encryption.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <button 
                  id="hero-get-started-btn"
                  onClick={onGetStarted}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-indigo-600 hover:bg-slate-900 transition-all duration-300 shadow-xl shadow-indigo-600/20"
                >
                  Create Secure Account
                  <ArrowRight className="ml-2 w-5 h-5" />
                </button>
                <button 
                  id="hero-login-btn"
                  onClick={onLoginClick}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 border border-slate-200 bg-white text-base font-semibold rounded-xl text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  Sign In with Google
                </button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12 pt-8 border-t border-slate-200/60"
              >
                <span className="text-xs uppercase font-mono tracking-widest text-slate-400 font-bold block mb-4">Trusted by modern organizations globally</span>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-4 opacity-50 grayscale hover:opacity-80 transition-opacity">
                  <span className="font-display font-semibold text-lg text-slate-800 tracking-wider">Vercel</span>
                  <span className="font-display font-bold text-lg text-slate-800 tracking-tight">Stripe</span>
                  <span className="font-display font-medium text-lg text-slate-800 tracking-widest">LINEAR</span>
                  <span className="font-display font-bold text-lg text-slate-800">Dropbox</span>
                </div>
              </motion.div>
            </div>

            {/* Storage Visualization Widget */}
            <div className="lg:col-span-6 relative">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 relative overflow-hidden max-w-lg mx-auto"
              >
                {/* Simulated Explorer Frame */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-red-400 block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-400 block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-400 block"></span>
                    <span className="text-xs font-mono text-slate-400 ml-2">secure_vault_sandbox_2.4</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-mono rounded border border-emerald-100">● Live Synchronization Active</span>
                </div>

                {/* Dashboard mock layout */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-100 rounded-xl text-indigo-700">
                        <Cloud className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-600 block">Enterprise Capacity</span>
                        <span className="text-lg font-bold font-display text-slate-800">14.2 GB / 200 GB</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-indigo-600 block">Free Account</span>
                      <span className="text-[10px] text-slate-400 block">Rahul Sharma</span>
                    </div>
                  </div>

                  {/* Progressive Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
                      <span>Total space allocated</span>
                      <span>7.1% Capacity Filled</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: '7.1%' }}></div>
                    </div>
                  </div>

                  {/* File Categories */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                      <FileText className="w-4 h-4 text-emerald-600 mb-1.5" />
                      <span className="text-xs font-medium text-slate-500 block">PDF Documents</span>
                      <span className="text-sm font-bold text-slate-700">14.2 MB (1 file)</span>
                    </div>
                    <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                      <Archive className="w-4 h-4 text-sky-500 mb-1.5" />
                      <span className="text-xs font-medium text-slate-500 block">Media Assets</span>
                      <span className="text-sm font-bold text-slate-700">4.2 MB (1 file)</span>
                    </div>
                  </div>

                  {/* Sync animation list */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Activity Log Sync Flow</span>
                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-slate-700">Company Logo Grid (High-Res).png</p>
                      </div>
                      <span className="text-emerald-700 font-mono font-semibold">Ready</span>
                    </div>
                    <div className="flex items-center justify-between text-xs bg-indigo-50/30 p-2.5 rounded-xl border border-indigo-100">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-indigo-900">Enterprise Security Schema.doc</p>
                      </div>
                      <span className="text-indigo-600 font-mono font-semibold">Synchronized</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Features Bento Grid */}
      <section id="features" className="py-20 bg-white border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-mono tracking-widest text-indigo-600 font-bold">Engineered with Precision</h2>
            <p className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mt-2">Enterprise-grade capabilities for professional teams.</p>
            <p className="text-slate-500 mt-3">From real-time synchronization pipelines to secure encrypted storage, everything you need is ready.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresList.map((f, i) => (
              <div 
                key={i}
                className="p-6 bg-slate-50 rounded-2xl border border-slate-200/50 hover:border-indigo-200 hover:bg-white hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-600/5 transition-all duration-300"
              >
                <div className="p-3 bg-indigo-50 rounded-xl inline-flex mb-4">
                  {f.icon}
                </div>
                <h3 className="font-display font-bold text-slate-800 text-lg mb-1">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Pricing Matrix */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs uppercase font-mono tracking-widest text-indigo-600 font-bold">Simple, transparent billing pricing</h2>
            <p className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mt-2">Choose the plan that fits your growth.</p>
            
            {/* Billing period toggle */}
            <div className="inline-flex items-center space-x-3 bg-white p-1 rounded-full border border-slate-200 mt-6 shadow-sm">
              <button 
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all uppercase ${billingPeriod === 'monthly' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Monthly Basic
              </button>
              <button 
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all uppercase ${billingPeriod === 'yearly' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Yearly Save 20%
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => {
              const adjustedPrice = (plan.price * priceMultiplier).toFixed(2);
              const isPro = plan.id === 'pro';
              const isBusiness = plan.id === 'business';

              return (
                <div 
                  key={plan.id}
                  className={`bg-white rounded-3xl p-8 border hover:shadow-2xl transition-all duration-300 relative flex flex-col justify-between ${
                    isPro ? 'border-sky-300 shadow-xl shadow-sky-600/5 ring-1 ring-sky-300' : 
                    isBusiness ? 'border-indigo-400 ring-2 ring-indigo-400' : 'border-slate-200'
                  }`}
                >
                  <div>
                    {isBusiness && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-[10px] uppercase font-mono font-extrabold tracking-widest rounded-full shadow-md">
                        Best value for teams
                      </span>
                    )}

                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h4 className="font-display font-medium text-base text-slate-500 uppercase">{plan.name}</h4>
                        <span className="text-3xl font-display font-bold text-slate-900 mt-1 block">{plan.storage}</span>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase ${isBusiness ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                        {plan.badge}
                      </span>
                    </div>

                    <p className="text-sm text-slate-500 mb-6 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">{plan.desc}</p>

                    <div className="flex items-baseline mb-8">
                      <span className="text-4xl font-display font-bold text-slate-900">${plan.price === 0 ? '0.00' : adjustedPrice}</span>
                      <span className="text-sm font-semibold text-slate-400 ml-2">/ month</span>
                    </div>

                    {/* Features checklist */}
                    <ul className="space-y-4 border-t border-slate-100 pt-6">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start text-sm text-slate-600">
                          <Check className={`w-5 h-5 flex-shrink-0 mr-3 mt-0.5 ${isBusiness ? 'text-indigo-600' : 'text-sky-500'}`} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    id={`pricing-select-${plan.id}`}
                    onClick={onGetStarted}
                    className={`mt-8 w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all shadow-md active:scale-[0.98] ${
                      isBusiness ? 'bg-indigo-600 hover:bg-slate-900 text-white shadow-indigo-600/10' :
                      isPro ? 'bg-indigo-600 hover:bg-indigo-700 text-white' :
                      'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    {plan.price === 0 ? 'Sign Up Instantly' : 'Get Started Now'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pricing Comparison Table Widget */}
          <div className="mt-20 overflow-x-auto rounded-3xl border border-slate-200/60 bg-white">
            <table className="min-w-full divide-y divide-slate-200/50">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Platform Feature Matrix</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Free (200GB)</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-sky-600 uppercase tracking-wider">Pro (1TB)</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-indigo-600 uppercase tracking-wider">Business (5TB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">AES-256 Storage Encryption</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-500">✔ Included</td>
                  <td className="px-6 py-4 text-center text-sm text-sky-600 font-bold">✔ Included</td>
                  <td className="px-6 py-4 text-center text-sm text-indigo-600 font-bold">✔ Included</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">Custom Branded Expiry Links</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-400">✖ Missing</td>
                  <td className="px-6 py-4 text-center text-sm text-sky-600 font-bold">✔ Included</td>
                  <td className="px-6 py-4 text-center text-sm text-indigo-600 font-bold">✔ Included</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">Timed Expirations & Passwords</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-400">✖ Missing</td>
                  <td className="px-6 py-4 text-center text-sm text-sky-600 font-bold">✔ Included</td>
                  <td className="px-6 py-4 text-center text-sm text-indigo-600 font-bold">✔ Included</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">MFA & Compliance Auditing</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-400">✖ Missing</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-400">✖ Missing</td>
                  <td className="px-6 py-4 text-center text-sm text-indigo-600 font-bold">✔ Included</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-mono tracking-widest text-indigo-600 font-bold">Testimonials</h2>
            <p className="text-3xl text-slate-900 font-display font-bold mt-2">Highly validated by security officers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative">
              <div className="flex text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic mb-6">"Migrating our cloud directories to Cloud File Manager unified our remote teams. File uploads take seconds on low orbits and password validation is flawless."</p>
              <div>
                <span className="font-display font-bold text-slate-800 text-sm block">Marcus Vance</span>
                <span className="text-xs text-slate-400 block">VP of Security, Lineage Inc</span>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative">
              <div className="flex text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic mb-6">"We managed high-res 4K video deliveries manually on AWS until discovering their intuitive storage folders. Simple expiry links let directors download with perfect confidence."</p>
              <div>
                <span className="font-display font-bold text-slate-800 text-sm block">Sarah Jenkins</span>
                <span className="text-xs text-slate-400 block">Creative Lead, Outrun Studios</span>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative">
              <div className="flex text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic mb-6">"We required rigid 2FA authentication, complete historical audit logs and encryption compliant profiles. Cloud File Manager met all standards beautifully out-of-the-box."</p>
              <div>
                <span className="font-display font-bold text-slate-800 text-sm block">Chen Jing</span>
                <span className="text-xs text-slate-400 block">Compliance Officer, Orient Capital</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Accordion Dropdowns */}
      <section id="faq" className="py-20 bg-slate-50 border-t border-slate-200/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-xs uppercase font-mono tracking-widest text-indigo-600 font-bold">Frequently Asked Questions</h2>
            <p className="text-3xl font-display font-bold text-slate-900 mt-2">Answers regarding storage safety</p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between font-display font-semibold text-slate-800 hover:bg-slate-50/50 transition-colors"
                >
                  <span>{item.q}</span>
                  {activeFaq === index ? <ChevronUp className="w-5 h-5 text-indigo-600" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>
                <AnimatePresence initial={false}>
                  {activeFaq === index && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 pt-1 text-sm text-slate-500 leading-relaxed border-t border-slate-100">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Interactive Contact Section */}
      <section id="contact" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-xs uppercase font-mono tracking-widest text-indigo-600 font-bold">Get in Touch</h2>
            <p className="text-3xl font-display font-bold text-slate-900 mt-2">Our technical engineers are standing by</p>
            <p className="text-sm text-slate-500 mt-2">Do you require high density enterprise arrangements or deep AWS S3 migration consults?</p>
          </div>

          <div className="bg-slate-50 rounded-3xl border border-slate-200/60 p-6 sm:p-10 shadow-lg">
            {contactSubmitted ? (
              <div className="text-center py-10 space-y-3">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full inline-flex">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="font-display font-bold text-slate-800 text-xl">Thank you for writing!</h3>
                <p className="text-sm text-slate-500">We received your request. An engineer will follow up within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Username / Representative</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium text-slate-800"
                        placeholder="John Smith" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Corporate Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" 
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium text-slate-800"
                        placeholder="jsmith@enterprise.com" 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Describe inquiry or target storage scale</label>
                  <textarea 
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium text-slate-800"
                    placeholder="We seek automatic snapshot policies to back up 45TB on a weekly interval..."
                  />
                </div>

                <div className="text-right">
                  <button 
                    id="contact-submit-btn"
                    type="submit" 
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md active:scale-[0.98] transition-all"
                  >
                    Submit Support Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-white">
                <div className="p-2 bg-indigo-600 rounded-xl">
                  <Cloud className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-display font-bold text-lg tracking-tight block leading-none">Cloud File Manager</span>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold">Secure SaaS Sync</span>
                </div>
              </div>
              <p className="text-xs text-slate-400">Military-grade replication structures protecting operational assets since 2026.</p>
              <span className="text-xs text-indigo-400 font-mono font-semibold block flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Globally Host Active
              </span>
            </div>

            <div>
              <h5 className="font-semibold text-white text-xs uppercase tracking-widest font-mono mb-4">Product Lineup</h5>
              <ul className="space-y-3 text-xs">
                <li><a href="#" className="hover:text-white transition-colors">Storage Dashboard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Shared Links</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Enterprise Auditing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Continuous Backups</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-white text-xs uppercase tracking-widest font-mono mb-4">Security Standards</h5>
              <ul className="space-y-3 text-xs">
                <li><a href="#" className="hover:text-white transition-colors">Military AES-256</a></li>
                <li><a href="#" className="hover:text-white transition-colors">TLS 1.3 Transport</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance Certifications</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Audit Logging Reports</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-white text-xs uppercase tracking-widest font-mono mb-4">Support & Care</h5>
              <ul className="space-y-3 text-xs">
                <li><a href="#faq" className="hover:text-white transition-colors">Knowledge Base FAQ</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Create Incident Ticket</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Live Operations Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SLA Guarantees</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p>&copy; 2026 Cloud File Manager Platform Inc. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Charter</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Enterprise SLA</a>
              <a href="#" className="hover:text-white transition-colors">Contact Operations</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
