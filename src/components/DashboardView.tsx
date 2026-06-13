import React from 'react';
import { motion } from 'motion/react';
import { 
  Folder, Cloud, Users, Share2, BarChart3, FileText, MoreVertical, X, Upload, ChevronRight, Settings, Trash2, Download, Music, Video, Code, ShieldCheck, Mail
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

  // Real fallback avatars for collaborator styling
  const avatars = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'
  ];

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Real core data calculations
  const totalFilesOnCloud = files.filter(f => !f.isFolder && !f.isTrashed).length;
  const sharedFilesOnCloud = files.filter(f => (f.sharedWith?.length > 0 || f.shareLink?.isPublic) && !f.isTrashed).length;
  const downloadsOnCloud = activities.filter(a => a.details.toLowerCase().includes('download') || a.details.toLowerCase().includes('downloaded')).length;

  const displayTotalFiles = totalFilesOnCloud.toLocaleString();
  const displayStorageUsed = formatBytes(user.storageUsed);
  const displaySharedFiles = sharedFilesOnCloud.toLocaleString();
  const displayDownloads = downloadsOnCloud.toLocaleString();

  // Storage limits
  const limitBytes = user.storageLimit || 200 * 1024 * 1024 * 1024; // fallback to 200GB
  const displayStorageLimit = formatBytes(limitBytes);

  // Dynamic breakdown calculations
  let docSize = 0, imgSize = 0, videoSize = 0, otherSize = 0;
  files.filter(f => !f.isFolder && !f.isTrashed).forEach(f => {
    const mime = f.mimeType.toLowerCase();
    if (mime.includes('video/') || mime.includes('mp4') || mime.includes('mkv') || mime.includes('avi')) {
      videoSize += f.size;
    } else if (mime.startsWith('image/')) {
      imgSize += f.size;
    } else if (mime.includes('pdf') || mime.includes('word') || mime.includes('document') || mime.includes('sheet') || mime.includes('text') || mime.includes('presentation') || mime.includes('officedocument')) {
      docSize += f.size;
    } else {
      otherSize += f.size;
    }
  });

  const categories = [
    { title: "Documents", sizeStr: formatBytes(docSize), color: "bg-blue-650 bg-blue-600" },
    { title: "Images", sizeStr: formatBytes(imgSize), color: "bg-emerald-500" },
    { title: "Videos", sizeStr: formatBytes(videoSize), color: "bg-cyan-500" },
    { title: "Others", sizeStr: formatBytes(otherSize), color: "bg-slate-400" }
  ];

  const percentUsed = limitBytes > 0 ? (user.storageUsed / limitBytes) * 100 : 0;
  const displayProgressPercent = percentUsed.toFixed(1);

  // Intelligent file-type icon & real image thumbnail generator
  const renderItemVisual = (file: CloudFile) => {
    const mime = file.mimeType.toLowerCase();
    const name = file.name.toLowerCase();

    // 1. If it's an image, render a beautiful real thumbnail
    if ((mime.startsWith('image/') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp') || name.endsWith('.gif')) && file.url) {
      return (
        <div className="relative w-10 h-10 rounded-xl border border-slate-200/60 bg-slate-50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] shrink-0 select-none overflow-hidden" id={`thumbnail-img-container-${file.id}`}>
          <img 
            src={file.url} 
            alt={file.name} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover animate-fade-in"
            id={`thumbnail-img-ref-${file.id}`}
          />
          <span className="absolute bottom-[2px] right-[2px] px-1 py-0.5 rounded-md text-[7px] font-extrabold bg-emerald-600 text-white tracking-wider flex items-center justify-center shadow-3xs leading-none scale-90 select-none">
            IMG
          </span>
        </div>
      );
    }

    // 2. If it's a video, render a native video preview thumbnail with an overlay play/video icon if URL is available
    if ((mime.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.mkv') || name.endsWith('.mov')) && file.url) {
      return (
        <div className="relative w-10 h-10 rounded-xl border border-slate-200/60 bg-slate-50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] shrink-0 select-none overflow-hidden" id={`thumbnail-video-container-${file.id}`}>
          <video 
            src={file.url} 
            className="w-full h-full object-cover" 
            muted 
            playsInline
            preload="metadata"
            id={`thumbnail-video-ref-${file.id}`}
          />
          <div className="absolute inset-x-0 inset-y-0 bg-black/25 flex items-center justify-center">
            <Video className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[2.2]" id={`thumbnail-video-icon-${file.id}`} />
          </div>
          <span className="absolute bottom-[2px] right-[2px] px-1 py-0.5 rounded-md text-[7px] font-extrabold bg-cyan-600 text-white tracking-wider flex items-center justify-center shadow-3xs leading-none scale-90 select-none">
            VID
          </span>
        </div>
      );
    }

    // Default icon styles
    let iconEl = <FileText className="w-5 h-5 stroke-[1.8]" id={`thumbnail-doc-icon-${file.id}`} />;
    let iconStyles = "bg-blue-50/70 text-blue-600 border-blue-100/50";
    let badgeText = "DOC";
    let badgeBg = "bg-blue-600";

    if (name.endsWith('.pdf') || mime.includes('pdf')) {
      iconEl = <FileText className="w-5 h-5 stroke-[1.8]" id={`thumbnail-pdf-icon-${file.id}`} />;
      iconStyles = "bg-red-50/70 text-red-600 border-red-100/50";
      badgeText = "PDF";
      badgeBg = "bg-red-600";
    } else if (name.endsWith('.doc') || name.endsWith('.docx') || mime.includes('word') || mime.includes('document')) {
      iconEl = <FileText className="w-5 h-5 stroke-[1.8]" id={`thumbnail-word-icon-${file.id}`} />;
      iconStyles = "bg-blue-50/70 text-blue-600 border-blue-100/50";
      badgeText = "DOC";
      badgeBg = "bg-blue-600";
    } else if (name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv') || mime.includes('excel') || mime.includes('sheet') || mime.includes('csv')) {
      iconEl = <BarChart3 className="w-5 h-5 stroke-[1.8]" id={`thumbnail-excel-icon-${file.id}`} />;
      iconStyles = "bg-emerald-50/70 text-emerald-600 border-emerald-100/50";
      badgeText = "XLS";
      badgeBg = "bg-emerald-600";
    } else if (name.endsWith('.ppt') || name.endsWith('.pptx') || mime.includes('presentation') || mime.includes('powerpoint')) {
      iconEl = <FileText className="w-5 h-5 stroke-[1.8]" id={`thumbnail-ppt-icon-${file.id}`} />;
      iconStyles = "bg-orange-50/70 text-orange-600 border-orange-100/50";
      badgeText = "PPT";
      badgeBg = "bg-orange-600";
    } else if (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.tar') || name.endsWith('.7z') || mime.includes('zip') || mime.includes('compressed')) {
      iconEl = <Folder className="w-5 h-5 stroke-[1.8]" id={`thumbnail-zip-icon-${file.id}`} />;
      iconStyles = "bg-amber-50/70 text-amber-600 border-amber-100/50";
      badgeText = "ZIP";
      badgeBg = "bg-amber-600";
    } else if (mime.startsWith('audio/') || name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.m4a')) {
      iconEl = <Music className="w-5 h-5 stroke-[1.8]" id={`thumbnail-music-icon-${file.id}`} />;
      iconStyles = "bg-indigo-50/70 text-indigo-600 border-indigo-100/50";
      badgeText = "AUD";
      badgeBg = "bg-indigo-600";
    } else if (mime.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.mkv') || name.endsWith('.mov')) {
      iconEl = <Video className="w-5 h-5 stroke-[1.8]" id={`thumbnail-vid-fallback-${file.id}`} />;
      iconStyles = "bg-cyan-50/70 text-cyan-600 border-cyan-100/50";
      badgeText = "VID";
      badgeBg = "bg-cyan-600";
    } else if (name.endsWith('.json') || mime.includes('json')) {
      iconEl = <Code className="w-5 h-5 stroke-[1.8]" id={`thumbnail-json-icon-${file.id}`} />;
      iconStyles = "bg-purple-50/70 text-purple-600 border-purple-100/50";
      badgeText = "JSON";
      badgeBg = "bg-purple-600";
    } else if (name.endsWith('.txt') || mime.includes('text/plain')) {
      iconEl = <FileText className="w-5 h-5 stroke-[1.8]" id={`thumbnail-txt-icon-${file.id}`} />;
      iconStyles = "bg-slate-50/70 text-slate-600 border-slate-150";
      badgeText = "TXT";
      badgeBg = "bg-slate-600";
    } else if (name.endsWith('.html') || name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.css') || name.endsWith('.py') || name.endsWith('.cpp') || name.endsWith('.java')) {
      iconEl = <Code className="w-5 h-5 stroke-[1.8]" id={`thumbnail-code-icon-${file.id}`} />;
      iconStyles = "bg-violet-50/70 text-violet-600 border-violet-100/50";
      badgeText = "CODE";
      badgeBg = "bg-violet-600";
    }

    return (
      <div className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center shrink-0 shadow-3xs relative select-none ${iconStyles}`} id={`file-icon-badge-${file.id}`}>
        {iconEl}
        <span className={`absolute bottom-[2px] right-[2px] px-1 py-0.5 rounded-md text-[7px] font-extrabold ${badgeBg} text-white tracking-wider flex items-center justify-center shadow-3xs leading-none scale-90 select-none`} id={`file-icon-badge-text-${file.id}`}>
          {badgeText}
        </span>
      </div>
    );
  };

  // Recent files query
  const renderedRecentList = files
    .filter(f => !f.isFolder && !f.isTrashed)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="font-sans text-slate-800 pb-12 select-none text-left space-y-6" id="dashboard-saas-premium-view">
      
      {/* ================= WELCOME HEADER SECTION WITH SPECIFIC GRADIENT STYLING & REDUCED EXTRA SPACING ================= */}
      <div className="space-y-1 text-left pt-1">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight md:text-[28px] leading-tight flex items-center gap-2">
          <span>Welcome,</span>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500">
            Anjan
          </span>
        </h1>
        <p className="text-[13px] text-slate-400 font-semibold tracking-wide">
          Here's what's happening with your files today.
        </p>
      </div>

      {/* ================= RESTRUCTURED BODY GRID WITH PRECISION COLUMN WIDTHS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT MULTI-CARD COLUMN: STATISTICS GRID + RECENT FILES + QUICK ACTIONS */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* ================= STATISTICS GRID COMPLYING EXACTLY TO REFERENCE PROPORTIONS ================= */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            
            {/* Total Files Card */}
            <div 
              onClick={() => onNavigateView('files')}
              className="bg-white p-4.5 rounded-[20px] border border-slate-100 hover:border-slate-200/90 shadow-[0_4px_18px_rgba(0,0,0,0.012)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.03)] transition-all duration-300 text-left flex flex-col justify-between min-h-[136px] cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-10.5 h-10.5 bg-blue-50/50 border border-blue-100/40 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-4xs text-blue-600 shrink-0">
                <Folder className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="space-y-1 mt-3">
                <span className="text-xs font-semibold text-slate-500 block leading-none">Total Files</span>
                <span className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-none block">{displayTotalFiles}</span>
                <span className="text-[11px] font-medium text-emerald-500 block leading-none pt-0.5">+12 this week</span>
              </div>
            </div>

            {/* Storage Used Card */}
            <div 
              onClick={() => onNavigateView('storage')}
              className="bg-white p-4.5 rounded-[20px] border border-slate-100 hover:border-slate-200/90 shadow-[0_4px_18px_rgba(0,0,0,0.012)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.03)] transition-all duration-300 text-left flex flex-col justify-between min-h-[136px] cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-10.5 h-10.5 bg-emerald-50/50 border border-emerald-100/40 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-4xs text-emerald-600 shrink-0">
                <Cloud className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="space-y-1 mt-3">
                <span className="text-xs font-semibold text-slate-500 block leading-none">Storage Used</span>
                <span className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-none block">{displayStorageUsed}</span>
                <span className="text-[11px] font-semibold text-slate-400 block leading-none pt-0.5">of {displayStorageLimit}</span>
              </div>
            </div>

            {/* Shared Files Card */}
            <div 
              onClick={() => onNavigateView('shared')}
              className="bg-white p-4.5 rounded-[20px] border border-slate-100 hover:border-slate-200/90 shadow-[0_4px_18px_rgba(0,0,0,0.012)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.03)] transition-all duration-300 text-left flex flex-col justify-between min-h-[136px] cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-10.5 h-10.5 bg-violet-50/50 border border-violet-100/40 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-4xs text-violet-600 shrink-0">
                <Users className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="space-y-1 mt-3">
                <span className="text-xs font-semibold text-slate-500 block leading-none">Shared Files</span>
                <span className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-none block">{displaySharedFiles}</span>
                <span className="text-[11px] font-medium text-emerald-500 block leading-none pt-0.5">+8 this week</span>
              </div>
            </div>

            {/* Downloads Card */}
            <div 
              onClick={() => onNavigateView('recent')}
              className="bg-white p-4.5 rounded-[20px] border border-slate-100 hover:border-slate-200/90 shadow-[0_4px_18px_rgba(0,0,0,0.012)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.03)] transition-all duration-300 text-left flex flex-col justify-between min-h-[136px] cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-10.5 h-10.5 bg-amber-50/50 border border-amber-100/40 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-4xs text-amber-600 shrink-0">
                <BarChart3 className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="space-y-1 mt-3">
                <span className="text-xs font-semibold text-slate-500 block leading-none">Downloads</span>
                <span className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-none block">{displayDownloads}</span>
                <span className="text-[11px] font-medium text-emerald-500 block leading-none pt-0.5">+23 this week</span>
              </div>
            </div>

          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* COMPONENT 1: RECENT FILES */}
            <div className="md:col-span-8 bg-white p-6 rounded-[28px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.012)] text-left flex flex-col justify-between self-stretch min-h-[460px]">
              <div>
                <div className="flex items-center justify-between border-b border-slate-50 pb-3.5 mb-2">
                  <h3 className="font-bold text-[14.5px] text-slate-900 tracking-tight">Recent Files</h3>
                  <button 
                    onClick={() => onNavigateView('files')}
                    className="text-xs font-extrabold text-blue-600 hover:text-blue-700 cursor-pointer hover:underline transition-colors select-none"
                  >
                    View all
                  </button>
                </div>

                {renderedRecentList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4 shadow-3xs">
                      <FileText className="w-5.5 h-5.5" />
                    </div>
                    <p className="text-xs font-bold text-slate-705">Your file manager is active</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] font-semibold leading-relaxed">
                      Upload items on My Files view to populate your recent feed logs.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {renderedRecentList.map((file) => (
                      <div 
                        key={file.id}
                        onClick={() => {
                          if (file.url) {
                            window.open(file.url, '_blank');
                          }
                        }}
                        className="py-3 px-2 rounded-2xl flex items-center justify-between group/file hover:bg-slate-50 transition-all duration-200 -mx-2 cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 w-4/5 truncate">
                          {/* Intelligent type-specific rendering or dynamic thumbnail image */}
                          {renderItemVisual(file)}

                          <div className="truncate text-left space-y-0.5">
                            <p className="font-bold text-[13px] text-slate-800 truncate group-hover/file:text-blue-600 transition-colors" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[10.5px] text-slate-400 font-semibold font-sans">
                              {formatBytes(file.size)} • Modified {new Date(file.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Right overlap elements: Avatars & Menu button */}
                        <div className="flex items-center space-x-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="hidden sm:flex items-center -space-x-1.5 overflow-hidden">
                            <img 
                              src={avatars[file.id.charCodeAt(0) % avatars.length]} 
                              className="w-5.5 h-5.5 rounded-full border border-white shadow-3xs object-cover" 
                              alt="collab" 
                            />
                            <img 
                              src={avatars[(file.id.charCodeAt(0) + 1) % avatars.length]} 
                              className="w-5.5 h-5.5 rounded-full border border-white shadow-3xs object-cover" 
                              alt="collab" 
                            />
                          </div>

                          <button 
                            onClick={() => {
                              if (file.url) {
                                window.open(file.url, '_blank');
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {renderedRecentList.length > 0 && (
                <div className="pt-3 border-t border-slate-50 text-center">
                  <button 
                    onClick={() => onNavigateView('files')}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer inline-flex items-center gap-1 mx-auto py-0.5"
                  >
                    <span>Inspect active folder</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* COMPONENT 2: QUICK ACTIONS */}
            <div className="md:col-span-4 bg-white p-6 rounded-[28px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.012)] text-left flex flex-col justify-between self-stretch min-h-[460px]">
              <div className="space-y-4">
                <div className="border-b border-slate-50 pb-3.5">
                  <h3 className="font-bold text-[14.5px] text-slate-900 tracking-tight">Quick Actions</h3>
                </div>

                <div className="space-y-1.5">
                  
                  {/* Upload Actions */}
                  <button 
                    onClick={onUploadClick}
                    className="w-full p-3 rounded-2xl hover:bg-slate-50 transition-all text-left flex items-center gap-3.5 group/qa border border-transparent hover:border-slate-50 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl border border-blue-105/10 bg-blue-50/30 text-blue-600 flex items-center justify-center shrink-0 shadow-4xs group-hover/qa:bg-blue-650 group-hover/qa:bg-blue-600 group-hover/qa:text-white transition-colors">
                      <Upload className="w-4.5 h-4.5 stroke-[1.8]" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-[13px] text-slate-850">Upload Files</p>
                      <p className="text-[10.5px] text-slate-400 font-semibold font-sans mt-0.5">Drag and drop files</p>
                    </div>
                  </button>

                  {/* New Folder */}
                  <button 
                    onClick={onCreateFolderClick}
                    className="w-full p-3 rounded-2xl hover:bg-slate-50 transition-all text-left flex items-center gap-3.5 group/qa border border-transparent hover:border-slate-50 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl border border-blue-105/10 bg-blue-50/30 text-blue-600 flex items-center justify-center shrink-0 shadow-4xs group-hover/qa:bg-blue-650 group-hover/qa:bg-blue-600 group-hover/qa:text-white transition-colors">
                      <Folder className="w-4.5 h-4.5 stroke-[1.8]" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-[13px] text-slate-850">New Folder</p>
                      <p className="text-[10.5px] text-slate-400 font-semibold font-sans mt-0.5">Create a new folder</p>
                    </div>
                  </button>

                  {/* Share Files */}
                  <button 
                    onClick={() => onNavigateView('shared')}
                    className="w-full p-3 rounded-2xl hover:bg-slate-50 transition-all text-left flex items-center gap-3.5 group/qa border border-transparent hover:border-slate-50 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl border border-blue-105/10 bg-blue-50/30 text-blue-600 flex items-center justify-center shrink-0 shadow-4xs group-hover/qa:bg-blue-650 group-hover/qa:bg-blue-600 group-hover/qa:text-white transition-colors">
                      <Share2 className="w-4.5 h-4.5 stroke-[1.8]" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-[13px] text-slate-850">Share Files</p>
                      <p className="text-[10.5px] text-slate-400 font-semibold font-sans mt-0.5">Share files with others</p>
                    </div>
                  </button>

                  {/* Storage settings */}
                  <button 
                    onClick={() => onNavigateView('storage')}
                    className="w-full p-3 rounded-2xl hover:bg-slate-50 transition-all text-left flex items-center gap-3.5 group/qa border border-transparent hover:border-slate-50 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl border border-blue-105/10 bg-blue-50/30 text-blue-600 flex items-center justify-center shrink-0 shadow-4xs group-hover/qa:bg-blue-650 group-hover/qa:bg-blue-600 group-hover/qa:text-white transition-colors">
                      <Settings className="w-4.5 h-4.5 stroke-[1.8]" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-[13px] text-slate-850">Storage Settings</p>
                      <p className="text-[10.5px] text-slate-400 font-semibold font-sans mt-0.5">Manage your storage</p>
                    </div>
                  </button>

                </div>
              </div>

              {/* Informational tip at bottom */}
              <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 text-[10.5px] text-slate-500 font-semibold leading-relaxed flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 select-none animate-pulse"></span>
                <span>Right click items inside My Files to unlock direct Fast Links.</span>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN SIDEBAR: RESTRUCTURED STACK [Storage Overview] -> [Need More Storage] -> [Activity Feed] */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* STRUCTURE PART 1: STORAGE OVERVIEW CARD */}
          <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.012)] text-left space-y-5">
            <h3 className="font-bold text-[14.5px] text-slate-900 tracking-tight">
              Storage Overview
            </h3>

            {user.storageUsed === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-55/30 rounded-2xl border border-dashed border-slate-200">
                <div className="w-11 h-11 rounded-2xl bg-slate-55 flex items-center justify-center text-slate-400 border border-slate-105/30 shadow-3xs mb-3">
                  <Cloud className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs font-bold text-slate-705">Your storage is empty</p>
                <p className="text-[10.5px] text-slate-400 font-medium leading-relaxed mt-1 max-w-[180px]">
                  Files breakdown reports populate automatically once you upload.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-row items-center justify-between gap-5 sm:gap-6">
                  {/* Circular Donut Ring */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <div className="w-26 h-26 rounded-full flex items-center justify-center relative">
                      <svg className="absolute w-26 h-26 -rotate-90">
                        <circle 
                          cx="52" 
                          cy="52" 
                          r="38" 
                          fill="transparent" 
                          stroke="#F8FAFC" 
                          strokeWidth="8.5"
                          className="shadow-3xs"
                        />
                        <circle 
                          cx="52" 
                          cy="52" 
                          r="38" 
                          fill="transparent" 
                          stroke="url(#saasBlueIndigo)" 
                          strokeWidth="8.5" 
                          strokeDasharray="238.76" 
                          strokeDashoffset={238.76 - (238.76 * percentUsed) / 100}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                          <linearGradient id="saasBlueIndigo" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2563EB" />
                            <stop offset="100%" stopColor="#6366F1" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="text-center space-y-0.5 text-slate-800 leading-tight z-10">
                        <span className="text-[13.5px] font-black text-slate-850 tracking-tight block">
                          {displayProgressPercent}%
                        </span>
                        <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-widest block">Used</span>
                      </div>
                    </div>
                  </div>

                  {/* Legend list on Right */}
                  <div className="flex-1 space-y-2.5">
                    {categories.map((cat, index) => (
                      <div key={index} className="flex items-center justify-between text-[11px] font-bold">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ring-2 ring-slate-50 ${cat.color}`} />
                          <span className="text-slate-500 font-medium">{cat.title}</span>
                        </div>
                        <span className="text-slate-800 font-black tracking-tight">{cat.sizeStr}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10.5px] bg-slate-50 rounded-xl px-3.5 py-2.5 border border-slate-100 text-slate-500 font-semibold font-sans mt-1">
                  <span>Usage telemetry</span>
                  <span className="text-slate-700 font-extrabold">{displayStorageUsed} used of {displayStorageLimit}</span>
                </div>
              </div>
            )}
          </div>

          {/* STRUCTURE PART 2: DYNAMIC UPGRADE STORAGE PLAN CARD */}
          <div className="bg-gradient-to-br from-[#E0F2FE] via-[#F0FDFA] to-[#EFF6FF] border border-blue-100/40 p-6 rounded-[28px] text-left relative overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.012)]">
            <div className="relative z-10 flex flex-col justify-between h-[138px]">
              <div className="space-y-1.5 max-w-[65%]">
                <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">Need more storage?</h4>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  Upgrade your storage plan and unlock more secure cloud storage.
                </p>
              </div>

              <button 
                onClick={() => onNavigateView('storage')}
                className="self-start text-xs font-black text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 hover:shadow-lg transition-all px-5.5 py-2.5 rounded-2xl cursor-pointer active:scale-95 select-none"
              >
                Upgrade Now
              </button>
            </div>

            {/* Cloud and rocket dynamic illustrations */}
            <div className="absolute right-[-10px] bottom-[-15px] w-36 h-36 opacity-90 transition-transform group-hover:scale-105 duration-500 select-none pointer-events-none">
              <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                <path d="M72 50c0-6.6-5.4-12-12-12-1.3 0-2.6.2-3.8.6C53.7 32.5 46.5 28 38 28c-11 0-20 9-20 20 0 .7.1 1.4.2 2.1C11.6 51.5 6 57.1 6 64c0 7.7 6.3 14 14 14h52c6.6 0 12-5.4 12-12 0-3.3-1.3-6.2-3.5-8.4 2.1-1.8 3.5-4.5 3.5-7.6z" fill="#0EA5E9" fillOpacity="0.12" />
                <path d="M60 48c0-5-4-9-9-9-1 0-2 .2-2.9.5C46.3 35.4 40.8 32 34 32c-8.3 0-15 6.7-15 15 0 .5.1 1 .2 1.5C14.2 49.1 10 53.3 10 58.5c0 5.8 4.7 10.5 10.5 10.5H59c5 0 9-4 9-9 0-2.5-1-4.7-2.6-6.3 1.6-1.4 2.6-3.4 2.6-5.7z" fill="#38BDF8" fillOpacity="0.18" />
                {/* Dynamically pulse the center upload marker */}
                <path d="M34 55h4m-2-2l2-2 2 2m-2-2v6" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* STRUCTURE PART 3: ACTIVITY FEED */}
          <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.012)] text-left space-y-4.5 flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="border-b border-slate-50 pb-3.5 mb-2.5">
                <h3 className="font-bold text-[14.5px] text-slate-900 tracking-tight">Activity Feed</h3>
              </div>

              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <p className="text-xs font-bold text-slate-705">No recent activity</p>
                  <p className="text-[10.5px] text-slate-400 mt-1 max-w-[170px] leading-relaxed font-semibold">
                    Real time workspace activities will automatically display here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin">
                  {activities.slice(0, 5).map((act, index) => {
                    let iconStyles = "bg-blue-50 text-blue-600 border-blue-100/50";
                    let iconEl = <Upload className="w-3.5 h-3.5" />;

                    if (act.type === 'delete') {
                      iconStyles = "bg-rose-50 text-rose-600 border-rose-100/50";
                      iconEl = <Trash2 className="w-3.5 h-3.5" />;
                    } else if (act.type === 'create_folder') {
                      iconStyles = "bg-amber-50 text-amber-600 border-amber-100/50";
                      iconEl = <Folder className="w-3.5 h-3.5" />;
                    } else if (act.type === 'share' || act.details.toLowerCase().includes('share')) {
                      iconStyles = "bg-purple-50 text-purple-600 border-purple-100/50";
                      iconEl = <Share2 className="w-3.5 h-3.5" />;
                    } else if (act.type === 'rename') {
                      iconStyles = "bg-indigo-50 text-indigo-600 border-indigo-100/50";
                      iconEl = <FileText className="w-3.5 h-3.5" />;
                    } else if (act.type === 'security') {
                      iconStyles = "bg-slate-100 text-slate-600 border-slate-200";
                      iconEl = <ShieldCheck className="w-3.5 h-3.5" />;
                    } else if (act.type === 'subscription') {
                      iconStyles = "bg-emerald-50 text-emerald-600 border-emerald-100/50";
                      iconEl = <Download className="w-3.5 h-3.5" />;
                    }

                    return (
                      <div key={act.id || index} className="flex gap-3 items-start text-xs group/act relative">
                        {/* Timeline Connector Line */}
                        {index < activities.slice(0, 5).length - 1 && (
                          <div className="absolute left-[17px] top-8.5 bottom-[-16px] w-[1px] bg-slate-100" />
                        )}

                        <div className={`w-8.5 h-8.5 border rounded-xl flex items-center justify-center shrink-0 shadow-4xs group-hover/act:scale-105 transition-all duration-200 z-10 ${iconStyles}`}>
                          {iconEl}
                        </div>
                        <div className="leading-snug space-y-0.5 flex-1 min-w-0 select-text">
                          <p className="font-bold text-slate-755 text-slate-800 tracking-tight leading-relaxed truncate" title={act.details}>
                            {act.details}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold font-sans">
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
            </div>
            
            {activities.length > 0 && (
              <div className="pt-3 border-t border-slate-50 text-center">
                <button 
                  onClick={() => onNavigateView('recent')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-all duration-150 inline-flex items-center gap-1"
                >
                  <span>View all activity</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
