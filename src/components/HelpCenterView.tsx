import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  HelpCircle, MessageSquare, Send, CheckCircle, Search, Mail, BookOpen, AlertCircle, CheckCircle2 
} from 'lucide-react';

interface HelpCenterViewProps {
  token: string;
}

export default function HelpCenterView({ token }: HelpCenterViewProps) {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('technical');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  // Simple live chat chatbot mock interface
  const [chatInput, setChatInput] = useState('');
  const [chatLogs, setChatLogs] = useState<any[]>([
    { sender: 'bot', text: 'Hello! I am your CFM Operations Agent. How can I assist you with your storage, AWS S3 configurations, or subscription plans today?', time: 'Just now' }
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
      let reply = 'Our engineering crew is processing your request. Standard premium corporate clients receive answers within 10 minutes.';
      const query = userMsg.text.toLowerCase();
      if (query.includes('s3') || query.includes('aws')) {
        reply = 'To link with your AWS S3 bucket directly, download our Cloud File Manager sync client, register your credentials, and S3 metadata mirrors here automatically.';
      } else if (query.includes('limit') || query.includes('storage')) {
        reply = 'You can expand workspace storage quotas anytime by navigating to the Storage Settings panel. Pro account has 1TB capacity, and Business has 5TB space.';
      } else if (query.includes('password') || query.includes('secure')) {
        reply = 'Decryption password properties can be altered inside the Settings tab. Safe expiration sharing links are enabled with Pro tiers.';
      }

      setChatLogs(prev => [...prev, { sender: 'bot', text: reply, time: 'Just now' }]);
    }, 1200);
  };

  return (
    <div className="space-y-8 font-sans pb-12" id="help-center-view-root">
      
      {/* Help header */}
      <div className="border-b border-slate-200/50 pb-6">
        <h1 className="text-3xl sm:text-4xl font-display font-medium tracking-tight text-slate-900 leading-tight">
          Operational Support desk
        </h1>
        <p className="text-xs font-semibold text-slate-400 font-mono tracking-wide uppercase mt-1">Acquire S3 connection blueprints & secure support tickets</p>
      </div>

      {/* Grid layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Chat bot */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white border border-slate-200/50 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between h-[520px]">
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
                    <p className="leading-relaxed">{msg.text}</p>
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
                placeholder="Can I sync my local Dropbox directories natively?"
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

        {/* Right Column: Ticket submission */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white border border-slate-200/50 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm">Create Technical Incident Ticket</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Dispatches issues to off-duty reliability engineers</p>
            </div>

            {ticketSubmitted ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl space-y-3.5 py-14">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="font-display font-bold text-slate-800 text-sm">Incident Ticket Registered!</h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">Subject logged inside support registers. Our team responds inside 30-60 minutes on corporate tiers.</p>
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
                  <label className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-[#94A3B8]">Describe Incident Details</label>
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
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 font-bold text-white text-xs rounded-xl shadow-md transition-all cursor-pointer border border-blue-500/25 animate-pulse"
                >
                  Generate Corporate Support Ticket
                </button>
              </form>
            )}
          </div>

          {/* Card C: blue info box */}
          <div className="bg-[#0A0E1A] text-slate-350 p-6 sm:p-8 rounded-3xl space-y-3 shadow-xl">
            <span className="text-[9px] uppercase font-mono tracking-widest text-blue-400 font-extrabold block">Resource blueprint guides</span>
            <h4 className="font-display font-semibold text-white text-sm">Compliance Connections S3</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Every folder inside the S3 workspace maps to live cloud memory points. View tutorial JSON policies or API authentication strategies directly in our system index files.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
