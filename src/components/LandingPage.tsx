import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, Shield, Zap, RefreshCw, Smartphone, Archive, History, FolderOpen, Lock, 
  ArrowRight, Check, Star, Mail, User, HelpCircle, ChevronDown, ChevronUp, Globe, FileText, Sparkles, Orbit
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

  const priceMultiplier = billingPeriod === 'yearly' ? 0.8 : 1; 

  const featuresList = [
    { icon: <Shield className="w-5 h-5 text-blue-600" />, title: "Secure Cryptographic Storage", desc: "Military-grade AES-256 encryption at rest and TLS 1.3 in transit." },
    { icon: <Zap className="w-5 h-5 text-cyan-600" />, title: "Lightning S3 Streams", desc: "High-performance parallel streaming speeds up S3 uploads by up to 400%." },
    { icon: <RefreshCw className="w-5 h-5 text-blue-500" />, title: "Real-time Operations Sync", desc: "Instantly synchronizes assets across workstations, web clients, and API targets." },
    { icon: <ArrowRight className="w-5 h-5 text-blue-600" />, title: "Granular Sharing Links", desc: "Public, password-protected, or timed expiring download links." },
    { icon: <Smartphone className="w-5 h-5 text-cyan-500" />, title: "Cross-Device Continuity", desc: "Access entire S3 directory structures on any screen without local software." },
    { icon: <Archive className="w-5 h-5 text-blue-500" />, title: "Continuous Replication", desc: "Interval automated snapshots keep critical data continuously protected." },
    { icon: <History className="w-5 h-5 text-indigo-500" />, title: "Advanced Version Control", desc: "Audit and restore previous iteration uploads up to 90 days prior." },
    { icon: <FolderOpen className="w-5 h-5 text-cyan-600" />, title: "Structured Nesting Maps", desc: "Dynamic root paths, sub-directories, and meta-tags hierarchies." },
    { icon: <Lock className="w-5 h-5 text-emerald-500" />, title: "Compliance Governance", desc: "Two-factor authentication compliance controls and granular team lists." },
  ];

  const pricingPlans = [
    {
      id: 'free',
      name: "Free Sandbox",
      storage: "200 GB",
      price: 0,
      badge: "Individual",
      desc: "Perfect for testing cloud tools and secure backup telemetry.",
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
      price: 299,
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
      name: "Enterprise Server",
      storage: "5 TB",
      price: 999,
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
    { q: "Do you support Google Account Authentication?", a: "Yes, Cloud File Manager includes Google Single-Sign-On (SSO). You can authenticate and sync workspace profiles with a single tap securely." }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-blue-600 selection:text-white relative font-sans" id="landing-page-root">
      
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/5 to-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl text-white shadow-lg shadow-blue-500/10">
              <Cloud className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight text-slate-900 block leading-none">Cloud File Manager</span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-blue-600 font-extrabold mt-1 block">SaaS Sync Control</span>
            </div>
          </div>

          <nav className="hidden md:flex space-x-10 text-xs uppercase font-mono tracking-widest font-bold text-slate-500">
            <a href="#features" className="hover:text-blue-600 transition-colors">Capabilities</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing Matrix</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">Knowledge</a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center space-x-4">
            <button 
              id="header-login-btn"
              onClick={onLoginClick} 
              className="text-xs uppercase font-mono font-bold tracking-wider text-slate-700 hover:text-blue-600 transition-colors px-4 py-2 cursor-pointer"
            >
              Sign In
            </button>
            <button 
              id="header-cta-btn"
              onClick={onGetStarted} 
              className="hidden sm:inline-flex items-center justify-center text-xs uppercase font-mono tracking-wider font-extrabold text-white bg-blue-650 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all px-6 py-3 rounded-xl shadow-lg shadow-blue-550/15 cursor-pointer"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-28 md:pb-36">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            <div className="lg:col-span-6 text-center lg:text-left space-y-8">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-100 text-blue-700 text-[10px] uppercase font-mono font-bold"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
                <span>Enterprise v2.4 Release Standard</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-display font-medium tracking-tight text-slate-900 leading-[1.08]"
              >
                The secure portal for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 font-bold">cryptographic S3</span> cloud file sync.
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium"
              >
                Collaborate safely with colleagues, monitor performance logs, and manage TB-scale directories with an elegant workspace. Backed by TLS 1.3 encryption, client-side MFA control, and seamless AWS setups.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <button 
                  id="hero-get-started-btn"
                  onClick={onGetStarted}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 text-xs uppercase font-mono tracking-wider font-extrabold rounded-xl text-white bg-blue-600 hover:bg-slate-900 transition-all duration-300 shadow-xl shadow-blue-500/15 cursor-pointer hover:shadow-slate-900/20"
                >
                  Create Secure Account
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
                <button 
                  id="hero-login-btn"
                  onClick={onLoginClick}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 border border-slate-200 bg-white text-xs uppercase font-mono tracking-wider font-bold rounded-xl text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
                >
                  Sign In to Console
                </button>
              </motion.div>

              {/* Trust Section */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="pt-8 border-t border-slate-200/50"
              >
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold block mb-4">Trusted by modern organizations globally</span>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-10 gap-y-6 opacity-40 grayscale hover:opacity-100 transition-all duration-500">
                  <span className="font-display font-black text-lg text-slate-800 tracking-wider">Vercel</span>
                  <span className="font-display font-extrabold text-xl text-slate-800 tracking-tight">stripe</span>
                  <span className="font-display font-medium text-[15px] text-slate-800 tracking-widest">L I N E A R</span>
                  <span className="font-display font-bold text-lg text-slate-800">Dropbox</span>
                </div>
              </motion.div>
            </div>

            {/* Simulated Glass Browser Frame */}
            <div className="lg:col-span-6 relative">
              <motion.div 
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-100/90 p-5 sm:p-7 relative overflow-hidden max-w-lg mx-auto"
              >
                {/* Simulated Explorer Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200 block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200 block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200 block"></span>
                    <span className="text-[10px] font-mono text-slate-400 ml-2">secure_vault_sandbox_2.4</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-mono rounded-full border border-emerald-100 flex items-center space-x-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live S3 Sync Active</span>
                  </span>
                </div>

                <div className="space-y-5">
                  {/* Glass Dashboard info item */}
                  <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center space-x-3.5">
                      <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                        <Cloud className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">Workspace Health</span>
                        <span className="text-base font-bold font-display text-slate-800">14.2 GB / 200 GB Used</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 block uppercase">Rahul Sharma</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold font-mono text-slate-500">
                      <span>Live quota capacity</span>
                      <span>7.1% Capacity Filled</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-500" style={{ width: '7.1%' }}></div>
                    </div>
                  </div>

                  {/* Quick features Grid inside mockup */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-white transition-all space-y-1">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">PDF Logs</span>
                      <span className="text-xs font-bold text-slate-800">14.2 MB (1 file)</span>
                    </div>
                    <div className="p-3.5 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-white transition-all space-y-1">
                      <Orbit className="w-4 h-4 text-cyan-600" />
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">S3 Buckets</span>
                      <span className="text-xs font-bold text-slate-800">100% Configured</span>
                    </div>
                  </div>

                  {/* Sync animation flow */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-slate-400 block pb-1">Historical Snapshots Sync</span>
                    <div className="flex items-center justify-between text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-100/50">
                      <p className="font-semibold text-slate-700 truncate max-w-[200px]">Company Brand Grid.png</p>
                      <span className="text-emerald-700 font-mono text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">Ready</span>
                    </div>
                    <div className="flex items-center justify-between text-xs bg-blue-50/30 p-3 rounded-xl border border-blue-100/50">
                      <p className="font-semibold text-blue-900 truncate max-w-[200px]">Enterprise Security Schema.doc</p>
                      <span className="text-blue-600 font-mono text-[10px] font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">Synced</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Features Grid */}
      <section id="features" className="py-24 bg-white border-y border-slate-200/40 relative">
        <div className="absolute inset-0 bg-slate-50/30" />
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-3">
            <h2 className="text-xs uppercase font-mono tracking-widest text-blue-600 font-bold">Engineered with Precision</h2>
            <p className="text-3xl sm:text-4xl font-display font-medium tracking-tight text-slate-900">Enterprise compliance for professional S3 teams.</p>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">From cryptographic transfer handshakes to automated bucket versioning snapshots, everything is ready.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresList.map((f, i) => (
              <div 
                key={i}
                className="p-8 bg-[#F8FAFC]/50 rounded-3xl border border-slate-200/60 hover:border-blue-300 hover:bg-white hover:scale-[1.015] hover:shadow-xl hover:shadow-slate-150/50 transition-all duration-300 space-y-4"
              >
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl inline-flex">
                  {f.icon}
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-slate-800 text-base">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Pricing Matrix */}
      <section id="pricing" className="py-24 bg-[#F8FAFC] relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs uppercase font-mono tracking-widest text-blue-600 font-bold">Simple, Transparent Pricing</h2>
            <p className="text-3xl sm:text-4xl font-display font-medium tracking-tight text-slate-900">Choose the capacity plan that fits your growth.</p>
            
            {/* Billing toggler */}
            <div className="inline-flex items-center space-x-1 bg-white p-1 rounded-full border border-slate-200 shadow-sm">
              <button 
                onClick={() => setBillingPeriod('monthly')}
                className={`px-5 py-2 rounded-full text-[10px] uppercase font-mono font-bold tracking-wider transition-all duration-300 ${billingPeriod === 'monthly' ? 'bg-blue-650 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Monthly Plan
              </button>
              <button 
                onClick={() => setBillingPeriod('yearly')}
                className={`px-5 py-2 rounded-full text-[10px] uppercase font-mono font-bold tracking-wider transition-all duration-300 ${billingPeriod === 'yearly' ? 'bg-blue-650 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Yearly (Save 20%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {pricingPlans.map((plan) => {
              const adjustedPrice = (plan.price * priceMultiplier).toFixed(2);
              const isPro = plan.id === 'pro';
              const isBusiness = plan.id === 'business';

              return (
                <div 
                  key={plan.id}
                  className={`bg-white rounded-3xl p-8 border hover:shadow-2xl transition-all duration-350 relative flex flex-col justify-between ${
                    isPro ? 'border-cyan-300 shadow-xl shadow-cyan-500/5 ring-1 ring-cyan-200' : 
                    isBusiness ? 'border-blue-400 ring-2 ring-blue-500 shadow-xl shadow-blue-500/5' : 'border-slate-200/85'
                  }`}
                >
                  {isBusiness && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[9px] uppercase font-mono font-black tracking-widest rounded-full shadow-md">
                      Team Best Value
                    </span>
                  )}

                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <div>
                        <h4 className="font-display font-medium text-xs uppercase tracking-wider text-slate-400">{plan.name}</h4>
                        <span className="text-3xl font-display font-bold text-slate-800 mt-1 block">{plan.storage}</span>
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] uppercase font-mono font-bold rounded-lg ${isBusiness ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-100 text-slate-700'}`}>
                        {plan.badge}
                      </span>
                    </div>

                    <p className="text-slate-500 text-xs leading-relaxed font-semibold">{plan.desc}</p>

                    <div className="flex items-baseline py-2">
                      <span className="text-4xl font-display font-bold text-slate-900">₹{plan.price === 0 ? '0' : Math.round(Number(adjustedPrice))}</span>
                      <span className="text-xs font-bold text-slate-400 font-mono ml-2">/ month</span>
                    </div>

                    <ul className="space-y-3 pt-4 border-t border-slate-150">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center text-xs font-semibold text-slate-600">
                          <Check className={`w-4 h-4 flex-shrink-0 mr-3 ${isBusiness ? 'text-blue-600' : 'text-cyan-500'}`} />
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    id={`pricing-select-${plan.id}`}
                    onClick={onGetStarted}
                    className={`mt-8 w-full py-3.5 px-6 rounded-xl text-xs uppercase font-mono tracking-wider font-extrabold transition-all shadow-md active:scale-[0.98] cursor-pointer ${
                      isBusiness ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white ring-1 ring-blue-500' :
                      isPro ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                      'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {plan.price === 0 ? 'Activate Sandbox' : 'Get Started Now'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Comparison Matrix Table */}
          <div className="mt-20 overflow-hidden rounded-2xl border border-slate-200/60 bg-white">
            <table className="min-w-full divide-y divide-slate-200/50">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th scope="col" className="px-6 py-4.5 text-left text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">Platform Feature Matrix</th>
                  <th scope="col" className="px-6 py-4.5 text-center text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">Free (200GB)</th>
                  <th scope="col" className="px-6 py-4.5 text-center text-[10px] uppercase font-mono tracking-wider text-cyan-600 font-bold">Pro (1TB)</th>
                  <th scope="col" className="px-6 py-4.5 text-center text-[10px] uppercase font-mono tracking-wider text-blue-600 font-bold">Business (5TB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-semibold">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-6 py-4.5 text-slate-900">AES-256 Storage Encryption</td>
                  <td className="px-6 py-4.5 text-center text-slate-500">✔ Fully Included</td>
                  <td className="px-6 py-4.5 text-center text-cyan-600 font-bold">✔ Fully Included</td>
                  <td className="px-6 py-4.5 text-center text-blue-600 font-bold">✔ Fully Included</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-6 py-4.5 text-slate-900">Custom Branded Expiry Links</td>
                  <td className="px-6 py-4.5 text-center text-slate-400">✖ Missing</td>
                  <td className="px-6 py-4.5 text-center text-cyan-600 font-bold">✔ Fully Included</td>
                  <td className="px-6 py-4.5 text-center text-blue-600 font-bold">✔ Fully Included</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-6 py-4.5 text-slate-900">Timed Expirations & Passwords</td>
                  <td className="px-6 py-4.5 text-center text-slate-400">✖ Missing</td>
                  <td className="px-6 py-4.5 text-center text-cyan-600 font-bold">✔ Fully Included</td>
                  <td className="px-6 py-4.5 text-center text-blue-600 font-bold">✔ Fully Included</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-6 py-4.5 text-slate-900">MFA & Compliance Auditing</td>
                  <td className="px-6 py-4.5 text-center text-slate-400">✖ Missing</td>
                  <td className="px-6 py-4.5 text-center text-slate-400">✖ Missing</td>
                  <td className="px-6 py-4.5 text-center text-blue-600 font-bold">✔ Fully Included</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Testimonials */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs uppercase font-mono tracking-widest text-blue-600 font-bold">Success Statements</h2>
            <p className="text-3xl font-display font-medium tracking-tight text-slate-900">Validated by corporate officers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 bg-slate-50/60 rounded-3xl border border-slate-100 relative space-y-6">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current animate-pulse" />)}
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed italic font-semibold">"Migrating our cloud directories to Cloud File Manager unified our remote teams. File uploads take seconds on S3 pipelines and password lock validation is pristine."</p>
              <div>
                <span className="font-display font-bold text-slate-800 text-sm block">Marcus Vance</span>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mt-0.5">VP of Security, Lineage Inc</span>
              </div>
            </div>

            <div className="p-8 bg-slate-50/60 rounded-3xl border border-slate-100 relative space-y-6">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current animate-pulse" />)}
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed italic font-semibold">"We managed high-res video deliveries manually on AWS until discovering their intuitive folders explorer. Simple expiring links let directors download assets with 100% confidence."</p>
              <div>
                <span className="font-display font-bold text-slate-800 text-sm block">Sarah Jenkins</span>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mt-0.5">Creative Lead, Outrun Studios</span>
              </div>
            </div>

            <div className="p-8 bg-slate-50/60 rounded-3xl border border-slate-100 relative space-y-6">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current animate-pulse" />)}
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed italic font-semibold">"We required rigid 2FA authentication, complete historical audit logs and encryption compliant directories. Cloud File Manager met all standards beautifully out-of-the-box."</p>
              <div>
                <span className="font-display font-bold text-slate-800 text-sm block">Chen Jing</span>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mt-0.5">Compliance Officer, Orient Capital</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section id="faq" className="py-24 bg-[#F8FAFC] border-t border-slate-200/50">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-xs uppercase font-mono tracking-widest text-blue-600 font-bold">Information Desk</h2>
            <p className="text-3xl font-display font-medium tracking-tight text-slate-900">Answers regarding storage safety</p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm hover:border-slate-300 transition-all">
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between font-display font-semibold text-slate-800 hover:bg-slate-50/40 transition-colors"
                >
                  <span className="text-sm">{item.q}</span>
                  {activeFaq === index ? <ChevronUp className="w-4.5 h-4.5 text-blue-600" /> : <ChevronDown className="w-4.5 h-4.5 text-slate-400" />}
                </button>
                <AnimatePresence initial={false}>
                  {activeFaq === index && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 pt-1 text-xs text-slate-500 leading-relaxed border-t border-slate-100 font-semibold">
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

      {/* 7. Contact Section */}
      <section id="contact" className="py-24 bg-white border-t border-slate-150 relative">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-xs uppercase font-mono tracking-widest text-blue-600 font-bold">Acquire Consultation</h2>
            <p className="text-3xl font-display font-medium tracking-tight text-slate-900">Our technical engineers are standing by</p>
            <p className="text-xs text-slate-500 max-w-lg mx-auto font-semibold">Do you require custom high-throughput setups, dedicated compliance guarantees, or structured AWS bucket integrations?</p>
          </div>

          <div className="bg-[#F8FAFC] rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xl shadow-slate-100/50">
            {contactSubmitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full inline-flex">
                  <Check className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="font-display font-bold text-slate-800 text-xl">Thank you for writing!</h3>
                <p className="text-xs text-slate-500 font-semibold">We received your request. An engineer will follow up within 12-24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-mono font-bold text-slate-400">Representative Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-250 rounded-xl text-xs focus:outline-none focus:border-blue-600 transition-all font-semibold text-slate-800"
                        placeholder="John Smith" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-mono font-bold text-slate-400">Corporate Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" 
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-250 rounded-xl text-xs focus:outline-none focus:border-blue-600 transition-all font-semibold text-slate-800"
                        placeholder="jsmith@enterprise.com" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400">Describe Target Storage Scale & AWS Setup</label>
                  <textarea 
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full p-4 bg-white border border-slate-250 rounded-xl text-xs focus:outline-none focus:border-blue-600 transition-all font-semibold text-slate-800"
                    placeholder="We seek automatic snapshot policies to duplicate 45TB on weekly intervals..."
                  />
                </div>

                <div className="text-right">
                  <button 
                    id="contact-submit-btn"
                    type="submit" 
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 border border-transparent text-xs uppercase font-mono tracking-wider font-extrabold rounded-xl text-white bg-blue-600 hover:bg-slate-900 shadow-md active:scale-[0.98] transition-all cursor-pointer"
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
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-5">
              <div className="flex items-center space-x-3.5 text-white">
                <div className="p-2.5 bg-blue-600 rounded-xl">
                  <Cloud className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-display font-bold text-base tracking-tight block leading-none">Cloud File Manager</span>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-blue-400 font-extrabold mt-1 block">Secure Sync SaaS</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">Military-grade replication environments protecting corporate synchronizations since 2026.</p>
              <span className="text-xs text-blue-400 font-mono font-bold flex items-center gap-1.5 bg-blue-950/40 px-3 py-1 rounded-full border border-blue-900/40 w-fit">
                <Globe className="w-3.5 h-3.5 text-cyan-400" /> Globally Host Active
              </span>
            </div>

            <div>
              <h5 className="font-bold text-white text-[11px] uppercase tracking-widest font-mono mb-4">Product Lineup</h5>
              <ul className="space-y-3.5 text-xs font-semibold">
                <li><a href="#" className="hover:text-white transition-colors">Storage Dashboard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Shared Links</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Enterprise Auditing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Continuous Backups</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-white text-[11px] uppercase tracking-widest font-mono mb-4">Compliance Guard</h5>
              <ul className="space-y-3.5 text-xs font-semibold">
                <li><a href="#" className="hover:text-white transition-colors">Military AES-256</a></li>
                <li><a href="#" className="hover:text-white transition-colors">TLS 1.3 Transport</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SOC2 Certification</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Audit Logging Reports</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-white text-[11px] uppercase tracking-widest font-mono mb-4">Support & Care</h5>
              <ul className="space-y-3.5 text-xs font-semibold">
                <li><a href="#faq" className="hover:text-white transition-colors">Knowledge FAQ</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Submit Support Ticket</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Operational Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Premium SLA</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4 font-semibold">
            <p>&copy; 2026 Cloud File Manager Platform Inc. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Charter</a>
              <a href="#" className="hover:text-white transition-colors">Terms of SLA</a>
              <a href="#" className="hover:text-white transition-colors">Contact operations</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
