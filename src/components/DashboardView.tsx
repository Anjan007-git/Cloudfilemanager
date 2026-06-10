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
    { title: "PDF & Documents", count: docCount, size: docSize, color: "bg-blue-600", text: "text-blue-600" },
    { title: "Creative Images", count: imgCount, size: imgSize, color: "bg-cyan-500", text: "text-cyan-500" },
    { title: "Archives & ZIPs", count: zipCount, size: zipSize, color: "bg-emerald-500", text: "text-emerald-500" },
    { title: "Uncategorized Assets", count: otherCount, size: otherSize, color: "bg-slate-400", text: "text-slate-400" }
  ];

  return (
    <div className="space-y-8 font-sans" id="dashboard-view-root">
      
      {/* 1. Header Greeting & Actions Area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-slate-200/50 pb-6">
        <div className="space-y-1.55">
          <h1 className="text-3xl sm:text-4xl font-display font-medium tracking-tight text-slate-900 leading-tight">
            Welcome back, <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500">{user.name}</span> 👋
          </h1>
          <p className="text-xs font-semibold text-slate-400 font-mono tracking-wide uppercase">Here's what's happening with your files today.</p>
        </div>

        <div className="flex items-center space-x-3.5">
          <button 
            id="dashboard-quick-folder-btn"
            onClick={onCreateFolderClick}
            className="inline-flex items-center space-x-2 px-4.5 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-sm"
          >
            <FolderPlus className="w-4 h-4 text-slate-500" />
            <span>New Folder</span>
          </button>
          
          <button 
            id="dashboard-quick-upload-btn"
            onClick={onUploadClick}
            className="inline-flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-xs font-bold text-white rounded-xl shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Files</span>
          </button>
        </div>
      </div>

      {/* 2. Premium Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Total Files */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/50 hover:border-slate-350 shadow-sm hover:shadow-md transition-all duration-300 flex items-start justify-between relative overflow-hidden group">
          <div className="space-y-3 relative z-10">
            <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400 block">Total Files</span>
            <h3 className="text-2xl font-bold font-display text-slate-900 tracking-tight leading-none">{totalFilesCount}</h3>
            <p className="text-[10px] text-slate-500 font-semibold font-mono">Based on active objects</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-100 transition-colors">
            <Layers className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        {/* Metric 2: Storage Used */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/50 hover:border-slate-350 shadow-sm hover:shadow-md transition-all duration-300 flex items-start justify-between relative overflow-hidden group">
          <div className="space-y-3 relative z-10">
            <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400 block">Storage Used</span>
            <h3 className="text-2xl font-bold font-display text-slate-900 tracking-tight leading-none">{formatStorageUsed(user.storageUsed)}</h3>
            <p className="text-[10px] text-slate-500 font-semibold font-mono">of {formatStorageUsed(user.storageLimit)} capacity</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-100 transition-colors">
            <HardDrive className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        {/* Metric 3: Shared Files */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/50 hover:border-slate-350 shadow-sm hover:shadow-md transition-all duration-300 flex items-start justify-between relative overflow-hidden group">
          <div className="space-y-3 relative z-10">
            <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400 block">Shared Files</span>
            <h3 className="text-2xl font-bold font-display text-slate-900 tracking-tight leading-none">{sharedFilesCount}</h3>
            <p className="text-[10px] text-slate-500 font-semibold font-mono">With active shared keys</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-650 rounded-2xl group-hover:bg-purple-100 transition-colors">
            <Share2 className="w-5 h-5 text-purple-650" />
          </div>
        </div>

        {/* Metric 4: Downloads */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/50 hover:border-slate-350 shadow-sm hover:shadow-md transition-all duration-300 flex items-start justify-between relative overflow-hidden group">
          <div className="space-y-3 relative z-10">
            <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400 block">Downloads</span>
            <h3 className="text-2xl font-bold font-display text-slate-900 tracking-tight leading-none">{downloadsCount}</h3>
            <p className="text-[10px] text-slate-500 font-semibold font-mono">Through secure gateway</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-100 transition-colors">
            <Download className="w-5 h-5 text-amber-600" />
          </div>
        </div>

      </div>

      {/* 3. Deep insights layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Grid Content: Storage radial ring and categories breakdown */}
        <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/50 shadow-sm space-y-8 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="font-display font-medium text-slate-900 text-sm">Capacity Allocation</h3>
            <p className="text-[11px] text-slate-400 font-semibold">Live division status indicators</p>
          </div>

          {/* Premium Radial Capacity Meter */}
          <div className="relative flex items-center justify-center py-4 border-b border-slate-100">
            <div className="w-40 h-40 rounded-full border-[10px] border-slate-50 flex items-center justify-center relative">
              {/* SVG Ring container with beautiful royalty color stroke */}
              <svg className="absolute w-40 h-40 -rotate-90">
                <circle 
                  cx="80" 
                  cy="80" 
                  r="70" 
                  fill="transparent" 
                  stroke="#e2e8f0" 
                  strokeWidth="8"
                  opacity="0.3"
                />
                <circle 
                  cx="80" 
                  cy="80" 
                  r="70" 
                  fill="transparent" 
                  stroke="url(#blueCyanGrad)" 
                  strokeWidth="8" 
                  strokeDasharray="440" 
                  strokeDashoffset={440 - (440 * percentUsed) / 100}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="blueCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="text-center space-y-1 z-10">
                <span className="text-3xl font-bold font-display text-slate-900 tracking-tight block">{percentUsed.toFixed(1)}%</span>
                <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 font-extrabold block">Used quota</span>
              </div>
            </div>
          </div>

          {/* Mime Breakdown lists */}
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold block">Storage breakdown by Category</span>
            
            <div className="space-y-3.5">
              {categories.map((cat, idx) => {
                const catPercent = user.storageUsed > 0 ? (cat.size / user.storageUsed) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${cat.color} shadow-sm`}></span>
                        <span className="font-semibold text-slate-700">{cat.title} <span className="text-[10px] text-slate-400">({cat.count})</span></span>
                      </div>
                      <span className="text-slate-400 font-mono text-[10px] font-bold">{formatBytes(cat.size)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${cat.color} rounded-full transition-all duration-500`} style={{ width: `${Math.max(3, catPercent)}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Grid Content: Analytics trend chart and complete auditor history logs */}
        <div className="lg:col-span-8 flex flex-col justify-between gap-6">
          
          {/* Top telemetry Area Chart */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/50 shadow-sm flex-1">
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-5">
              <div>
                <h3 className="font-display font-medium text-slate-950 text-sm">Automated Storage Telemetry</h3>
                <p className="text-[11px] text-slate-400 font-semibold">Real-time S3 cloud synchronize pipeline</p>
              </div>
              <div className="flex items-center space-x-1.5 text-[9px] font-bold font-mono uppercase bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">
                <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span>Active channel</span>
              </div>
            </div>

            {/* Custom vector Area Curve Chart representation */}
            <div className="h-44 relative bg-slate-50/50 rounded-2xl border border-slate-100 p-3 flex flex-col justify-between overflow-hidden">
              <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-40">
                <span className="border-b border-dashed border-slate-200 w-full h-0"></span>
                <span className="border-b border-dashed border-slate-200 w-full h-0"></span>
                <span className="border-b border-dashed border-slate-200 w-full h-0"></span>
              </div>

              <div className="w-full h-32 relative z-10 mt-1">
                <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="glowG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25"></stop>
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.00"></stop>
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
                    strokeWidth="3" 
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold px-4 z-20">
                <span>Jan (Sandbox)</span>
                <span>Mar (MFA sync)</span>
                <span>May (Vault active)</span>
                <span>Jun (Active S3)</span>
              </div>
            </div>
          </div>

          {/* Bottom auditor events activity panel */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/50 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-150 mb-4">
              <div>
                <h3 className="font-display font-medium text-slate-900 text-sm font-semibold">Immutable Operations Audit</h3>
                <p className="text-[11px] text-slate-400 font-semibold">Traceable platform activity session logs</p>
              </div>
              <div className="flex items-center space-x-1 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full text-[10px] text-slate-500 font-mono font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Trace</span>
              </div>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-8 text-slate-400 flex flex-col items-center space-y-2.5">
                <CheckCircle className="w-8 h-8 text-slate-200 animate-bounce" />
                <p className="text-xs font-semibold leading-relaxed">No operations audit records stored in database.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-2 space-y-1.5 font-mono">
                {activities.slice(0, 3).map((act) => (
                  <div key={act.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="flex h-2 w-2 rounded-full bg-blue-500 shadow-sm animate-pulse"></span>
                      <div>
                        <p className="font-semibold text-slate-700 leading-snug">{act.details}</p>
                        <span className="text-[9px] text-slate-400 font-sans block mt-0.5">{new Date(act.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-slate-50 text-slate-500 font-mono font-bold text-[9px] rounded-lg uppercase border border-slate-200/60 shadow-sm">{act.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
