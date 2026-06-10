import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  HardDrive, ShieldAlert, BadgeDollarSign, Check, ChevronRight, FileCode, Clock, HelpCircle,
  TrendingUp, DownloadCloud, Landmark, FileText, Lock
} from 'lucide-react';
import { UserProfile } from '../types.js';

interface StorageViewProps {
  user: UserProfile;
  token: string;
  onRefresh: () => void;
}

export default function StorageView({ user, token, onRefresh }: StorageViewProps) {
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingHistory();
  }, []);

  const fetchBillingHistory = async () => {
    try {
      const response = await fetch('/api/billing/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setBillingHistory(data.history || []);
      }
    } catch (e) {
      console.error('Error fetching billing log history:', e);
    }
  };

  const handleUpgrade = async (plan: 'pro' | 'business' | 'enterprise') => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      const response = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Upgrade transmission failed');
      }

      setSuccessMsg(`Congratulations! Your workspace has been scaled to the ${plan.toUpperCase()} tier!`);
      onRefresh();
      fetchBillingHistory();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (!confirm('Are you absolutely sure you want to cancel your premium allocation? This will lower your capacity limits immediately.')) return;
    setLoading(true);
    setSuccessMsg(null);
    try {
      const response = await fetch('/api/billing/downgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: 'free' })
      });

      if (!response.ok) throw new Error('Downgrade failed');

      setSuccessMsg('Your subscription plan was reset to the basic free tier.');
      onRefresh();
      fetchBillingHistory();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 font-sans" id="storage-view-root">
      {/* Overview Head */}
      <div className="border-b border-slate-200/50 pb-5">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">Storage Optimization & Plan Matrix</h1>
        <p className="text-xs text-slate-400 mt-1">Audit secure cloud quotas and scale memory limits with automatic compliance guarantees.</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 text-xs font-semibold flex items-center space-x-3">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Storage Analytics Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/65 shadow-sm space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-medium text-slate-800 text-sm">Active Storage Consumption Ratio</h3>
              <p className="text-[11px] text-slate-400">Calculated in real time across active directories</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold font-display text-slate-800">
                {formatBytes(user.storageUsed)} <span className="text-sm text-slate-400">of {formatBytes(user.storageLimit)}</span>
              </span>
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                {user.plan} Account
              </span>
            </div>
            
            {/* Real progression bar */}
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (user.storageUsed / user.storageLimit) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Allocation insights bullet points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl">
              <p className="font-bold text-slate-700">Storage Optimization Status</p>
              <p className="text-slate-400 text-[11px] mt-1">Excellent telemetry. Deduplication pipeline filters identical files automatically inside standard AWS layers.</p>
            </div>
            <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl">
              <p className="font-bold text-slate-700">AES-256 Encryption Guarantee</p>
              <p className="text-slate-400 text-[11px] mt-1">All data written to Cloud File Manager complies with rigorous financial safeguards.</p>
            </div>
          </div>
        </div>

        {/* Upgrade alert notification card */}
        <div className="bg-slate-900 text-slate-200 p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div className="space-y-3">
            <p className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-extrabold">Active Compliance standard</p>
            <h4 className="text-lg font-display font-medium text-slate-100">Need infinite memory?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unlock multi-user folders permissioning structures, limitless file uploads indexes, and secure timed expiration download credentials with Pro keys.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span>Quota standard:</span>
            <span className="text-emerald-400 font-bold">100% compliant</span>
          </div>
        </div>
      </div>

      {/* Subscription Plans comparisons grids */}
      <div className="space-y-4">
        <div>
          <h3 className="font-display font-medium text-slate-800 text-sm">Scale Your Business Storage Infrastructure</h3>
          <p className="text-xs text-slate-400">Pricing corresponds instantly to database updates on request</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pro Plan */}
          <div className={`bg-white border rounded-3xl p-6 relative flex flex-col justify-between ${user.plan === 'pro' ? 'border-sky-400 ring-2 ring-sky-300' : 'border-slate-200'}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono uppercase text-sky-600 bg-sky-50 px-2 py-0.5 rounded">Pro Tier</span>
                {user.plan === 'pro' && <span className="text-xs font-bold text-teal-600 font-mono">● Active Plan</span>}
              </div>
              <h4 className="text-2xl font-bold font-display text-slate-800">1 TB Space</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Advanced tools for remote freelancers, designers, and system operators.</p>
              <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 1 TB Encrypted Storage</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Branded Expiry Links</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Timed Passphrase blocks</li>
              </ul>
            </div>
            
            <button 
              id="upgrade-pro-btn"
              disabled={loading || user.plan === 'pro'}
              onClick={() => handleUpgrade('pro')}
              className="w-full mt-6 py-2.5 font-bold text-xs rounded-xl bg-indigo-600 text-white hover:bg-slate-900 transition-all disabled:opacity-40 shadow"
            >
              {user.plan === 'pro' ? 'Current Active Subscription' : 'Upgrade to Pro ($9.99/mo)'}
            </button>
          </div>

          {/* Business Plan */}
          <div className={`bg-white border rounded-3xl p-6 relative flex flex-col justify-between ${user.plan === 'business' ? 'border-indigo-400 ring-2 ring-indigo-300' : 'border-slate-200'}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Team Best Value</span>
                {user.plan === 'business' && <span className="text-xs font-bold text-teal-600 font-mono">● Active Plan</span>}
              </div>
              <h4 className="text-2xl font-bold font-display text-slate-800">5 TB Space</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Perfect layout settings for modern corporate workspace and startups.</p>
              <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 5 TB High Density memory</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 90-day complete Auditor Log</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Multi-user folders administration</li>
              </ul>
            </div>
            
            <button 
              id="upgrade-business-btn"
              disabled={loading || user.plan === 'business'}
              onClick={() => handleUpgrade('business')}
              className="w-full mt-6 py-2.5 font-bold text-xs rounded-xl bg-indigo-600 text-white hover:bg-slate-900 transition-all disabled:opacity-40 shadow"
            >
              {user.plan === 'business' ? 'Current Active Subscription' : 'Upgrade to Business ($29.99/mo)'}
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className={`bg-white border rounded-3xl p-6 relative flex flex-col justify-between ${user.plan === 'enterprise' ? 'border-transparent shadow-xl ring-2 ring-indigo-600' : 'border-slate-200'}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono uppercase text-slate-800 bg-slate-100 px-2 py-0.5 rounded">Custom Tier</span>
                {user.plan === 'enterprise' && <span className="text-xs font-bold text-teal-600 font-mono">● Active Plan</span>}
              </div>
              <h4 className="text-2xl font-bold font-display text-slate-800">Unlimited</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Full compliance for global multinationals and high throughput pipelines.</p>
              <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Limitless elastic space</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Bespoke SLA Guarantees</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Dedicated operations contact engineer</li>
              </ul>
            </div>
            
            <button 
              id="upgrade-enterprise-btn"
              disabled={loading || user.plan === 'enterprise'}
              onClick={() => handleUpgrade('enterprise')}
              className="w-full mt-6 py-2.5 font-bold text-xs rounded-xl bg-indigo-600 text-white hover:bg-slate-900 transition-all disabled:opacity-40 shadow"
            >
              {user.plan === 'enterprise' ? 'Current Active Subscription' : 'Deploy Unlimited Workspace'}
            </button>
          </div>
        </div>

        {user.plan !== 'free' && (
          <div className="text-right pt-2">
            <button 
              id="downgrade-free-link"
              onClick={handleDowngrade}
              className="text-xs text-red-500 hover:underline font-semibold"
            >
              Cancel Premium Quota / Reset to Free Plan
            </button>
          </div>
        )}
      </div>

      {/* billing history */}
      <div className="space-y-3">
        <div>
          <h3 className="font-display font-medium text-slate-800 text-sm">Billing Invoices & Logs</h3>
          <p className="text-xs text-slate-400">Download direct corporate receipts in PDF format</p>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
          {billingHistory.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center space-y-1">
              <BadgeDollarSign className="w-8 h-8 text-slate-200 mb-1" />
              <p>No billing invoices recorded yet.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left">Invoice ID</th>
                  <th scope="col" className="px-6 py-3.5 text-left">Billing Date</th>
                  <th scope="col" className="px-6 py-3.5 text-left">Allocation Plan</th>
                  <th scope="col" className="px-6 py-3.5 text-left">Receipt Amount</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {billingHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-800">{item.id}</td>
                    <td className="px-6 py-4">{item.date}</td>
                    <td className="px-6 py-4 font-medium">{item.planName}</td>
                    <td className="px-6 py-4 font-mono font-bold">{item.amount}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-mono font-bold rounded-full border border-emerald-100">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
