import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle, MessageSquare, Send, CheckCircle, Search, Mail, BookOpen, 
  AlertCircle, CheckCircle2, ShieldCheck, Lock, FileText, Server, 
  Activity, Users, ArrowUpRight, HelpCircle as QuestionIcon, PlusCircle, Sparkles
} from 'lucide-react';

interface HelpCenterViewProps {
  token: string;
}

export default function HelpCenterView({ token }: HelpCenterViewProps) {
  const [activeTab, setActiveTab] = useState<'compliance' | 'support'>('compliance');

  // Existing states for Support Ticket
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('technical');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  // Existing states for Chatbot
  const [chatInput, setChatInput] = useState('');
  const [chatLogs, setChatLogs] = useState<any[]>([
    { sender: 'bot', text: 'Hello! I am your CloudFile Operations Agent. How can I assist you with your storage, AWS S3 configurations, or SLA agreement options today?', time: 'Just now' }
  ]);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMsg) return;

    try {
      const response = await fetch('/api/help/support-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ category: ticketCategory, subject: ticketSubject, message: ticketMsg })
      });

      if (response.ok) {
        setTicketSubmitted(true);
        setTicketSubject('');
        setTicketMsg('');
        setTimeout(() => {
          setTicketSubmitted(false);
        }, 5000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { sender: 'user', text: chatInput.trim(), time: 'Just now' };
    setChatLogs(prev => [...prev, userMsg]);
    setChatInput('');

    // Simulate smart support response
    setTimeout(() => {
      let reply = 'Our compliance engineering crew is processing your request. Standard premium corporate clients receive answers within 10 minutes.';
      const query = userMsg.text.toLowerCase();
      if (query.includes('s3') || query.includes('aws')) {
        reply = 'To link with your AWS S3 bucket directly, download our Cloud File Manager sync client, register your credentials, and S3 metadata mirrors here automatically.';
      } else if (query.includes('limit') || query.includes('storage')) {
        reply = 'You can expand workspace storage quotas anytime by navigating to the Storage Settings panel. Pro account has 200GB capacity, and Enterprise has scaling quotas.';
      } else if (query.includes('password') || query.includes('secure')) {
        reply = 'Decryption password properties can be altered inside the Settings tab. Safe expiration sharing links are enabled with Pro tiers.';
      }

      setChatLogs(prev => [...prev, { sender: 'bot', text: reply, time: 'Just now' }]);
    }, 1200);
  };

  return (
    <div className="space-y-6 font-sans pb-12" id="compliance-and-support-view-root">
      
      {/* 1. Header with Breadcrumb */}
      <div className="border-b border-slate-200/50 pb-5">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono font-bold uppercase tracking-wider mb-2">
          <span>Enterprise Workspace</span>
          <span>/</span>
          <span className="text-blue-600">Compliance & Support</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-medium tracking-tight text-slate-900 leading-tight">
          Compliance & Support Hub
        </h1>
        <p className="text-xs font-semibold text-slate-500 font-mono tracking-wide uppercase mt-1">
          Review SOC 2 and GDPR standards, browse documentation guides, or reach corporate engineers.
        </p>
      </div>

      {/* 2. Sub-Tab bar */}
      <div className="flex border-b border-slate-200/60 p-1 bg-slate-100 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'compliance' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Compliance & Trust
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'support' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Support desk & Chat
        </button>
      </div>

      {/* 3. Sliding Content Views */}
      <AnimatePresence mode="wait">
        {activeTab === 'compliance' ? (
          <motion.div
            key="compliance"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Top Status & SLA Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Activity className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-emerald-600 font-extrabold">Platform Status</span>
                  <p className="font-bold text-[#0F172A] text-xs">All Systems Operational</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                  <Server className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-extrabold">Storage Region</span>
                  <p className="font-bold text-[#0F172A] text-xs">AWS S3 Multizone Replicated</p>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-blue-600 font-extrabold">Enterprise SLA</span>
                  <p className="font-bold text-[#0F172A] text-xs">99.99% Guaranteed Uptime</p>
                </div>
              </div>
            </div>

            {/* Bento-grid of Compliance Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card 1: Security & Compliance */}
              <div className="bg-white border border-slate-200/50 p-6 rounded-3xl space-y-4 shadow-sm hover:border-slate-350 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <ShieldCheck className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-sm">Security & Compliance Standards</h3>
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Continuous enterprise audits</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  Secure continuous network protection audits integrated with AES-256 cloud encryption. SOC 1, SOC 2 Type II Certified infrastructure, and ISO 27001 prepared data silos.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="text-[10px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full font-bold text-slate-600">SOC 2 Type II</span>
                  <span className="text-[10px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full font-bold text-slate-600">ISO 27001 Prepared</span>
                  <span className="text-[10px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full font-bold text-slate-600">TLS 1.3 Encryption</span>
                </div>
              </div>

              {/* Card 2: Privacy Information */}
              <div className="bg-white border border-slate-200/50 p-6 rounded-3xl space-y-4 shadow-sm hover:border-slate-350 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <Lock className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-sm">Privacy Information & Integrity</h3>
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">GDPR / HIPAA compliance</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  We guarantee total platform privacy. Corporate data assets are processed locally to allow immediate access control, token protection, SSO audits, and safe user profile privacy.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="text-[10px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full font-bold text-slate-600">GDPR Compliant</span>
                  <span className="text-[10px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full font-bold text-slate-600">HIPAA Compliant</span>
                  <span className="text-[10px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full font-bold text-slate-600">Data Minimization</span>
                </div>
              </div>

              {/* Card 3: Terms & Policies */}
              <div className="bg-white border border-slate-200/50 p-6 rounded-3xl space-y-4 shadow-sm hover:border-slate-350 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <FileText className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-sm">Terms & Corporate Policies</h3>
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Acceptable use & standard SLAs</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  Review terms of service, storage SLA bounds, and billing guidelines. Transparent contracts avoid vendor lock-in, with standard automated metadata export policies available.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="text-[10px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full font-bold text-slate-600">Service Terms v2.4</span>
                  <span className="text-[10px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full font-bold text-slate-600">Zero Lock-in SLA</span>
                </div>
              </div>

              {/* Card 4: Data Protection */}
              <div className="bg-white border border-slate-200/50 p-6 rounded-3xl space-y-4 shadow-sm hover:border-slate-350 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                    <Lock className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-sm">Automated Data Protection</h3>
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Backups & object lock protection</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  Files are safeguarded using continuous server-side version control. Accidental deletions remain protected via regional cluster parity backups and multi-node S3 replication layers.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="text-[10px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full font-bold text-slate-600">Multi-Node</span>
                  <span className="text-[10px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full font-bold text-slate-600">Continuous Backups</span>
                  <span className="text-[10px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full font-bold text-slate-600">Object Snapping</span>
                </div>
              </div>
            </div>

            {/* Bottom Documentation & Status Checklist */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <span className="text-[9px] uppercase font-mono tracking-widest text-cyan-400 font-extrabold block">Compliance Guides & APIs</span>
                  <h4 className="font-display font-bold text-white text-base">Documentation & S3 Integration</h4>
                </div>
                <button 
                  onClick={() => setActiveTab('support')}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-white/10 text-white cursor-pointer"
                >
                  Ask support for custom setup
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs text-slate-300">
                <div className="space-y-1">
                  <span className="font-bold text-white block">S3 Bucket mounting</span>
                  <p className="text-slate-400 font-semibold leading-relaxed font-sans">Learn how to easily mirror external files into directories.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-white block">Security policies</span>
                  <p className="text-slate-400 font-semibold leading-relaxed font-sans">Verify read/write IAM policies dynamically.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-white block">Enterprise Support</span>
                  <p className="text-slate-400 font-semibold leading-relaxed font-sans">Dedicated 24/7 priority call channels.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-white block">Compliance Manuals</span>
                  <p className="text-slate-400 font-semibold leading-relaxed font-sans">Download corporate audit kits easily.</p>
                </div>
              </div>
            </div>

            {/* FAQ Help Center Accordion section inside Compliance & Support page */}
            <div className="bg-white border border-slate-200/50 p-6 sm:p-8 rounded-3xl space-y-5">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm">Help Center & Frequently Asked Questions</h3>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold mt-0.5">Quick resolutions to standard issues</p>
              </div>

              <div className="space-y-4 text-xs font-semibold">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                  <span className="text-slate-900 font-bold block">How is AWS S3 authentication done?</span>
                  <p className="text-slate-600 font-medium leading-relaxed font-sans">All AWS operations are proxied securely using regional endpoints. Custom KMS variables inside private settings allow metadata mapping safely without leaking operational keys.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                  <span className="text-slate-900 font-bold block">What is the 200 GB trial limit model?</span>
                  <p className="text-slate-600 font-medium leading-relaxed font-sans">The enterprise trial grants free sandbox folders up to 200 GB. For larger operations, select Upgrade Storage to transition into customized subscription vaults instantly.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                  <span className="text-slate-900 font-bold block">Can I retrieve permanently trashed files?</span>
                  <p className="text-slate-600 font-medium leading-relaxed font-sans">As a compliance feature, files trashed on our servers remain recoverable by administrators for up to 30 days before storage nodes execute absolute wiping policies.</p>
                </div>
              </div>
            </div>

          </motion.div>
        ) : (
          <motion.div
            key="support"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left Column: Chat bot */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white border border-slate-200/50 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between h-[525px]">
                <div className="space-y-1.5 pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h3 className="font-display font-bold text-slate-900 text-sm">Real-time S3 Operations Assistant</h3>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold font-mono uppercase tracking-wide">Automated developer hotline active</p>
                </div>

                {/* Chat content chat list */}
                <div className="flex-1 overflow-y-auto space-y-4 py-5 pr-1 text-xs">
                  {chatLogs.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-4 rounded-2xl max-w-md border ${
                        msg.sender === 'user' 
                          ? 'bg-blue-600 text-white border-blue-500/30 rounded-tr-none shadow-md shadow-blue-500/10' 
                          : 'bg-slate-50 text-slate-700 border-slate-100 rounded-tl-none font-semibold'
                      }`}>
                        <p className="leading-relaxed font-sans font-medium">{msg.text}</p>
                        <span className="text-[9px] opacity-60 block text-right mt-1.5 font-mono">{msg.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message input field */}
                <form onSubmit={handleSendMessage} className="pt-4 border-t border-slate-100 flex items-center gap-2">
                  <input 
                    id="chatbot-input-field"
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about storage, security, or AWS integration..."
                    className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-blue-600 text-slate-800 shadow-inner"
                  />
                  <button 
                    id="chatbot-send-btn"
                    type="submit"
                    className="p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow transition-all cursor-pointer border border-blue-500/20"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Ticket submission & Info */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-slate-200/50 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-sm">Report an Issue (Incident Ticket)</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Dispatches issues to off-duty reliability engineers</p>
                </div>

                {ticketSubmitted ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl space-y-3.5 py-14">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                    <h4 className="font-display font-bold text-slate-800 text-sm">Incident Ticket Registered!</h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed font-sans">Your issue has been logged inside support registers. Our team responds inside 30-60 minutes on corporate tiers.</p>
                  </div>
                ) : (
                  <form onSubmit={handleTicketSubmit} className="space-y-4 text-xs font-semibold">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">Issue Classification</label>
                      <select 
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-700 font-bold"
                      >
                        <option value="technical">S3 / Metadata sync error</option>
                        <option value="billing">Direct Invoice billing scaling</option>
                        <option value="access">Access Keys / Decryptions</option>
                        <option value="compliance">Corporate audits and trust</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">Incident Subject Line</label>
                      <input 
                        id="support-ticket-subject"
                        type="text"
                        required
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder="Cannot authenticate custom bucket credentials"
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 text-slate-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-[#94A3B8]">Describe Incident Details</label>
                      <textarea 
                        id="support-ticket-description"
                        required
                        rows={4}
                        value={ticketMsg}
                        onChange={(e) => setTicketMsg(e.target.value)}
                        placeholder="We seek to authorize a custom AWS storage bucket but the validation endpoint returns unauthorized code errors..."
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 text-slate-800 font-semibold leading-relaxed"
                      />
                    </div>

                    <button 
                      id="submit-ticket-btn"
                      type="submit"
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 font-bold text-white text-xs rounded-xl shadow-md transition-all cursor-pointer border border-blue-500/25 flex items-center justify-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Generate Support Ticket
                    </button>
                  </form>
                )}
              </div>

              {/* Blue info box for Enterprise SLA information */}
              <div className="bg-[#0A0E1A] text-slate-350 p-6 sm:p-8 rounded-3xl space-y-3 shadow-xl border border-blue-950">
                <span className="text-[9px] uppercase font-mono tracking-widest text-blue-400 font-extrabold block">Resource Blueprint Support</span>
                <h4 className="font-display font-semibold text-white text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Enterprise Dedicated Assistance
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold font-sans">
                  We guarantee 99.99% active S3 sync uptime. Reach out 24/7. Premium accounts are directly coupled with an engineering representative to facilitate deep integrations.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
