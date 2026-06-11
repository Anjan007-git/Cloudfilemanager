import React from 'react';
import { motion } from 'motion/react';
import { 
  HardDrive, FileText, Share2, Download, CloudLightning, Plus, FolderPlus, Bell, 
  ArrowUpRight, AlertTriangle, Cloud, Layers, Activity as ActivityIcon, CheckCircle, Orbit, ShieldCheck
} from 'lucide-react';
import { CloudFile, Activity, UserProfile } from '../types.js';

interface DashboardProps {
  user: UserProfile;
  files: CloudFile[];
  activities: Activity[];
  onUploadClick: () => void;
  onCreateFolderClick: () => void;
  onNavigateView: (view: string) => void;
  onSelectFolder: (folderId: string | null) => void;
}

export default function DashboardView({ 
  user, 
  files, 
  activities, 
  onUploadClick, 
  onCreateFolderClick, 
  onNavigateView,
  onSelectFolder
}: DashboardProps) {

  // Metrics calculations from live database records
  const totalFilesCount = files.filter(f => !f.isFolder && !f.isTrashed).length;
  const sharedFilesCount = files.filter(f => (f.sharedWith.length > 0 || f.shareLink?.isPublic) && !f.isTrashed).length;
  const downloadsCount = activities.filter(a => a.details.toLowerCase().includes('download')).length;

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatStorageUsed = (bytes: number) => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb < 0.1) {
      // Show fine-grained MB/KB scale if storage is very tiny
      return formatBytes(bytes);
    }
    return `${gb.toFixed(1)} GB`;
  };

  const percentUsed = Math.min(100, (user.storageUsed / user.storageLimit) * 100);

  // File categories distribution
  let docCount = 0, imgCount = 0, zipCount = 0, otherCount = 0;
  let docSize = 0, imgSize = 0, zipSize = 0, otherSize = 0;

  files.filter(f => !f.isFolder && !f.isTrashed).forEach(f => {
    const mime = f.mimeType.toLowerCase();
    if (mime.startsWith('image/')) {
      imgCount++;
      imgSize += f.size;
    } else if (mime.includes('pdf') || mime.includes('word') || mime.includes('document') || mime.includes('sheet') || mime.includes('text')) {
      docCount++;
      docSize += f.size;
    } else if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar') || mime.includes('archive')) {
      zipCount++;
      zipSize += f.size;
    } else {
      otherCount++;
      otherSize += f.size;
    }
  });

  const categories = [
    { title: "Documents & PDFs", count: docCount, size: docSize, color: "bg-blue-600", text: "text-blue-600" },
    { title: "Creative & Images", count: imgCount, size: imgSize, color: "bg-cyan-500", text: "text-cyan-500" },
    { title: "Archives & ZIPs", count: zipCount, size: zipSize, color: "bg-emerald-500", text: "text-emerald-500" },
    { title: "Uncategorized Assets", count: otherCount, size: otherSize, color: "bg-slate-400", text: "text-slate-400" }
  ];

  // Motion variants for consistent high-quality staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <div className="space-y-10 font-sans text-slate-800" id="dashboard-view-root">
      
      {/* 1. Header Greeting & Actions Area - Styled to resemble high-end SaaS dashboards */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-100 mt-2">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50/70 rounded-full border border-blue-100/30 text-blue-600 text-[11px] font-semibold tracking-wide">
            <CloudLightning className="w-3.5 h-3.5 text-blue-500" />
            <span>Active Cloud S3 Console</span>
          </div>
          <h1 className="text-3xl md:text-[36px] font-bold text-slate-900 tracking-tight leading-tight">
            Welcome back, <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500">{user.name}</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium">Monitor secure channels, storage allocations, and audit logs with enterprise grade precision.</p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button 
            id="dashboard-quick-folder-btn"
            onClick={onCreateFolderClick}
            className="h-11 px-5 inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-full text-xs font-semibold text-slate-700 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <FolderPlus className="w-4 h-4 text-slate-500" />
            <span>New Folder</span>
          </button>
          
          <button 
            id="dashboard-quick-upload-btn"
            onClick={onUploadClick}
            className="h-11 px-6 inline-flex items-center justify-center gap-2 bg-[#005AE2] hover:bg-[#004dc5] text-white rounded-full text-xs font-bold shadow-lg shadow-blue-500/15 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Files</span>
          </button>
        </div>
      </div>

      {/* 2. Premium Analytics Metric Cards - Enhanced with clean elevations and entrance animations */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        
        {/* Metric 1: Total Files */}
        <motion.div 
          variants={cardVariants}
          className="bg-white p-6 rounded-2xl border border-slate-200/40 hover:border-blue-200 shadow-sm transition-all duration-300 flex items-start justify-between relative overflow-hidden group cursor-pointer"
        >
          <div className="space-y-4 relative z-10">
            <span className="text-xs font-semibold text-slate-500 tracking-wide block">Total Active Objects</span>
            <div className="space-y-1">
              <h3 className="text-3xl font-black font-display text-slate-900 tracking-tight leading-none">{totalFilesCount}</h3>
              <p className="text-xs text-slate-400 font-medium">Consolidated files index</p>
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100/80 transition-colors">
            <Layers className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Metric 2: Storage Used */}
        <motion.div 
          variants={cardVariants}
          className="bg-white p-6 rounded-2xl border border-slate-200/40 hover:border-emerald-200 shadow-sm transition-all duration-300 flex items-start justify-between relative overflow-hidden group cursor-pointer"
        >
          <div className="space-y-4 relative z-10">
            <span className="text-xs font-semibold text-slate-500 tracking-wide block">Quota Consumed</span>
            <div className="space-y-1">
              <h3 className="text-3xl font-black font-display text-slate-900 tracking-tight leading-none">{formatStorageUsed(user.storageUsed)}</h3>
              <p className="text-xs text-slate-400 font-medium">of {formatStorageUsed(user.storageLimit)} allocation</p>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100/80 transition-colors">
            <HardDrive className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Metric 3: Shared Files */}
        <motion.div 
          variants={cardVariants}
          className="bg-white p-6 rounded-2xl border border-slate-200/40 hover:border-purple-200 shadow-sm transition-all duration-300 flex items-start justify-between relative overflow-hidden group cursor-pointer"
        >
          <div className="space-y-4 relative z-10">
            <span className="text-xs font-semibold text-slate-500 tracking-wide block">Replicated Shares</span>
            <div className="space-y-1">
              <h3 className="text-3xl font-black font-display text-slate-900 tracking-tight leading-none">{sharedFilesCount}</h3>
              <p className="text-xs text-slate-400 font-medium">Public & group limited links</p>
            </div>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100/80 transition-colors">
            <Share2 className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Metric 4: Downloads */}
        <motion.div 
          variants={cardVariants}
          className="bg-white p-6 rounded-2xl border border-slate-200/40 hover:border-amber-200 shadow-sm transition-all duration-300 flex items-start justify-between relative overflow-hidden group cursor-pointer"
        >
          <div className="space-y-4 relative z-10">
            <span className="text-xs font-semibold text-slate-500 tracking-wide block">Gateway Downloads</span>
            <div className="space-y-1">
              <h3 className="text-3xl font-black font-display text-slate-900 tracking-tight leading-none">{downloadsCount}</h3>
              <p className="text-xs text-slate-400 font-medium">Verified gateway transfers</p>
            </div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100/80 transition-colors">
            <Download className="w-5 h-5" />
          </div>
        </motion.div>

      </motion.div>

      {/* 3. Deep insights layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Grid Content: Storage radial ring and categories breakdown */}
        <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/40 shadow-sm space-y-8 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-slate-900 text-base">Capacity Allocation</h3>
            <p className="text-xs text-slate-450 font-medium">Live partition tracking status</p>
          </div>

          {/* Premium Radial Capacity Meter */}
          <div className="relative flex items-center justify-center py-4 border-b border-slate-100">
            <div className="w-44 h-44 rounded-full border-[10px] border-slate-50 flex items-center justify-center relative shadow-inner">
              {/* SVG Ring container with beautiful royalty color stroke */}
              <svg className="absolute w-44 h-44 -rotate-90">
                <circle 
                  cx="88" 
                  cy="88" 
                  r="74" 
                  fill="transparent" 
                  stroke="#f1f5f9" 
                  strokeWidth="8"
                />
                <circle 
                  cx="88" 
                  cy="88" 
                  r="74" 
                  fill="transparent" 
                  stroke="url(#blueIndigoGrad)" 
                  strokeWidth="8" 
                  strokeDasharray="464" 
                  strokeDashoffset={464 - (464 * percentUsed) / 100}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="blueIndigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="50%" stopColor="#4F46E5" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="text-center space-y-1 z-10">
                <span className="text-3xl font-extrabold font-display text-slate-950 tracking-tight block">{percentUsed.toFixed(1)}%</span>
                <span className="text-xs font-semibold text-cyan-500 tracking-wide block">Used Quota</span>
              </div>
            </div>
          </div>

          {/* Mime Breakdown lists */}
          <div className="space-y-5">
            <span className="text-xs font-bold text-slate-500 tracking-wide block">Cluster Breakdown</span>
            
            <div className="space-y-4">
              {categories.map((cat, idx) => {
                const catPercent = user.storageUsed > 0 ? (cat.size / user.storageUsed) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${cat.color} shadow-sm`}></span>
                        <span className="font-bold text-slate-700">{cat.title} <span className="text-xs text-slate-400 font-normal">({cat.count})</span></span>
                      </div>
                      <span className="text-slate-500 font-mono text-[10.5px] font-bold">{formatBytes(cat.size)}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 border border-slate-100 rounded-full overflow-hidden p-0.5">
                      <div className={`h-full ${cat.color} rounded-full transition-all duration-500`} style={{ width: `${Math.max(3, catPercent)}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Grid Content: Analytics trend chart and complete auditor history logs */}
        <div className="lg:col-span-8 flex flex-col justify-between gap-8">
          
          {/* Top telemetry Area Chart */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/40 shadow-sm flex-1">
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6 font-sans">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-base">Automated Storage Telemetry</h3>
                <p className="text-xs text-slate-400 font-medium">Real-time S3 infrastructure synchronizations</p>
              </div>
              <div className="flex items-center space-x-2 bg-blue-50/75 text-blue-600 px-3.5 py-1.5 rounded-full border border-blue-100/50 text-xs font-semibold leading-none">
                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span>Active Link</span>
              </div>
            </div>

            {/* Custom vector Area Curve Chart representation */}
            <div className="h-48 relative bg-slate-50/70 rounded-2xl border border-slate-100 p-4 flex flex-col justify-between overflow-hidden">
              <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-50">
                <span className="border-b border-dashed border-slate-200 w-full h-0"></span>
                <span className="border-b border-dashed border-slate-200 w-full h-0"></span>
                <span className="border-b border-dashed border-slate-200 w-full h-0"></span>
              </div>

              <div className="w-full h-36 relative z-10 mt-1">
                <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="glowG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22"></stop>
                      <stop offset="100%" stopColor="#312E81" stopOpacity="0.00"></stop>
                    </linearGradient>
                  </defs>
                  <path 
                    d="M 0,90 Q 80,60 160,80 T 320,30 T 420,15 L 500,10 L 500,100 L 0,100 Z" 
                    fill="url(#glowG)"
                  />
                  <path 
                    d="M 0,90 Q 80,60 160,80 T 320,30 T 420,15 L 500,10" 
                    fill="none" 
                    stroke="#2563EB" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-4 z-20">
                <span>Active Sandbox</span>
                <span>Pipeline</span>
                <span>Encrypted</span>
                <span>Live Mirror</span>
              </div>
            </div>
          </div>

          {/* Bottom auditor events activity panel */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/40 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-base">Immutable Operations Audit</h3>
                <p className="text-xs text-slate-400 font-medium">Traceable continuous platform operations</p>
              </div>
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/60 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-650 leading-none">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Trace</span>
              </div>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-10 text-slate-400 flex flex-col items-center space-y-3">
                <CheckCircle className="w-8 h-8 text-slate-200 animate-pulse" />
                <p className="text-xs font-semibold leading-relaxed">No operations audit records currently in storage.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/50 text-xs text-slate-400 font-semibold">
                    <th scope="col" className="px-4 py-3 rounded-l-xl">Operation</th>
                    <th scope="col" className="px-4 py-3 text-center">Type</th>
                    <th scope="col" className="px-4 py-3 text-right rounded-r-xl">Execution Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-650">
                  {activities.slice(0, 4).map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50/40">
                      <td className="px-4 py-3.5 font-bold text-slate-800">
                        <div className="flex items-center space-x-2.5 truncate max-w-xs sm:max-w-md">
                          <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0 animate-pulse"></span>
                          <span className="truncate">{act.details}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="px-2.5 py-1 bg-slate-100/70 text-slate-700 text-xs rounded-lg border border-slate-200/40 font-semibold capitalize">{act.type}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-[10.5px] font-mono text-slate-400 font-semibold">
                        {new Date(act.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
