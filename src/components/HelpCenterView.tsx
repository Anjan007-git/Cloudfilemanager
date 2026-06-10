import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  HelpCircle, MessageSquare, Send, CheckCircle, Search, Mail, BookOpen, AlertCircle 
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
    <div className="space-y-6 font-sans" id="help-center-view-root">
      {/* help header */}
      <div className="border-b border-slate-200/50 pb-5">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">Support Operations Desk</h1>
        <p className="text-xs text-slate-400 mt-1">Acquire S3 connection blueprints, generate support tickets, and chat directly with operational technicians.</p>
      </div>

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Chatbots and support tickers */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card A: Chatbot terminal */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between h-[480px]">
            <div className="space-y-1 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="font-display font-medium text-slate-800 text-sm">Interactive Operations Assistant Chat</h3>
              </div>
              <p className="text-[10px] text-slate-400">Ask about S3 configs, credentials, or billing</p>
            </div>

            {/* Chat content container list */}
            <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1 text-xs">
              {chatLogs.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3.5 rounded-2xl max-w-sm border ${
                    msg.sender === 'user' ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' : 'bg-slate-50 text-slate-700 border-slate-100 rounded-tl-none'
                  }`}>
                    <p className="leading-relaxed font-medium">{msg.text}</p>
                    <span className="text-[9px] opacity-60 block text-right mt-1 font-mono">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Message input trigger */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <input 
                id="chatbot-input-field"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Can I sync my local Dropbox directories natively?"
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 font-medium text-slate-800"
              />
              <button 
                id="chatbot-send-btn"
                type="submit"
                className="p-3 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl shadow cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Ticketing */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card B: Support Ticket Submission Form */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-display font-medium text-slate-800 text-sm">Generate Incident Support Ticket</h3>
              <p className="text-[10px] text-slate-400">Transmits formal support tickets to engineering lists</p>
            </div>

            {ticketSubmitted ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl space-y-3 py-12">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-display font-bold text-slate-800 text-sm">Support Ticket Transmission Logged!</h4>
                <p className="text-xs text-slate-500">Subject received. Standard SLA responses fall inside 1-2 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="space-y-4 text-xs font-medium">
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">Issue Categorization</label>
                  <select 
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-semibold text-slate-700"
                  >
                    <option value="technical">S3 / Technical Sync Fault</option>
                    <option value="billing">Invoices / Subscription scale</option>
                    <option value="access">Access Keys Recovery</option>
                    <option value="compliance">Security & Audits Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">Subject Title</label>
                  <input 
                    id="support-ticket-subject"
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Cannot authenticate custom AWS S3 API key"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">Describe operational problem</label>
                  <textarea 
                    id="support-ticket-description"
                    required
                    rows={4}
                    value={ticketMsg}
                    onChange={(e) => setTicketMsg(e.target.value)}
                    placeholder="We seek to authorize a custom AWS storage bucket but the validation endpoint returns unauthorized code errors..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium text-slate-800"
                  />
                </div>

                <button 
                  id="submit-ticket-btn"
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-slate-900 font-bold text-xs text-white rounded-xl shadow-md cursor-pointer"
                >
                  Generate Corporate Support Ticket
                </button>
              </form>
            )}
          </div>

          {/* Card C: Static Resource Documents */}
          <div className="bg-slate-50 border border-slate-250 p-5 rounded-3xl space-y-3">
            <span className="text-[9px] uppercase font-mono tracking-widest text-indigo-700 font-extrabold block">Resource Knowledgebase</span>
            <h4 className="font-display font-semibold text-slate-800 text-xs">AWS S3 Connection blueprints</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every newly created folder or directory maps natively of your backends. Seek AWS bucket tutorials, encryption rules, or JSON policies directly inside our compliance page.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
