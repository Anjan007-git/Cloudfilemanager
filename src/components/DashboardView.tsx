import React from 'react';
import { motion } from 'motion/react';
import { 
  Folder, Cloud, Share2, BarChart3, FileText, MoreVertical, X, Upload, ArrowUpRight, Plus, ExternalLink
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

  // Fallback avatars list (just for rendering in list item designers safely)
  const avatarRefs = {
    emma: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    john: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
  };

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Real data only calculations
  const totalFilesOnCloud = files.filter(f => !f.isFolder && !f.isTrashed).length;
  const sharedFilesOnCloud = files.filter(f => (f.sharedWith?.length > 0 || f.shareLink?.isPublic) && !f.isTrashed).length;
  const downloadsOnCloud = activities.filter(a => a.details.toLowerCase().includes('download') || a.details.toLowerCase().includes('downloaded')).length;

  // Real display strings with zero fake/demo seeding sums
  const displayTotalFiles = totalFilesOnCloud.toLocaleString();
  const displayStorageUsed = formatBytes(user.storageUsed);
  const displaySharedFiles = sharedFilesOnCloud.toString();
  const displayDownloads = downloadsOnCloud.toString();

  // Storage limit formatting
  const limitBytes = user.storageLimit || 200 * 1024 * 1024 * 1024; // fallback to 200GB if undefined
  const displayStorageLimit = formatBytes(limitBytes);

  // Categories breakdown from actual files
  let docSize = 0, imgSize = 0, videoSize = 0, otherSize = 0;
  let hasLiveFileCategory = false;

  files.filter(f => !f.isFolder && !f.isTrashed).forEach(f => {
    hasLiveFileCategory = true;
    const mime = f.mimeType.toLowerCase();
    if (mime.includes('video/') || mime.includes('mp4') || mime.includes('mkv') || mime.includes('avi')) {
      videoSize += f.size;
    } else if (mime.startsWith('image/')) {
      imgSize += f.size;
    } else if (mime.includes('pdf') || mime.includes('word') || mime.includes('document') || mime.includes('sheet') || mime.includes('text') || mime.includes('officedocument')) {
      docSize += f.size;
    } else {
      otherSize += f.size;
    }
  });

  const categories = [
    { title: "Documents", sizeStr: formatBytes(docSize), rawSize: docSize, color: "bg-blue-500" },
    { title: "Images", sizeStr: formatBytes(imgSize), rawSize: imgSize, color: "bg-emerald-500" },
    { title: "Videos", sizeStr: formatBytes(videoSize), rawSize: videoSize, color: "bg-cyan-500" },
    { title: "Others", sizeStr: formatBytes(otherSize), rawSize: otherSize, color: "bg-slate-300" }
  ];

  // Radial progress percentages
  const percentUsed = limitBytes > 0 ? (user.storageUsed / limitBytes) * 100 : 0;
  const displayProgressPercent = percentUsed.toFixed(1);

  // Recent files list mapping from actual files only (no static mock files)
  const renderedRecentList = files
    .filter(f => !f.isFolder && !f.isTrashed)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(f => {
      const mime = f.mimeType.toLowerCase();
      let type = 'doc';
      let color = "bg-blue-50 text-blue-500 border-blue-100";
      if (mime.includes('pdf')) {
        type = 'pdf';
        color = "bg-red-50 text-red-500 border-red-100";
      } else if (mime.includes('image/')) {
        type = 'img';
        color = "bg-emerald-50 text-emerald-500 border-emerald-100";
      } else if (mime.includes('excel') || mime.includes('sheet') || mime.includes('xls') || mime.includes('csv')) {
        type = 'xls';
        color = "bg-green-50 text-green-500 border-green-100";
      } else if (mime.includes('presentation') || mime.includes('ppt') || mime.includes('powerpoint')) {
        type = 'ppt';
        color = "bg-orange-50 text-orange-500 border-orange-100";
      } else if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar')) {
        type = 'zip';
        color = "bg-amber-50 text-amber-500 border-amber-100";
      }
      return {
        id: f.id,
        name: f.name,
        sizeStr: formatBytes(f.size),
        timeStr: `Modified ${new Date(f.createdAt).toLocaleDateString()}`,
        type,
        color,
        avatars: [avatarRefs.emma],
        fileRef: f
      };
    });

  return (
    <div className="font-sans text-[#1E293B] pb-10 space-y-6 md:space-y-8 select-none" id="dashboard-reference-pixel-perfect">
      
      {/* ================= WELCOME BACK GREETINGS ================= */}
      <div className="space-y-1.5 text-left pt-2">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5 md:text-3xl">
          Welcome back, {user.name.split(' ')[0] || 'Member'}! <span className="animate-bounce">👋</span>
        </h1>
        <p className="text-[13px] text-slate-500 font-medium">
          Dashboard analytics and your workspace files are completely synced.
        </p>
      </div>

      {/* ================= STATISTICAL OVERVIEWS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Files Card */}
        <div 
          onClick={() => onNavigateView('files')}
          className="bg-white p-5.5 rounded-3xl border border-slate-100 hover:border-slate-200/90 shadow-sm transition-all duration-200 text-left flex flex-col justify-between h-36 cursor-pointer group hover:shadow-md active:scale-[0.99]"
        >
          <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105">
            <Folder className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-1 mt-4">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">Total Files</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-slate-900 tracking-tight">{displayTotalFiles}</span>
              <span className="text-[11px] font-bold text-slate-400/95 font-medium">Workspace scope</span>
            </div>
          </div>
        </div>

        {/* Storage Used Card */}
        <div 
          onClick={() => onNavigateView('storage')}
          className="bg-white p-5.5 rounded-3xl border border-slate-100 hover:border-slate-200/90 shadow-sm transition-all duration-200 text-left flex flex-col justify-between h-36 cursor-pointer group hover:shadow-md active:scale-[0.99]"
        >
          <div className="w-11 h-11 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105">
            <Cloud className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="space-y-1 mt-4">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">Storage Used</span>
            <div className="flex items-baseline justify-between font-bold">
              <span className="text-xl font-black text-slate-900 tracking-tight">{displayStorageUsed}</span>
              <span className="text-[11px] font-bold text-slate-400">of {displayStorageLimit}</span>
            </div>
          </div>
        </div>

        {/* Shared Files Card */}
        <div 
          onClick={() => onNavigateView('shared')}
          className="bg-white p-5.5 rounded-3xl border border-slate-100 hover:border-slate-200/90 shadow-sm transition-all duration-200 text-left flex flex-col justify-between h-36 cursor-pointer group hover:shadow-md active:scale-[0.99]"
        >
          <div className="w-11 h-11 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105">
            <Share2 className="w-5 h-5 text-purple-500" />
          </div>
          <div className="space-y-1 mt-4">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">Shared Files</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-slate-900 tracking-tight">{displaySharedFiles}</span>
              <span className="text-[11px] font-bold text-slate-400/95 font-medium">Shared links</span>
            </div>
          </div>
        </div>

        {/* Downloads Card */}
        <div 
          onClick={() => onNavigateView('recent')}
          className="bg-white p-5.5 rounded-3xl border border-slate-100 hover:border-slate-200/90 shadow-sm transition-all duration-200 text-left flex flex-col justify-between h-36 cursor-pointer group hover:shadow-md active:scale-[0.99]"
        >
          <div className="w-11 h-11 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105">
            <BarChart3 className="w-5 h-5 text-amber-500" />
          </div>
          <div className="space-y-1 mt-4">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">Downloads</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-slate-900 tracking-tight">{displayDownloads}</span>
              <span className="text-[11px] font-bold text-slate-400/95 font-medium">Session operations</span>
            </div>
          </div>
        </div>

      </div>

      {/* ================= CONTENT PANEL ROW ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT MAIN COMPONENT COLUMN (lg:col-span-8) ================= */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* RECENT FILES BLOCK */}
          <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h3 className="font-bold text-[15px] text-slate-900 tracking-tight">Recent Files</h3>
              <button 
                onClick={() => onNavigateView('files')}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                View all files
              </button>
            </div>

            {renderedRecentList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-50/40 rounded-2xl border border-dashed border-slate-205 border-slate-200">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-650 text-slate-700">No files uploaded yet.</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm font-medium">
                  Your files will populate automatically as soon as you upload attachments or create folders.
                </p>
              </div>
            ) : (
              <div className="space-y-1 divide-y divide-slate-105 divide-slate-100">
                {renderedRecentList.map((file) => (
                  <div 
                    key={file.id}
                    className="py-3 flex items-center justify-between group/file hover:bg-slate-50/60 -mx-2 px-2 rounded-2xl transition-all"
                  >
                    <div className="flex items-center gap-3.5 max-w-[80%] truncate">
                      {/* Document Type Icon Column */}
                      <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 font-display font-black text-[10px] uppercase tracking-wider ${file.color}`}>
                        {file.type}
                      </div>

                      <div className="truncate text-left leading-tight space-y-1">
                        <p className="font-bold text-[13px] text-slate-800 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {file.sizeStr} • {file.timeStr}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      
                      {/* Direct action to download download */}
                      <button 
                        onClick={() => {
                          if (file.fileRef?.url) {
                            window.open(file.fileRef.url, '_blank');
                          }
                        }}
                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer active:scale-95"
                        title="Download / Open"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ================= RIGHT SIDEBAR COMPONENT COLUMN (lg:col-span-4) ================= */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* A) STORAGE OVERVIEW CHOSEN CHART */}
          <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm text-left space-y-4">
            <h3 className="font-bold text-[15px] text-slate-900 tracking-tight">
              Storage Overview
            </h3>

            {user.storageUsed === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                  <Cloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">Storage is Empty</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Upload files to see storage analysis</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Circular Donut Ring */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <div className="w-28 h-28 rounded-full flex items-center justify-center relative">
                      <svg className="absolute w-28 h-28 -rotate-90">
                        <circle 
                          cx="56" 
                          cy="56" 
                          r="42" 
                          fill="transparent" 
                          stroke="#F1F5F9" 
                          strokeWidth="7"
                        />
                        <circle 
                          cx="56" 
                          cy="56" 
                          r="42" 
                          fill="transparent" 
                          stroke="#005AE2" 
                          strokeWidth="7" 
                          strokeDasharray="263.8" 
                          strokeDashoffset={263.8 - (263.8 * percentUsed) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="text-center space-y-0.5 leading-none z-10">
                        <span className="text-[13px] font-black text-slate-900 tracking-tight block">
                          {displayProgressPercent}%
                        </span>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mt-0.5">Used</span>
                      </div>
                    </div>
                  </div>

                  {/* Categories List */}
                  <div className="flex-1 space-y-2 select-none">
                    {categories.map((cat, index) => (
                      <div key={index} className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                          <span className="text-slate-500 font-medium">{cat.title}</span>
                        </div>
                        <span className="text-slate-800 font-bold">{cat.sizeStr}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] font-bold text-slate-400/90 text-right">
                  {displayStorageUsed} used of {displayStorageLimit}
                </div>
              </div>
            )}
          </div>

          {/* B) ACTIVITY FEED CARD */}
          <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm text-left space-y-4 flex flex-col justify-between">
            <h3 className="font-bold text-[15px] text-slate-900 tracking-tight">
              Activity Feed
            </h3>

            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-50/40 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs font-bold text-slate-650 text-slate-800">No recent activity.</p>
                <p className="text-[11px] text-slate-400 mt-1">Real-time actions will list automatically.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {activities.slice(0, 5).map((act) => {
                  let iconColor = "bg-blue-50 text-blue-500 border-blue-100";
                  let iconEl = <Upload className="w-3.5 h-3.5" />;

                  if (act.type === 'delete') {
                    iconColor = "bg-red-50 text-red-500 border-red-100";
                    iconEl = <X className="w-3.5 h-3.5" />;
                  } else if (act.type === 'create_folder') {
                    iconColor = "bg-amber-50 text-amber-500 border-amber-100";
                    iconEl = <Folder className="w-3.5 h-3.5" />;
                  } else if (act.type === 'share') {
                    iconColor = "bg-purple-50 text-purple-500 border-purple-100";
                    iconEl = <Share2 className="w-3.5 h-3.5" />;
                  } else if (act.type === 'rename') {
                    iconColor = "bg-indigo-50 text-indigo-500 border-indigo-100";
                    iconEl = <FileText className="w-3.5 h-3.5" />;
                  }

                  return (
                    <div key={act.id} className="flex gap-3 items-start text-xs">
                      <div className={`w-8 h-8 border rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconColor}`}>
                        {iconEl}
                      </div>
                      <div className="leading-snug space-y-0.5">
                        <p className="font-bold text-slate-800">{act.details}</p>
                        <p className="text-[10.5px] text-slate-400 font-medium">
                          {new Date(act.createdAt).toLocaleString(undefined, { 
                            hour: 'numeric', 
                            minute: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {activities.length > 0 && (
              <div className="pt-2.5 border-t border-slate-50 text-center">
                <button 
                  onClick={() => onNavigateView('recent')}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  View all activity
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
