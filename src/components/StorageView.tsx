import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  HardDrive, ShieldAlert, BadgeDollarSign, Check, ChevronRight, FileCode, Clock, HelpCircle,
  TrendingUp, DownloadCloud, Landmark, FileText, Lock, Sparkles, Orbit, CheckCircle2
} from 'lucide-react';
import { UserProfile } from '../types.js';
import { apiFetch, getApiUrl } from '../firebase.js';

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
      const response = await apiFetch('/api/billing/history', {
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

  const [successPlan, setSuccessPlan] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleUpgrade = async (plan: 'pro' | 'business' | 'enterprise') => {
    if (plan === 'enterprise') {
      setLoading(true);
      setSuccessMsg(null);
      try {
        const response = await apiFetch('/api/billing/upgrade', {
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

        setSuccessMsg(`Congratulations! Your S3 workspace has been upgraded to the ${plan.toUpperCase()} tier.`);
        onRefresh();
        fetchBillingHistory();
      } catch (err: any) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setSuccessMsg(null);
    try {
      // Create Razorpay Order
      const response = await apiFetch('/api/billing/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan })
      });

      const orderData = await response.json();
      if (!response.ok) {
        throw new Error(orderData.error || 'Checkout order creation failed');
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "CloudFile Manager",
        description: `${plan.toUpperCase()} Plan Subscription`,
        order_id: orderData.id,
        handler: async function (paymentRes: any) {
          setLoading(true);
          try {
            const verifyResponse = await apiFetch('/api/billing/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_payment_id: paymentRes.razorpay_payment_id,
                razorpay_order_id: paymentRes.razorpay_order_id,
                razorpay_signature: paymentRes.razorpay_signature,
                plan: plan
              })
            });

            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok) {
              throw new Error(verifyData.error || 'Payment signature verification failed.');
            }

            setSuccessPlan(plan);
            setShowSuccessModal(true);
            setSuccessMsg(`Successfully upgraded your workspace to ${plan.toUpperCase()} tier.`);
            onRefresh();
            fetchBillingHistory();
          } catch (verifyErr: any) {
            setPaymentError(verifyErr.message || 'Verification failed');
            setShowErrorModal(true);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user.name || "",
          email: user.email || ""
        },
        theme: {
          color: "#2563EB"
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setPaymentError(err.message || 'Could not initiate Razorpay checkout');
      setShowErrorModal(true);
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (!confirm('Are you absolutely sure you want to cancel your premium allocation? This will lower your capacity limits immediately.')) return;
    setLoading(true);
    setSuccessMsg(null);
    try {
      const response = await apiFetch('/api/billing/downgrade', {
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
    <div className="space-y-8 font-sans pb-12" id="storage-view-root">
      
      {/* Overview Head */}
      <div className="border-b border-slate-200/50 pb-6">
        <h1 className="text-3xl sm:text-4xl font-display font-medium tracking-tight text-slate-900 leading-tight">
          Storage & Workspace Quotas
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Scale memory limits & synchronize files dynamically with ease</p>
      </div>

      {successMsg && (
        <div className="p-4.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 text-xs font-semibold flex items-center space-x-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 animate-bounce" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Storage Analytics Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/50 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-900 text-sm">Workspace Memory Allocation</h3>
              <p className="text-[11px] text-slate-400 font-semibold">Calculated from S3 metadata clusters</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
                {formatBytes(user.storageUsed)} <span className="text-sm font-semibold text-slate-400">of {formatBytes(user.storageLimit)} used</span>
              </span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50/70 border border-blue-100/50 px-3 py-1 rounded-full tracking-wide">
                {user.plan} Account Limit
              </span>
            </div>
            
            <div className="h-4 w-full bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500 shadow-inner"
                style={{ width: `${Math.min(100, (user.storageUsed / user.storageLimit) * 100)}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 font-semibold pt-1">
              <span>Allowed Upload Size Limit per file:</span>
              <span className="font-bold text-slate-700">
                {user.plan === 'free' ? '50 MB' : user.plan === 'pro' ? '500 MB' : user.plan === 'business' ? '2 GB' : '5 GB'}
              </span>
            </div>
          </div>

          {/* Allocation insights bullet points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-4 border border-slate-200/40 bg-slate-50/50 rounded-2xl space-y-1">
              <p className="font-bold text-slate-800">Deduplicated Backup Logs</p>
              <p className="text-slate-400 text-[11px] leading-relaxed font-semibold">Our smart compiler automatically screens S3 chunks to merge redundant files instantly.</p>
            </div>
            <div className="p-4 border border-slate-200/40 bg-slate-50/50 rounded-2xl space-y-1">
              <p className="font-bold text-slate-800">Financial-Grade Security</p>
              <p className="text-slate-400 text-[11px] leading-relaxed font-semibold">All folders and files conform to certified AES-256 standard and strict end-to-end TLS protocols.</p>
            </div>
          </div>
        </div>

        {/* Upgrade alert notification card */}
        <div className="bg-[#0A0E1A] text-slate-200 p-6 sm:p-8 rounded-3xl border border-slate-800/60 flex flex-col justify-between shadow-xl">
          <div className="space-y-3.5">
            <p className="text-xs font-semibold text-blue-400">Active Compliance Shield</p>
            <h4 className="text-xl font-display font-bold text-white tracking-tight leading-snug">Need unlimited enterprise space?</h4>
            <p className="text-xs text-slate-450 leading-relaxed font-semibold">
              Unlock multi-user whitelisting permission panels, secure key-locked share codes, and express priority operational engineers at your command.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between text-xs">
            <span className="text-slate-500">Service Status:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              100% Active
            </span>
          </div>
        </div>
      </div>

      {/* Subscription Plans comparisons grids */}
      <div className="space-y-6">
        <div>
          <h3 className="font-display font-medium text-slate-900 text-sm">Choose Your Workgroup Capacity</h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Scale memory dynamically as demands scale</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pro Plan */}
          <div className={`bg-white border rounded-3xl p-6 relative flex flex-col justify-between transition-all duration-300 ${user.plan === 'pro' ? 'border-blue-500 shadow-xl ring-2 ring-blue-100/50' : 'border-slate-200/60 hover:border-slate-350'}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100/30">Pro Tier</span>
                {user.plan === 'pro' && <span className="text-xs font-bold text-teal-600 font-mono">● Active Plan</span>}
              </div>
              <h4 className="text-3xl font-bold font-display text-slate-900 tracking-tight">200 GB Space</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">Bespoke capabilities for freelance creators and technical consultants.</p>
              <ul className="text-xs text-slate-700 space-y-2.5 pt-4 border-t border-slate-100 font-semibold">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 200 GB Encrypted Storage</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Signed share expiration dates</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Key-locked secure passphrases</li>
              </ul>
            </div>
            
            <button 
              id="upgrade-pro-btn"
              disabled={loading || user.plan === 'pro'}
              onClick={() => handleUpgrade('pro')}
              className="w-full mt-7 py-3 font-bold text-xs rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-blue-500/10 animate-fade-in"
            >
              {user.plan === 'pro' ? 'Active Membership Plan' : 'Scale to Pro (₹299 / month)'}
            </button>
          </div>

          {/* Business Plan */}
          <div className={`bg-white border rounded-3xl p-6 relative flex flex-col justify-between transition-all duration-300 ${user.plan === 'business' ? 'border-[#06b6d4] shadow-xl ring-2 ring-cyan-100/50' : 'border-slate-200/60 hover:border-slate-350'}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#06b6d4] bg-cyan-50 px-2.5 py-1 rounded-md border border-cyan-100/35">Business Tier</span>
                {user.plan === 'business' && <span className="text-xs font-bold text-teal-600 font-mono">● Active Plan</span>}
              </div>
              <h4 className="text-3xl font-bold font-display text-slate-900 tracking-tight">1 TB Space</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">Seamless multi-user cloud environments optimized for engineering and operations.</p>
              <ul className="text-xs text-slate-700 space-y-2.5 pt-4 border-t border-slate-100 font-semibold">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 1 TB High Density S3 Quotas</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 90-day Immutable operations audits</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Custom subfolders administration</li>
              </ul>
            </div>
            
            <button 
              id="upgrade-business-btn"
              disabled={loading || user.plan === 'business'}
              onClick={() => handleUpgrade('business')}
              className="w-full mt-7 py-3 font-bold text-xs rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer shadow-md"
            >
              {user.plan === 'business' ? 'Active Membership Plan' : 'Scale to Business (₹799 / month)'}
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className={`bg-white border rounded-3xl p-6 relative flex flex-col justify-between transition-all duration-300 ${user.plan === 'enterprise' ? 'border-blue-650 shadow-xl ring-2 ring-blue-200' : 'border-slate-200/60 hover:border-slate-350'}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">Corporate Premium</span>
                {user.plan === 'enterprise' && <span className="text-xs font-bold text-teal-600 font-mono">● Active Plan</span>}
              </div>
              <h4 className="text-3xl font-bold font-display text-slate-900 tracking-tight">5 TB+ Space</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">Limitless memory for high-throughput automated server sync pipelines.</p>
              <ul className="text-xs text-slate-700 space-y-2.5 pt-4 border-t border-slate-100 font-semibold font-semibold">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 5 TB+ AWS storage scaling</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Signed dedicated contract SLAs</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 24x7 Engineering support hotline</li>
              </ul>
            </div>
            
            <button 
              id="upgrade-enterprise-btn"
              disabled={loading || user.plan === 'enterprise'}
              onClick={() => handleUpgrade('enterprise')}
              className="w-full mt-7 py-3 font-bold text-xs rounded-xl bg-blue-650 hover:bg-blue-750 text-white transition-all disabled:opacity-50 cursor-pointer shadow-md"
            >
              {user.plan === 'enterprise' ? 'Active Corporate Plan' : 'Deploy Enterprise (Custom Pricing)'}
            </button>
          </div>
        </div>

        {user.plan !== 'free' && (
          <div className="text-right pt-2">
            <button 
              id="downgrade-free-link"
              onClick={handleDowngrade}
              className="text-xs text-red-500 hover:text-red-650 hover:underline font-bold cursor-pointer"
            >
              Cancel Premium Allocation / Reset to Basic Free Plan (₹0)
            </button>
          </div>
        )}

        {/* Modern Feature Comparison Matrix */}
        <div className="bg-white border border-slate-200/40 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h4 className="font-display font-semibold text-slate-900 text-sm">Feature Comparison Matrix</h4>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Compare features across all subscription plans</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-4 font-bold text-slate-900">Workspace Features</th>
                  <th className="py-3 px-4">Free (₹0 / mo)</th>
                  <th className="py-3 px-4">Pro (₹299 / mo)</th>
                  <th className="py-3 px-4">Business (₹799 / mo)</th>
                  <th className="py-3 px-4">Enterprise (Custom)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">S3 Cloud Space</td>
                  <td className="py-3.5 px-4 text-slate-500 font-bold text-red-500">5 GB limit</td>
                  <td className="py-3.5 px-4 text-slate-900">200 GB limit</td>
                  <td className="py-3.5 px-4 text-slate-950">1 TB limit</td>
                  <td className="py-3.5 px-4 text-blue-600 font-extrabold flex items-center gap-1"><Orbit className="w-3.5 h-3.5 animate-spin text-blue-500" /> 5 TB+ limit</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">Max File Upload Size</td>
                  <td className="py-3.5 px-4 text-slate-500 font-bold">50 MB</td>
                  <td className="py-3.5 px-4 text-slate-900">500 MB</td>
                  <td className="py-3.5 px-4 text-slate-900">2 GB</td>
                  <td className="py-3.5 px-4 text-slate-900">5 GB</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">Signed Link Expirations</td>
                  <td className="py-3.5 px-4 text-slate-300">—</td>
                  <td className="py-3.5 px-4 text-emerald-500">✔ Included</td>
                  <td className="py-3.5 px-4 text-emerald-500">✔ Included</td>
                  <td className="py-3.5 px-4 text-emerald-500">✔ Included</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">Password-Protected Shares</td>
                  <td className="py-3.5 px-4 text-slate-300">—</td>
                  <td className="py-3.5 px-4 text-emerald-500">✔ Included</td>
                  <td className="py-3.5 px-4 text-emerald-500">✔ Included</td>
                  <td className="py-3.5 px-4 text-emerald-500">✔ Included</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">Immutable Audit Trails</td>
                  <td className="py-3.5 px-4 text-slate-300">—</td>
                  <td className="py-3.5 px-4 text-slate-300">—</td>
                  <td className="py-3.5 px-4"><span className="text-xs text-cyan-650 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-100">90-Day Logs</span></td>
                  <td className="py-3.5 px-4"><span className="text-xs text-blue-650 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 font-semibold">Infinite Logs</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">Service SLA Guarantee</td>
                  <td className="py-3.5 px-4 text-slate-300">—</td>
                  <td className="py-3.5 px-4 text-slate-300">—</td>
                  <td className="py-3.5 px-4 text-slate-500">99.9% Up-time</td>
                  <td className="py-3.5 px-4 text-emerald-500 font-extrabold">99.99% Signed</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">Support Level</td>
                  <td className="py-3.5 px-4 text-slate-400">Community</td>
                  <td className="py-3.5 px-4 text-slate-500">Email (24h)</td>
                  <td className="py-3.5 px-4 text-slate-800 font-semibold">Priority response (2h)</td>
                  <td className="py-3.5 px-4 text-blue-600 font-extrabold">24x7 Support Hotline</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* billing history */}
      <div className="space-y-5">
        <div>
          <h3 className="font-display font-medium text-slate-900 text-sm">Direct Payment History</h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Audit complete transaction logs and receipts</p>
        </div>

        <div className="bg-white border border-slate-200/50 rounded-2xl overflow-x-auto shadow-sm">
          {billingHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center space-y-1">
              <BadgeDollarSign className="w-8 h-8 text-slate-350 mb-1" />
              <p className="font-semibold text-slate-500 leading-snug">No active direct invoices recorded yet.</p>
            </div>
          ) : (
            <div className="min-w-[600px] sm:min-w-0">
              <table className="min-w-full divide-y divide-slate-150 text-xs text-slate-700 font-semibold">
              <thead className="bg-[#F8FAFC]/55 text-xs text-slate-500 font-semibold border-b border-slate-200/40">
                <tr>
                   <th scope="col" className="px-6 py-4 text-left">Invoice Identification ID</th>
                   <th scope="col" className="px-6 py-4 text-left">Date Issued</th>
                   <th scope="col" className="px-6 py-4 text-left">Tier Grade</th>
                   <th scope="col" className="px-6 py-4 text-left">Receipt Sum</th>
                   <th scope="col" className="px-6 py-4 text-right">Invoice Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {billingHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{item.id}</td>
                    <td className="px-6 py-4 text-slate-400 font-sans text-xs">{item.date}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{item.planName}</td>
                    <td className="px-6 py-4 font-mono font-black text-slate-950">{item.amount}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold rounded-full text-xs shadow-sm shadow-emerald-500/5">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl text-center space-y-5"
          >
            <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 shadow-sm animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-sans font-bold text-slate-900 text-lg">Payment Successful!</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Your payment was securely processed. Your CloudFile Manager workspace has been upgraded to the <span className="font-extrabold text-blue-600 uppercase">{successPlan}</span> plan.
              </p>
            </div>
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 font-bold text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer shadow-md"
            >
              Continue to Workspace
            </button>
          </motion.div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl text-center space-y-5"
          >
            <div className="mx-auto w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center border border-red-100 shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-sans font-bold text-slate-900 text-lg">Payment Failed</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                We encountered an error while processing your transaction. No charges were made.
              </p>
              {paymentError && (
                <div className="p-3 bg-red-50/50 rounded-xl border border-red-100/30 text-[10px] text-red-650 font-mono font-semibold break-all text-left">
                  {paymentError}
                </div>
              )}
            </div>
            <button 
              onClick={() => {
                setShowErrorModal(false);
                setPaymentError(null);
              }}
              className="w-full py-3 font-bold text-xs rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer shadow-md"
            >
              Dismiss
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
}
