import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, Shield, Zap, RefreshCw, Smartphone, Archive, History, FolderOpen, Lock, 
  ArrowRight, Check, Star, Mail, User, HelpCircle, ChevronDown, ChevronUp, Globe, FileText, Sparkles, Orbit, Server, Layers, Cpu, Heart, AlertCircle, ArrowUpRight,
  Building2, Users, Phone, MapPin, MessageSquare, ShieldCheck, Network,
  Linkedin, Github, Twitter, Youtube, Send
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLoginClick: () => void;
}

export default function LandingPage({ onGetStarted, onLoginClick }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    orgSize: '',
    message: '',
    phone: '',
    country: ''
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactForm.name && contactForm.email && contactForm.company && contactForm.orgSize && contactForm.message) {
      setContactSubmitted(true);
      setTimeout(() => {
        setContactSubmitted(false);
        setContactForm({
          name: '',
          email: '',
          company: '',
          orgSize: '',
          message: '',
          phone: '',
          country: ''
        });
      }, 4000);
    }
  };

  const priceMultiplier = billingPeriod === 'yearly' ? 0.8 : 1; 

  const featuresList = [
    { 
      icon: <Shield className="w-5 h-5 text-blue-600" />, 
      title: "Secure Cryptographic Storage", 
      desc: "Military-grade AES-256 encryption at rest combined with end-to-end TLS 1.3 cryptographic handshakes.",
      benefit: "Financial-grade safety"
    },
    { 
      icon: <Zap className="w-5 h-5 text-cyan-600" />, 
      title: "Lightning S3 Stream Engine", 
      desc: "Multi-threaded parallel streaming uploads that bypass classic browser bottlenecks by up to 400%.",
      benefit: "Ultra high speed sync"
    },
    { 
      icon: <RefreshCw className="w-5 h-5 text-blue-500" />, 
      title: "Automated Lifecycle Replication", 
      desc: "Real-time, continuous replication layers that synchronize S3 objects securely with multi-AZ backups.",
      benefit: "99.999% Durability SLA"
    },
    { 
      icon: <Share2Icon className="w-5 h-5 text-indigo-500" />, 
      title: "Granular Signed Sharing Links", 
      desc: "Deploy public, password-protected, or signed expiration links that auto-terminate based on custom rules.",
      benefit: "Zero-leak link control"
    },
    { 
      icon: <Smartphone className="w-5 h-5 text-emerald-500" />, 
      title: "Cross-Device Continuity", 
      desc: "Access complex S3 server volumes instantly through any standard browser without client installation.",
      benefit: "No local footprint"
    },
    { 
      icon: <History className="w-5 h-5 text-purple-500" />, 
      title: "90-Day Advanced Audits", 
      desc: "Audit logs for every single action. Track reads, updates, down-scale requests, and historical sessions.",
      benefit: "SOC2 Compliance ready"
    }
  ];

  const pricingPlans = [
    {
      id: 'free',
      name: "Free",
      storage: "5 GB",
      price: 0,
      badge: "Personal Use",
      desc: "Perfect for personal file storage and standard backup testing.",
      suitableFor: "Personal use",
      features: [
        "5 GB secure cloud storage",
        "File upload & download",
        "Folder management",
        "Basic file sharing",
        "Cross-device access",
        "Secure authentication"
      ],
      ctaText: "Get Started Free"
    },
    {
      id: 'pro',
      name: "Pro",
      storage: "200 GB",
      price: 299,
      badge: "Most Popular",
      desc: "Enhanced storage limits and file control capabilities for creators.",
      suitableFor: "Individuals and creators",
      features: [
        "200 GB secure storage",
        "Faster uploads",
        "Password-protected sharing",
        "File version history",
        "Priority support",
        "Advanced sharing controls"
      ],
      ctaText: "Upgrade to Pro"
    },
    {
      id: 'business',
      name: "Business",
      storage: "1 TB",
      price: 499,
      badge: "Best for Teams",
      desc: "Robust cloud space and collaboration suite for small teams.",
      suitableFor: "Professionals and small teams",
      features: [
        "1 TB secure storage",
        "Team collaboration",
        "Shared workspaces",
        "Activity history",
        "Advanced permissions",
        "Priority support",
        "Enhanced security"
      ],
      ctaText: "Choose Business"
    },
    {
      id: 'enterprise',
      name: "Enterprise",
      storage: "5 TB+",
      price: null,
      badge: "Enterprise Solution",
      desc: "Fully customized, scalable secure workspace for organizations.",
      suitableFor: "Organizations",
      features: [
        "Multi-user management",
        "Enterprise-grade security",
        "Compliance controls",
        "Dedicated support",
        "Custom storage plans",
        "SSO integration ready",
        "Audit logs",
        "SLA support"
      ],
      ctaText: "Contact Sales"
    }
  ];

  const faqItems = [
    { q: "How secure is Cloud File Manager?", a: "Every single asset uploaded is instantly segmented, encrypted under military-grade AES-256 standards, and dispatched to multiple AWS AZ clusters. Your sessions are shielded with strict TLS 1.3 security protocols." },
    { q: "Can we configure team permission levels?", a: "Precisely. When generating resource shares, you can declare granular permissions (Viewer, Editor, or Download-Only) tailored to specific corporate email domains." },
    { q: "How is billing processed?", a: "Flexible pricing models are calculated cleanly on monthly or yearly cycles. Opting for a yearly subscription gains you an instant 20% discount on global workspace packages." },
    { q: "What happens if we reach our current storage limit?", a: "We notify your team well before storage caps are hit. You can scale allocations up or down dynamically through subscription settings instantly without migration downtime." },
    { q: "Do you support Single Sign-On (SSO)?", a: "Yes, our console integrates default secure Google SSO, letting verified enterprise users sign in quickly with complete safety." }
  ];

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 selection:bg-blue-600 selection:text-white relative font-sans overflow-x-hidden" id="landing-page-root">
      
      {/* Decorative Grid Mesh & Ambient Spheres */}
      <div className="absolute top-0 inset-x-0 h-[800px] bg-[linear-gradient(to_right,rgba(15,23,42,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      {/* Ambient glowing blobs */}
      <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/10 to-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[400px] left-[-300px] w-[800px] h-[800px] bg-gradient-to-br from-cyan-400/5 via-blue-500/5 to-transparent rounded-full blur-[140px] pointer-events-none" />

      {/* 1. PREMIUM FULL-WIDTH STICKY NAV BAR */}
      <nav className="sticky top-0 z-50 bg-[#fcfdfe]/80 backdrop-blur-xl border-b border-slate-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
          
          {/* Logo & Platform Info */}
          <div className="flex items-center space-x-3.5 group cursor-pointer">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Cloud className="w-5.5 h-5.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg tracking-tight text-slate-900 leading-none">CloudFile</span>
              <span className="text-[9px] uppercase font-mono tracking-widest text-blue-600 font-black mt-1">S3 Console</span>
            </div>
          </div>

          {/* Clean Navigation Hierarchy */}
          <div className="hidden md:flex items-center space-x-8 text-xs font-semibold tracking-wide text-slate-500 font-sans">
            <a href="#features" className="hover:text-blue-600 transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all">Capabilities</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all">Pricing Model</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all">Information</a>
            <a href="#contact" className="hover:text-blue-600 transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all">Operations</a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <button 
              id="header-login-btn"
              onClick={onLoginClick} 
              className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors px-4 py-2 hover:bg-slate-50 rounded-xl cursor-pointer"
            >
              Log In
            </button>
            <button 
              id="header-cta-btn"
              onClick={onGetStarted} 
              className="inline-flex items-center justify-center text-xs font-bold text-white bg-blue-600 hover:bg-slate-900 transition-all duration-300 px-5.5 py-3 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-slate-900/10 group cursor-pointer active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      {/* 2. PREMIUM HERO SECTION */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-36 overflow-hidden">
        {/* Ambient background blur circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-[#005AE2]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Column: Call to Actions & Content */}
            <div className="lg:col-span-6 text-center lg:text-left space-y-8">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-blue-50 rounded-full border border-blue-100/50 text-[#005AE2] text-[11px] font-bold tracking-wide leading-none">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                <span>Next-Gen Enterprise Storage</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl md:text-[62px] font-bold text-slate-900 tracking-tight leading-[1.08]">
                  CloudFile <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 font-extrabold block sm:inline">Enterprise</span>
                </h1>
                <p className="text-slate-600 text-[15px] sm:text-[17px] leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                  Secure cloud storage built for professionals, teams and modern businesses. Save, sync, and share files on a high-availability infrastructure with ironclad cryptographic armor.
                </p>
              </div>

              {/* Feature Badges Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 max-w-lg mx-auto lg:mx-0 pt-2 text-left bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                <div className="flex items-center space-x-2.5 text-slate-700 text-[13px] font-semibold">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>End-to-End Encryption</span>
                </div>
                <div className="flex items-center space-x-2.5 text-slate-700 text-[13px] font-semibold">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Lightning Fast Uploads</span>
                </div>
                <div className="flex items-center space-x-2.5 text-slate-700 text-[13px] font-semibold">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Multi-Device Sync</span>
                </div>
                <div className="flex items-center space-x-2.5 text-slate-700 text-[13px] font-semibold">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Secure File Sharing</span>
                </div>
                <div className="flex items-center space-x-2.5 text-slate-700 text-[13px] font-semibold">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Enterprise Grade Security</span>
                </div>
                <div className="flex items-center space-x-2.5 text-slate-700 text-[13px] font-semibold">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Real-Time Collaboration</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-1">
                <button 
                  id="hero-get-started-btn"
                  onClick={onGetStarted}
                  className="w-full sm:w-auto h-12 inline-flex items-center justify-center px-8 text-xs font-bold uppercase tracking-wider rounded-xl text-white bg-blue-600 hover:bg-slate-900 transition-all duration-300 shadow-xl shadow-blue-500/15 cursor-pointer hover:shadow-slate-900/10 active:scale-98 group"
                >
                  <span>Build Secure Space</span>
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  id="hero-login-btn"
                  onClick={onLoginClick}
                  className="w-full sm:w-auto h-12 inline-flex items-center justify-center px-8 border border-slate-200 bg-white text-xs font-bold uppercase tracking-wider rounded-xl text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  Configure Workspace
                </button>
              </div>

              {/* Trust Section / Capability Badges */}
              <div className="pt-8 border-t border-slate-100 space-y-4">
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-extrabold block">CONNECTED PLATFORM SPECIFICATIONS</span>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2.5">
                  <span className="px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-lg text-slate-700 text-xs font-bold">Enterprise Security</span>
                  <span className="px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-lg text-[#005AE2] text-xs font-extrabold">AES-256 Encryption</span>
                  <span className="px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-lg text-slate-700 text-xs font-bold">SOC 2 Ready</span>
                  <span className="px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-lg text-slate-700 text-xs font-bold">Privacy First Design</span>
                  <span className="px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-lg text-slate-700 text-xs font-bold">High Scalability</span>
                  <span className="px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-lg text-slate-700 text-xs font-bold">Fast Global Delivery</span>
                </div>
              </div>
            </div>

            {/* Right Column: Premium Hub Visual & Status Panel */}
            <div className="lg:col-span-6 relative flex flex-col items-center">
              
              {/* Premium Card Container */}
              <div className="w-full max-w-xl bg-white rounded-[32px] border border-slate-100 p-6 sm:p-8 shadow-2xl shadow-slate-200/30 relative overflow-hidden text-slate-700">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

                {/* Card Title & Platform Indicator */}
                <div className="flex items-center justify-between pb-6 mb-8 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-50 rounded-2xl text-[#005AE2]">
                      <Cloud className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">Storage Architecture</h3>
                      <span className="text-xs text-slate-400 font-semibold tracking-wide block mt-0.5">High-Availability Global Network</span>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-blue-50 text-[#005AE2] text-xs font-bold rounded-full border border-blue-100/50 flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '20s' }} />
                    <span>Global CDN</span>
                  </div>
                </div>

                {/* Central Beautiful Abstract Cloud Illustration with Synchronized Nodes */}
                <div className="relative flex items-center justify-center h-52 sm:h-60 bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden mb-6">
                  {/* Subtle Radar Ripple Lines */}
                  <div className="absolute w-44 h-44 rounded-full border border-blue-100/40 animate-ping opacity-30" style={{ animationDuration: '3s' }} />
                  <div className="absolute w-64 h-64 rounded-full border border-blue-100/20 animate-ping opacity-15" style={{ animationDuration: '6s' }} />
                  
                  {/* Central Hub Storage Cloud Icon */}
                  <div className="relative z-10 w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 border-4 border-white">
                    <Cloud className="w-10 h-10 text-white fill-white/10" />
                  </div>

                  {/* Synchronized Node 1: Secure Server */}
                  <div className="absolute top-6 left-12 z-20 flex items-center space-x-2 bg-white/95 backdrop-blur-sm border border-slate-100 py-1.5 px-3 rounded-2xl shadow-md">
                    <Server className="w-4 h-4 text-blue-500" />
                    <span className="text-[11px] font-bold text-slate-700">Dedicated Node</span>
                  </div>

                  {/* Synchronized Node 2: Secure Vault */}
                  <div className="absolute bottom-8 left-8 z-20 flex items-center space-x-2 bg-white/95 backdrop-blur-sm border border-slate-100 py-1.5 px-3 rounded-2xl shadow-md">
                    <Lock className="w-4 h-4 text-indigo-500" />
                    <span className="text-[11px] font-bold text-slate-700">Protected Vault</span>
                  </div>

                  {/* Synchronized Node 3: Database & Backups */}
                  <div className="absolute top-10 right-8 z-20 flex items-center space-x-2 bg-white/95 backdrop-blur-sm border border-slate-100 py-1.5 px-3 rounded-2xl shadow-md">
                    <Layers className="w-4 h-4 text-cyan-500" />
                    <span className="text-[11px] font-bold text-slate-700">Multi-AZ Copy</span>
                  </div>

                  {/* Synchronized Node 4: End-User Devices */}
                  <div className="absolute bottom-6 right-12 z-20 flex items-center space-x-2 bg-white/95 backdrop-blur-sm border border-slate-100 py-1.5 px-3 rounded-2xl shadow-md">
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                    <span className="text-[11px] font-bold text-slate-700">Device Sync</span>
                  </div>

                  {/* Connector Grid lines in Background */}
                  <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-70 pointer-events-none" />
                </div>

                {/* Modern Generic Live Status Indicators */}
                <div className="space-y-3.5 bg-slate-50/80 p-4.5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">State & Connection Handshakes</span>
                  
                  <div className="flex flex-col sm:flex-row justify-between gap-2 text-[12px] font-bold text-slate-700">
                    <div className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse block" />
                      <span>Secure Connection Established</span>
                    </div>
                    <div className="flex items-center space-x-2 lg:justify-end">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse block" />
                      <span>Real-Time Sync Ready</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-2 text-[12px] font-bold text-slate-700 pt-1">
                    <div className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse block" />
                      <span>End-to-End Encryption Enabled</span>
                    </div>
                    <div className="flex items-center space-x-2 lg:justify-end border-t sm:border-t-0 border-slate-100 sm:pt-0 pt-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse block" />
                      <span>Enterprise Cloud Platform</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. TRUST BANNER */}
      <section className="py-12 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <p className="text-[10px] tracking-widest uppercase font-mono font-extrabold text-slate-400 mb-6">Securing directories across active storage clusters</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-center opacity-55 grayscale">
            <div className="flex justify-center"><span className="text-lg font-display font-extrabold text-slate-800">AMAZON S3</span></div>
            <div className="flex justify-center"><span className="text-md font-display font-medium text-slate-800">CLOUD COMPLIANCE</span></div>
            <div className="flex justify-center"><span className="text-base font-display font-black text-slate-800">ISO-27001</span></div>
            <div className="flex justify-center"><span className="text-lg font-display font-bold text-slate-800">AES-255 AUTH</span></div>
            <div className="flex justify-center"><span className="text-xs font-mono font-semibold text-slate-800">TLS 1.3 PLATFORM</span></div>
          </div>
        </div>
      </section>

      {/* 4. CHANNELS & CAPABILITIES GRID */}
      <section id="features" className="py-24 bg-white border-b border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-3.5">
            <span className="text-[10px] uppercase font-mono tracking-widest text-blue-600 font-black">PRECISION BUILT</span>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight leading-none">
              Capabilities built for certified operations teams.
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-semibold max-w-lg mx-auto leading-relaxed">
              Managing secure AWS nodes doesn't require terminal scripts. Cloud File Manager streamlines complex configurations beautifully.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresList.map((f, i) => {
              const isHovered = hoveredFeature === i;
              return (
                <div 
                  key={i}
                  onMouseEnter={() => setHoveredFeature(i)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className="p-8 bg-[#fcfdfe] rounded-3xl border border-slate-200/60 hover:border-blue-300 hover:bg-white transition-all duration-300 relative group flex flex-col justify-between h-72 cursor-pointer card-hover"
                >
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-50 text-slate-700 rounded-2xl inline-flex group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {f.icon}
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-display font-bold text-slate-800 text-sm">{f.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-semibold">{f.desc}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-extrabold text-blue-600">
                    <span>{f.benefit}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 5. PRICING MATRIX SECTION */}
      <section id="pricing" className="py-24 bg-slate-50/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-at-t from-blue-50/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative animate-fade-in">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50/80 border border-blue-100 rounded-full mx-auto w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Storage Plans & Pricing</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-slate-900 tracking-tight leading-tight">
              Simple, transparent pricing built for everyone
            </h2>
            <p className="text-slate-500 text-sm font-normal max-w-md mx-auto leading-relaxed">
              Choose the perfect plan tailored to your storage, speed, and security requirements. No hidden fees.
            </p>

            {/* Premium Billing Toggler */}
            <div className="inline-flex items-center space-x-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50 shadow-sm mt-6">
              <button 
                onClick={() => setBillingPeriod('monthly')}
                className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${billingPeriod === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Monthly Billing
              </button>
              <button 
                onClick={() => setBillingPeriod('yearly')}
                className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 flex items-center gap-1.5 ${billingPeriod === 'yearly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Yearly Billing 
                <span className="text-[10px] bg-blue-105 text-blue-700 font-bold px-1.5 py-0.5 rounded-lg">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {pricingPlans.map((plan) => {
              const adjustedPrice = plan.price === null ? null : Math.round(plan.price * priceMultiplier);
              const isPro = plan.id === 'pro';
              const isEnterprise = plan.id === 'enterprise';
              
              return (
                <div 
                  key={plan.id}
                  className={`bg-white rounded-3xl p-6 border transition-all duration-300 relative flex flex-col justify-between ${
                    isPro 
                      ? 'border-blue-500 ring-4 ring-blue-500/5 shadow-xl shadow-blue-500/5 hover:-translate-y-1' 
                      : 'border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md hover:-translate-y-1'
                  }`}
                >
                  {isPro && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold rounded-full shadow-sm tracking-wide">
                      Most Popular
                    </span>
                  )}

                  <div className="space-y-4">
                    <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-405 block tracking-wide uppercase">{plan.badge}</span>
                        <h4 className="font-sans font-bold text-lg text-slate-900 mt-1">{plan.name}</h4>
                      </div>
                      <span className="text-base font-bold font-sans text-blue-600 bg-blue-50/80 p-2 px-2.5 rounded-xl border border-blue-100 leading-none">
                        {plan.storage}
                      </span>
                    </div>

                    <p className="text-slate-500 text-xs font-normal leading-relaxed min-h-[36px]">{plan.desc}</p>

                    <div className="flex flex-col py-1 pb-4 border-b border-slate-50">
                      <div className="flex items-baseline">
                        {plan.price === null ? (
                          <span className="text-xl sm:text-2xl font-bold font-sans text-slate-900">Custom pricing</span>
                        ) : (
                          <>
                            <span className="text-3xl sm:text-4xl font-bold font-sans text-slate-900">₹{adjustedPrice}</span>
                            <span className="text-xs text-slate-400 ml-2 font-normal">/ month</span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 font-medium font-sans">
                        Suitable for {plan.suitableFor}
                      </p>
                    </div>

                    <ul className="space-y-3 pt-2">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start text-xs text-slate-605 leading-normal">
                          <Check className={`w-4 h-4 flex-shrink-0 mr-2 mt-0.5 ${isPro ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    id={`pricing-select-${plan.id}`}
                    onClick={(e) => {
                      if (isEnterprise) {
                        e.preventDefault();
                        const contactSec = document.getElementById('contact');
                        if (contactSec) {
                          contactSec.scrollIntoView({ behavior: 'smooth' });
                        }
                      } else {
                        onGetStarted();
                      }
                    }}
                    className={`mt-8 w-full py-3 px-5 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-[0.98] cursor-pointer ${
                      isPro 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10' 
                        : isEnterprise
                        ? 'bg-slate-950 hover:bg-slate-900 text-white shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {plan.ctaText}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Clean feature comparison database SLA comparisons table */}
          <div className="mt-16 bg-white rounded-3xl border border-slate-150 overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="p-6 border-b border-slate-100">
              <h4 className="font-sans font-bold text-slate-900 text-base">Compare Storage Infrastructure Details</h4>
              <p className="text-xs text-slate-400 font-normal mt-0.5">A side-by-side breakdown of storage limits and operational scope.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-normal">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200/50 text-xs font-medium text-slate-500">
                    <th scope="col" className="px-6 py-4">Capability</th>
                    <th scope="col" className="px-6 py-4 text-center">Free</th>
                    <th scope="col" className="px-6 py-4 text-center text-blue-600 font-semibold">Pro</th>
                    <th scope="col" className="px-6 py-4 text-center">Business</th>
                    <th scope="col" className="px-6 py-4 text-center">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-650">
                  <tr className="hover:bg-slate-50/20">
                    <td className="px-6 py-4 font-semibold text-slate-800">File Storage</td>
                    <td className="px-6 py-4 text-center text-slate-600">5 GB</td>
                    <td className="px-6 py-4 text-center text-blue-600 font-semibold">200 GB</td>
                    <td className="px-6 py-4 text-center text-slate-600">1 TB</td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-800">5 TB+ Scalable</td>
                  </tr>
                  <tr className="hover:bg-slate-50/20">
                    <td className="px-6 py-4 font-semibold text-slate-800">Max File Upload Size</td>
                    <td className="px-6 py-4 text-center text-slate-600">50 MB</td>
                    <td className="px-6 py-4 text-center text-blue-600 font-semibold">5 GB</td>
                    <td className="px-6 py-4 text-center text-slate-600">50 GB</td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-800">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-slate-50/20">
                    <td className="px-6 py-4 font-semibold text-slate-800">Advanced Security & Audits</td>
                    <td className="px-6 py-4 text-center text-slate-350">—</td>
                    <td className="px-6 py-4 text-center text-blue-600 font-medium">Password Sharing</td>
                    <td className="px-6 py-4 text-center text-slate-600">Password + Activity Logs</td>
                    <td className="px-6 py-4 text-center font-semibold text-emerald-600">Full Audit Logs & SSO</td>
                  </tr>
                  <tr className="hover:bg-slate-50/20">
                    <td className="px-6 py-4 font-semibold text-slate-800">Support Mode</td>
                    <td className="px-6 py-4 text-center text-slate-600">Standard Queue</td>
                    <td className="px-6 py-4 text-center text-slate-600">Email Priority</td>
                    <td className="px-6 py-4 text-center text-blue-600 font-semibold">24/7 Priority Support</td>
                    <td className="px-6 py-4 text-center text-purple-600 font-semibold">Dedicated Team & SLA</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* 6. TESTIMONIALS SECTION */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#06b6d4] font-black">VALIDATED PERFORMANCE</span>
            <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight leading-none">
              Trusted by modern digital administrators.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col justify-between h-64 hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="space-y-4">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <p className="text-xs text-slate-600 italic font-semibold leading-relaxed">
                  "Establishing S3 synchronization used to involve heavy infrastructure terminal work. Cloud File Manager has absolute S3 precision in a clean interface."
                </p>
              </div>
              <div>
                <span className="font-display font-extrabold text-xs text-slate-900 block leading-none">Marcus Vance</span>
                <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block mt-1.5">VP Security, Lineage Inc</span>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col justify-between h-64 hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="space-y-4">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <p className="text-xs text-slate-600 italic font-semibold leading-relaxed">
                  "Our creative leads share high-res 4K video streams continuously. Expiring keys and secure passcodes protect previews flawlessly."
                </p>
              </div>
              <div>
                <span className="font-display font-extrabold text-xs text-slate-900 block leading-none">Sarah Jenkins</span>
                <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block mt-1.5">Lead Creative, Outrun Studios</span>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col justify-between h-64 hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="space-y-4">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <p className="text-xs text-slate-600 italic font-semibold leading-relaxed">
                  "SOC2 compliance requirements mapped beautiful onto their 90-day comprehensive logs auditing controls. An essential tool for security governance."
                </p>
              </div>
              <div>
                <span className="font-display font-extrabold text-xs text-slate-900 block leading-none">Chen Jing</span>
                <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block mt-1.5">Compliance Officer, Orient Capital</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 7. KNOWLEDGE BASE FAQ */}
      <section id="faq" className="py-24 bg-slate-50/50 border-t border-slate-200/40">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          
          <div className="text-center mb-16 space-y-3">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#06b6d4] font-black">PLATFORM CLARIFICATIONS</span>
            <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              Security & Storage Information FAQ
            </h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden hover:border-slate-350 transition-colors shadow-sm">
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between font-display font-bold text-slate-800 hover:bg-slate-50/30 transition-colors cursor-pointer"
                >
                  <span className="text-xs sm:text-sm">{item.q}</span>
                  {activeFaq === index ? <ChevronUp className="w-4.5 h-4.5 text-blue-650" /> : <ChevronDown className="w-4.5 h-4.5 text-slate-400" />}
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

      {/* 8. OPERATIONS REQUEST SUPPORT (REDESIGNED ENTERPRISE CONSULTATION SECTION) */}
      <section id="contact" className="py-24 bg-white border-t border-slate-150 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-at-t from-blue-50/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column: Visual Pillars & Value Props */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-10 lg:sticky lg:top-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50/80 border border-blue-100 rounded-full w-fit">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Enterprise Solutions</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-sans font-bold text-slate-900 tracking-tight leading-tight">
                  Let's Build Your Cloud Solution
                </h2>
                <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-normal">
                  Speak with our team to discuss enterprise storage, security, compliance, migration, and custom deployment solutions tailored to your business.
                </p>
              </div>

              {/* Minimal elegant value cards */}
              <div className="space-y-4">
                <div className="flex gap-4 p-4 bg-slate-50/60 border border-slate-100 rounded-2xl transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100/50">
                  <div className="p-2.5 bg-blue-50/80 border border-blue-100 rounded-xl text-blue-600 h-10 w-10 flex items-center justify-center shrink-0 shadow-sm">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-800 font-sans">Cloud Infrastructure</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Scalable high-throughput directories backed by enterprise S3 architecture and custom bandwidth allocations.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-slate-50/60 border border-slate-100 rounded-2xl transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100/50">
                  <div className="p-2.5 bg-blue-50/80 border border-blue-100 rounded-xl text-blue-600 h-10 w-10 flex items-center justify-center shrink-0 shadow-sm">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-800 font-sans">Compliance & Advanced Safety</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Financial-grade audit logs, role-based access management, multi-factor compliance locks, and securely encrypted snapshot backups.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-slate-50/60 border border-slate-100 rounded-2xl transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100/50">
                  <div className="p-2.5 bg-blue-50/80 border border-blue-100 rounded-xl text-blue-600 h-10 w-10 flex items-center justify-center shrink-0 shadow-sm">
                    <Network className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-800 font-sans">Seamless Turnkey Migration</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Our integration engineers provide hands-on assistance to hot-migrate databases and asset catalogs with zero workspace downtime.
                    </p>
                  </div>
                </div>
              </div>

              {/* Minimalist Trust Indicator */}
              <div className="pt-5 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Secure SSL encrypted channel • Consultation reply within 24 hours</span>
              </div>
            </div>

            {/* Right Column: Premium Form Card */}
            <div className="lg:col-span-7 w-full">
              <div className="bg-white rounded-[32px] border border-slate-150 p-6 sm:p-10 shadow-xl shadow-slate-100/60 hover:shadow-2xl hover:shadow-slate-100/80 transition-all">
                {contactSubmitted ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="p-3.5 bg-blue-50 text-blue-600 rounded-full inline-flex border border-blue-100 shadow-sm">
                      <Check className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-sans font-bold text-slate-900 text-xl tracking-tight">Operational Request Received</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                        Thank you, <span className="font-semibold text-slate-700">{contactForm.name}</span>. An enterprise systems engineer will contact you shortly to review <span className="font-semibold text-slate-700">{contactForm.company}</span>'s workspace consultation request.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-6">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-700">Full Name *</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            required
                            value={contactForm.name}
                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-xs transition-all font-medium text-slate-850 placeholder:text-slate-400 focus:outline-none"
                            placeholder="John Vance" 
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-700">Business Email *</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="email" 
                            required
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-xs transition-all font-medium text-slate-850 placeholder:text-slate-400 focus:outline-none"
                            placeholder="vance@lineagedata.com" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-700">Company Name *</label>
                        <div className="relative">
                          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            required
                            value={contactForm.company}
                            onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-xs transition-all font-medium text-slate-850 placeholder:text-slate-400 focus:outline-none"
                            placeholder="Lineage Data Inc" 
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-700">Organization Size *</label>
                        <div className="relative">
                          <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <select 
                            required
                            value={contactForm.orgSize}
                            onChange={(e) => setContactForm({ ...contactForm, orgSize: e.target.value })}
                            className="w-full pl-10 pr-10 py-3 bg-white border border-slate-205 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-xs transition-all font-medium text-slate-850 appearance-none cursor-pointer focus:outline-none"
                          >
                            <option value="">Select size...</option>
                            <option value="1-50">1 - 50 employees</option>
                            <option value="51-200">51 - 200 employees</option>
                            <option value="201-1000">201 - 1,000 employees</option>
                            <option value="1000+">1,000+ employees</option>
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-700">Phone Number (Optional)</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="tel" 
                            value={contactForm.phone}
                            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-xs transition-all font-medium text-slate-850 placeholder:text-slate-400 focus:outline-none"
                            placeholder="+1 (555) 000-0000" 
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-700">Country (Optional)</label>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            value={contactForm.country}
                            onChange={(e) => setContactForm({ ...contactForm, country: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-xs transition-all font-medium text-slate-850 placeholder:text-slate-400 focus:outline-none"
                            placeholder="United States" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-slate-700">How can we help? *</label>
                      <textarea 
                        required
                        rows={4}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full p-4 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-xs transition-all font-medium text-slate-850 placeholder:text-slate-400 focus:outline-none"
                        placeholder="Tell us about your project requirements, compliance schedules, or storage needs..."
                      />
                    </div>

                    <button 
                      id="contact-submit-btn"
                      type="submit" 
                      className="w-full inline-flex items-center justify-center px-6 py-4 border border-transparent text-xs font-semibold rounded-xl text-white bg-blue-600 bg-gradient-to-r from-blue-600 to-blue-750 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-550/10 hover:shadow-lg hover:shadow-blue-500/15 active:scale-[0.985] transition-all cursor-pointer font-sans"
                    >
                      Talk to an Expert
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
          
        </div>
      </section>

      {/* 8. MODERN ENTERPRISE & PREMIUM BUSINESS FOOTER */}
      <footer className="bg-slate-950 text-slate-400 pt-20 pb-12 border-t border-slate-850 relative z-10 font-sans shadow-2xl">
        {/* Subtle horizontal gradient separator glow */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-16 border-b border-slate-850">
            
            {/* Column 1: Brand & S3 Real-time Node */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center space-x-3.5 text-white">
                <div className="p-2.5 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/10">
                  <Cloud className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-black text-sm tracking-tight text-white">CloudFile</span>
                  <span className="text-[9px] uppercase font-mono tracking-widest text-blue-400 font-extrabold mt-0.5">Enterprise Cloud Platform</span>
                </div>
              </div>
              
              <p className="text-xs text-slate-400 leading-relaxed font-semibold max-w-sm">
                Financial-grade AES-256 cloud directory solutions protecting corporate file assets. Re-architected for instant secure access, strict compliance auditing, and multi-region synchronization.
              </p>

              {/* Real-time Status Indicator Widget */}
              <div className="space-y-3">
                <div className="inline-flex items-center space-x-2.5 text-[10px] font-mono font-bold bg-blue-950/60 border border-blue-900/60 p-2 px-4 rounded-xl text-blue-450 leading-none">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ALL S3 CLUSTERS ONLINE (99.99% SLA)</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono pl-1">
                  Active Replication: <span className="text-blue-400">AWS us-east-1</span> · <span className="text-blue-400">eu-west-1</span> · <span className="text-blue-400">ap-southeast-1</span>
                </p>
              </div>

              {/* SOCIAL MEDIA HIGHLIGHTED NETWORKS */}
              <div className="space-y-3 pt-2">
                <p className="text-white text-[10px] uppercase tracking-widest font-mono font-extrabold">Corporate Relations</p>
                <div className="flex items-center space-x-3">
                  <motion.a 
                    href="https://linkedin.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 w-10.5 h-10.5 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer"
                    title="Connect with us on LinkedIn"
                  >
                    <Linkedin className="w-5 h-5" />
                  </motion.a>

                  <motion.a 
                    href="https://github.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 w-10.5 h-10.5 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 hover:shadow-lg hover:shadow-slate-500/20 transition-all duration-300 cursor-pointer"
                    title="View GitHub Repository"
                  >
                    <Github className="w-5 h-5" />
                  </motion.a>

                  <motion.a 
                    href="https://twitter.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 w-10.5 h-10.5 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-300 cursor-pointer"
                    title="Stay updated on Twitter/X"
                  >
                    <Twitter className="w-5 h-5" />
                  </motion.a>

                  <motion.a 
                    href="https://youtube.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 w-10.5 h-10.5 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-red-950/20 hover:border-[#FF0000]/40 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 cursor-pointer"
                    title="Watch updates on YouTube"
                  >
                    <Youtube className="w-5 h-5" />
                  </motion.a>
                </div>
              </div>
            </div>

            {/* Column 2: Product & Architecture */}
            <div className="space-y-4">
              <h5 className="font-extrabold text-white text-[10px] uppercase tracking-widest font-mono border-b border-slate-850 pb-2">Platform</h5>
              <ul className="space-y-3.5 text-xs font-semibold">
                <li>
                  <a href="#" className="flex items-center space-x-1 hover:text-white transition-colors group">
                    <span>Unified Dashboard</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center space-x-1 hover:text-white transition-colors group">
                    <span>Secure Directories</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center space-x-1 hover:text-white transition-colors group">
                    <span>Signed Expiring URLs</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center space-x-1 hover:text-white transition-colors group">
                    <span>AWS Sync Engine</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center space-x-1 hover:text-white transition-colors group">
                    <span>Storage Analytics</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Identity & Compliance */}
            <div className="space-y-4">
              <h5 className="font-extrabold text-white text-[10px] uppercase tracking-widest font-mono border-b border-slate-850 pb-2">Security & compliance</h5>
              <ul className="space-y-3.5 text-xs font-semibold">
                <li>
                  <a href="#" className="flex items-center space-x-1 hover:text-white transition-colors group">
                    <span>Military Encryption</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center space-x-1 hover:text-white transition-colors group">
                    <span>TLS 1.3 Credentials</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center space-x-1 hover:text-white transition-colors group">
                    <span>MFA Compliance Locks</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center space-x-1 hover:text-white transition-colors group">
                    <span>GDPR Residency Pools</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center space-x-1 hover:text-white transition-colors group">
                    <span>Continuous Audit Logs</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Governance & SLA */}
            <div className="space-y-4">
              <h5 className="font-extrabold text-white text-[10px] uppercase tracking-widest font-mono border-b border-slate-850 pb-2">Governance</h5>
              <ul className="space-y-3.5 text-xs font-semibold">
                <li>
                  <a href="#faq" className="flex items-center space-x-1 hover:text-white transition-colors group">
                    <span>System FAQ Logs</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </a>
                </li>
                <li>
                  <a href="#contact" className="flex items-center space-x-1 hover:text-white transition-colors group">
                    <span>Operations Hub</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center space-x-1 hover:text-white transition-colors group">
                    <span>Enterprise SLA Contract</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center space-x-1 hover:text-white transition-colors group">
                    <span>Status Boards</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center space-x-1 hover:text-white transition-colors group">
                    <span>Strategic Partners</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 5: Newsletter Corporate Update Form */}
            <div className="space-y-4">
              <h5 className="font-extrabold text-white text-[10px] uppercase tracking-widest font-mono border-b border-slate-850 pb-2">Advisory Stream</h5>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Receive our compliance digests, infrastructure bulletins, and new security enhancements.
              </p>
              
              {!newsletterSuccess ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newsletterEmail) {
                      setNewsletterSuccess(true);
                      setTimeout(() => {
                        setNewsletterEmail('');
                      }, 4000);
                    }
                  }}
                  className="space-y-2 pt-1"
                >
                  <div className="relative">
                    <input 
                      type="email" 
                      required
                      placeholder="business@company.com" 
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 p-3 rounded-xl transition-all font-semibold"
                    />
                    <button 
                      type="submit"
                      className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-750 text-white transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-blue-950/40 border border-blue-900/50 rounded-xl space-y-1"
                >
                  <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wide font-mono">Secured Transmission</p>
                  <p className="text-[10.5px] text-slate-300 font-semibold leading-normal">
                    Email registered. Our compliance team has queued your credentials.
                  </p>
                </motion.div>
              )}
            </div>

          </div>

          {/* Trusted Badges certifications bar */}
          <div className="py-8 border-b border-slate-850 flex flex-wrap justify-center items-center gap-6 md:gap-12" id="corporate-badges-row">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-500 leading-none">Security Accreditations</span>
            <div className="flex flex-wrap justify-center items-center gap-6">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-lg">
                SOC 2 TYPE II AUDITED
              </span>
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-lg">
                GDPR HARBOR CERTIFIED
              </span>
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-lg">
                HIPAA SAFEGUARD ALIGNED
              </span>
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-lg">
                ISO/IEC 27001 PROTOCOL
              </span>
            </div>
          </div>

          {/* Bottom Copyright & SLA items */}
          <div className="pt-8 text-xs text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4 font-semibold">
            <div className="flex flex-col md:items-start text-center md:text-left gap-1">
              <p>&copy; 2026 CloudFile Manager International. All S3 allocations fully reserved.</p>
              <p className="text-[10px] text-slate-600 font-mono">
                System cryptographic signing key: <span className="text-slate-500">SHA-256 (KMS Managed Core)</span>
              </p>
            </div>
            
            <div className="flex space-x-6 text-slate-450">
              <a href="#" className="hover:text-white transition-colors">Privacy Protocol</a>
              <span className="text-slate-700">·</span>
              <a href="#" className="hover:text-white transition-colors">Service SLA Bounds</a>
              <span className="text-slate-700">·</span>
              <a href="#" className="hover:text-white transition-colors">Security Disclosures</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}

// Inline fallback representing simple sharing icon
function Share2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={2}
    >
      <circle cx={18} cy={5} r={3} />
      <circle cx={6} cy={12} r={3} />
      <circle cx={18} cy={19} r={3} />
      <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}
