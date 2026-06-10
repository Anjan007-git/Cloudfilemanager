import React from 'react';
import { motion } from 'motion/react';
import { 
  HardDrive, FileText, Share2, Download, CloudLightning, Plus, FolderPlus, Bell, 
  ArrowUpRight, AlertTriangle, Cloud, Layers, Activity as ActivityIcon, CheckCircle
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

  // Metrics Calculations based on real files in state
  const totalFilesCount = files.filter(f => !f.isFolder && !f.isTrashed).length;
  const sharedFilesCount = files.filter(f => (f.sharedWith.length > 0 || f.shareLink?.isPublic) && !f.isTrashed).length;
  
  // Storage size format helper
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const percentUsed = Math.min(100, (user.storageUsed / user.storageLimit) * 100);

  // File categories counting
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
    { title: "PDF & Documents", count: docCount, size: docSize, color: "bg-emerald-500", text: "text-emerald-500" },
    { title: "Creative Images", count: imgCount, size: imgSize, color: "bg-sky-500", text: "text-sky-500" },
    { title: "Archives & ZIPs", count: zipCount, size: zipSize, color: "bg-amber-500", text: "text-amber-500" },
    { title: "Uncategorized", count: otherCount, size: otherSize, color: "bg-indigo-500", text: "text-indigo-500" }
  ];

  return (
    <div className="space-y-6 font-sans" id="dashboard-view-root">
      {/* 1. Header Greeting & Quick Trigger Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/50 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-800">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-500">{user.name}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Here is your real-time cloud storage health metrics and active repositories.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            id="dashboard-quick-folder-btn"
            onClick={onCreateFolderClick}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700 transition-all cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-slate-500" />
            <span>Create Folder</span>
          </button>
          <button 
            id="dashboard-quick-upload-btn"
            onClick={onUploadClick}
            className="inline-flex items-center space-x-2 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New File</span>
          </button>
        </div>
      </div>

      {/* 2. Real-time Metrics Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Storage Used */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs uppercase font-mono tracking-wider font-bold text-slate-400">Storage Consumption</span>
            <h3 className="text-lg sm:text-xl font-bold font-display text-slate-800">{formatBytes(user.storageUsed)}</h3>
            <p className="text-[10px] text-slate-400">Usage cap: {formatBytes(user.storageLimit)}</p>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Total Files */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs uppercase font-mono tracking-wider font-bold text-slate-400">Total Active Files</span>
            <h3 className="text-lg sm:text-xl font-bold font-display text-slate-800">{totalFilesCount} Documents</h3>
            <p className="text-[10px] text-teal-600">Sync with AWS S3</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Shared Files */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs uppercase font-mono tracking-wider font-bold text-slate-400">Collaborated Assets</span>
            <h3 className="text-lg sm:text-xl font-bold font-display text-slate-800">{sharedFilesCount} Links Shared</h3>
            <p className="text-[10px] text-slate-400">Public or secure passwords</p>
          </div>
          <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl">
            <Share2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Subscription Level */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs uppercase font-mono tracking-wider font-bold text-slate-400">Subscription Grade</span>
            <h3 className="text-lg sm:text-xl font-bold font-display text-slate-800 uppercase text-indigo-700 font-bold">{user.plan} Account</h3>
            <button 
              id="dashboard-upgrade-plan-link"
              onClick={() => onNavigateView('storage')}
              className="text-[10px] text-indigo-600 hover:underline font-bold inline-flex items-center gap-0.5"
            >
              Configure or Upgrade <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
            <CloudLightning className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 3. Main Dashboard Insights Layout: Left Storage visualizer, Right Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Storage Distribution Ring and Breakdown */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
          <div>
            <h3 className="font-display font-medium text-slate-800 text-sm">Storage Capacity Gauge</h3>
            <p className="text-[11px] text-slate-400">Allocation and categorization ratios</p>
          </div>

          {/* Semicircle / Ring visual simulator */}
          <div className="relative flex items-center justify-center py-6 border-b border-slate-100">
            <div className="w-36 h-36 rounded-full border-12 border-slate-100 flex items-center justify-center relative">
              {/* Dynamic SVG Ring tracker */}
              <svg className="absolute w-36 h-36 -rotate-90">
                <circle 
                  cx="72" 
                  cy="72" 
                  r="60" 
                  fill="transparent" 
                  stroke="#6366f1" 
                  strokeWidth="12" 
                  strokeDasharray="377" 
                  strokeDashoffset={377 - (377 * percentUsed) / 100}
                />
              </svg>
              <div className="text-center">
                <span className="text-2xl font-bold font-display text-slate-800">{percentUsed.toFixed(1)}%</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 uppercase tracking-wide">Consumed Space</span>
              </div>
            </div>
          </div>

          {/* Allocation Categories */}
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block pb-1">Mime Group Distribution</span>
            
            <div className="space-y-3">
              {categories.map((cat, idx) => {
                const catPercent = user.storageUsed > 0 ? (cat.size / user.storageUsed) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`}></span>
                        <span className="font-medium text-slate-700">{cat.title} ({cat.count})</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[10px]">{formatBytes(cat.size)}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${catPercent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Dynamic Usage Analytics Charts & Recent Events activities logs */}
        <div className="lg:col-span-8 flex flex-col justify-between gap-6">
          
          {/* Top Panel: Graphical mock representation for trends */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex-1">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-display font-medium text-slate-800 text-sm">Monthly Storage Growth Trends</h3>
                <p className="text-[11px] text-slate-400">Automatic backup sync statistics for 2026</p>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-bold font-mono uppercase bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                <ActivityIcon className="w-3.5 h-3.5" />
                <span>Live telemetry</span>
              </div>
            </div>

            {/* Simulated Custom CSS/SVG Area Chart */}
            <div className="h-44 relative bg-slate-50/50 rounded-2xl border border-slate-100 p-2 flex flex-col justify-between">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-50">
                <span className="border-b border-slate-200/60 w-full h-0"></span>
                <span className="border-b border-slate-200/60 w-full h-0"></span>
                <span className="border-b border-slate-200/60 w-full h-0"></span>
              </div>

              {/* Chart Line - SVG curve path drawing */}
              <div className="w-full h-32 relative z-10">
                <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"></stop>
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00"></stop>
                    </linearGradient>
                  </defs>
                  {/* Fill Area */}
                  <path 
                    d="M 0,90 Q 100,50 200,75 T 400,20 T 500,10 L 500,100 L 0,100 Z" 
                    fill="url(#chartGrad)"
                  />
                  {/* Stroke Line */}
                  <path 
                    d="M 0,90 Q 100,50 200,75 T 400,20 T 500,10" 
                    fill="none" 
                    stroke="#4f46e5" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* X Months labels */}
              <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold px-4">
                <span>Jan (Cloud)</span>
                <span>Mar (AWS Sync)</span>
                <span>May (Vaulted)</span>
                <span>Jun (Live)</span>
              </div>
            </div>
          </div>

          {/* Bottom Panel: Recent Activities list */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-display font-medium text-slate-800 text-sm">Recent Activity Log</h3>
                <p className="text-[11px] text-slate-400">Complete immutable auditor reports</p>
              </div>
              <button 
                id="view-all-activities-link"
                onClick={() => onNavigateView('analytics')}
                className="text-[10px] text-indigo-600 hover:underline font-bold"
              >
                View Audit Center
              </button>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-6 text-slate-400 flex flex-col items-center space-y-2">
                <CheckCircle className="w-8 h-8 text-slate-200" />
                <p className="text-xs">No entries. Deploy uploads inside folders to trigger activity logs.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-2 space-y-1">
                {activities.slice(0, 3).map((act) => (
                  <div key={act.id} className="flex items-center justify-between py-2 text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="flex h-2 w-2 rounded-full bg-indigo-500"></span>
                      <div>
                        <p className="font-medium text-slate-700">{act.details}</p>
                        <span className="text-[9px] text-slate-400">{new Date(act.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-600 font-mono text-[9px] rounded uppercase border border-slate-100">{act.type}</span>
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
