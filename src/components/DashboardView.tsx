import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, Cloud, Users, Share2, BarChart3, FileText, MoreVertical, X, Upload, ChevronRight, Settings, 
  Trash2, Download, Music, Video, Code, ShieldCheck, Mail, Star, Edit3, Copy, Move, Eye, Calendar, 
  ExternalLink, Lock, Clipboard, Check, Loader2, HardDrive
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
  token?: string;
  onRefresh?: () => void;
}

export default function DashboardView({ 
  user, 
  files, 
  activities, 
  onUploadClick, 
  onCreateFolderClick, 
  onNavigateView,
  onSelectFolder,
  token,
  onRefresh
}: DashboardProps) {

  // All premium interactive states for Recent Files and Actions
  const [activeMenuFileId, setActiveMenuFileId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<CloudFile | null>(null);
  const [shareFile, setShareFile] = useState<CloudFile | null>(null);
  const [renameFile, setRenameFile] = useState<CloudFile | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [moveFile, setMoveFile] = useState<CloudFile | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);

  // Sharing states
  const [newShareEmail, setNewShareEmail] = useState("");
  const [newSharePerm, setNewSharePerm] = useState("view");
  const [sharedEmailList, setSharedEmailList] = useState<{ email: string; permission: string }[]>([]);
  const [isPublicLink, setIsPublicLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // File loading states for text/code previewing
  const [textContent, setTextContent] = useState<string>("");
  const [loadingText, setLoadingText] = useState<boolean>(false);

  // Custom visual toast alert system
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToastMessage = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 3000);
  };

  // Keyboard close listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMenuFileId(null);
        setPreviewFile(null);
        setShareFile(null);
        setRenameFile(null);
        setMoveFile(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Text/code preview loader logic
  useEffect(() => {
    let active = true;
    if (previewFile && !previewFile.isFolder) {
      const mime = previewFile.mimeType.toLowerCase();
      const name = previewFile.name.toLowerCase();
      const textExtensions = ['.txt', '.js', '.ts', '.tsx', '.json', '.html', '.css', '.md', '.xml', '.py', '.cpp', '.java'];
      const isTextFile = mime.startsWith('text/') || mime.includes('json') || mime.includes('xml') || textExtensions.some(ext => name.endsWith(ext));
      
      if (isTextFile && token) {
        setLoadingText(true);
        setTextContent("");
        const fileUrl = `/api/files/download/${previewFile.id}?token=${token}`;
        fetch(fileUrl)
          .then(res => {
            if (!res.ok) throw new Error("Preview source unavailable");
            return res.text();
          })
          .then(text => {
            if (active) {
              setTextContent(text);
              setLoadingText(false);
            }
          })
          .catch(e => {
            console.error(e);
            if (active) {
              setTextContent("The preview content is secure and couldn't be loaded directly. Please download the file to inspect the full contents.");
              setLoadingText(false);
            }
          });
      }
    }
    return () => {
      active = false;
    };
  }, [previewFile, token]);

  // Operations and Handlers
  const handleDownload = (file: CloudFile) => {
    if (!token) return;
    const downloadUrl = `/api/files/download/${file.id}?token=${token}&download=true`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', file.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToastMessage("Downloading file...");
  };

  const handleToggleStar = async (file: CloudFile) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/files/toggle-star/${file.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        if (onRefresh) onRefresh();
        showToastMessage(!file.isStarred ? "⭐ Item starred" : "✩ Item unstarred");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActiveMenuFileId(null);
    }
  };

  const handleDuplicate = async (file: CloudFile) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/files/duplicate/${file.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        if (onRefresh) onRefresh();
        showToastMessage("📑 File duplicated successfully");
      } else {
        const err = await response.json();
        alert(err.error || "Duplicate failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActiveMenuFileId(null);
    }
  };

  const handleMoveToTrash = async (file: CloudFile) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/files/delete/${file.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        if (onRefresh) onRefresh();
        showToastMessage(`🗑️ "${file.name}" moved to Trash`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActiveMenuFileId(null);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameFile || !token || !renameValue.trim()) return;
    try {
      const response = await fetch(`/api/files/rename/${renameFile.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: renameValue.trim() })
      });
      if (response.ok) {
        if (onRefresh) onRefresh();
        showToastMessage("✏️ File renamed successfully");
        setRenameFile(null);
      } else {
        alert("Rename failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActiveMenuFileId(null);
    }
  };

  const handleMoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveFile || !token) return;
    try {
      const response = await fetch(`/api/files/move/${moveFile.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ parentId: targetFolderId })
      });
      if (response.ok) {
        if (onRefresh) onRefresh();
        showToastMessage("📂 File moved successfully");
        setMoveFile(null);
      } else {
        const err = await response.json();
        alert(err.error || "Move failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActiveMenuFileId(null);
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareFile || !token) return;
    try {
      const shareResp = await fetch(`/api/files/share/${shareFile.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sharedWith: sharedEmailList })
      });

      const linkPayload = {
        isPublic: isPublicLink,
        passwordEnabled: false,
        password: null,
        expiresAt: null
      };

      const linkResp = await fetch(`/api/files/share-link/${shareFile.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(linkPayload)
      });

      if (shareResp.ok && linkResp.ok) {
        if (onRefresh) onRefresh();
        showToastMessage("🔗 Share settings updated");
        setShareFile(null);
      } else {
        alert("Failed to update share settings");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActiveMenuFileId(null);
    }
  };

  const handleOpenShareModal = (file: CloudFile) => {
    setShareFile(file);
    setSharedEmailList(file.sharedWith || []);
    setIsPublicLink(file.shareLink?.isPublic || false);
    setNewShareEmail("");
    setLinkCopied(false);
    setActiveMenuFileId(null);
  };

  const handleAddShareEmail = () => {
    if (!newShareEmail.trim() || !newShareEmail.includes('@')) {
      alert("Please supply a valid email address");
      return;
    }
    const alreadyExists = sharedEmailList.some(item => item.email.toLowerCase() === newShareEmail.toLowerCase().trim());
    if (alreadyExists) return;

    setSharedEmailList([...sharedEmailList, { email: newShareEmail.toLowerCase().trim(), permission: newSharePerm }]);
    setNewShareEmail("");
  };

  const handleRemoveShareEmail = (emailIdx: number) => {
    setSharedEmailList(sharedEmailList.filter((_, idx) => idx !== emailIdx));
  };

  const copyShareLinkToClipboard = (fileId: string) => {
    const rawLink = `${window.location.origin}/api/files/download/${fileId}?token=${token}`;
    navigator.clipboard.writeText(rawLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  // CSV renderer
  const renderCsvTable = (content: string) => {
    const rows = content.split('\n').filter(row => row.trim()).slice(0, 15);
    return (
      <div className="overflow-x-auto w-full max-h-[40vh] border border-slate-100 rounded-xl" id="csv-preview-table-container">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {rows[0]?.split(',').map((header, idx) => (
                <th key={idx} className="p-2 font-extrabold text-slate-700 border-r border-slate-200">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-slate-100 hover:bg-slate-50">
                {row.split(',').map((cell, cellIdx) => (
                  <td key={cellIdx} className="p-2 text-slate-600 border-r border-slate-150 truncate max-w-[150px]">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {content.split('\n').length > 16 && (
          <p className="text-[10px] text-slate-400 font-semibold p-2 text-center bg-slate-50/50">Showing first 15 rows</p>
        )}
      </div>
    );
  };

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
                    {renderedRecentList.map((file, fileIdx) => (
                      <div 
                        key={`recent-file-${file.id}-${fileIdx}`}
                        onClick={() => {
                          setPreviewFile(file);
                        }}
                        className="py-3 px-2 rounded-2xl flex items-center justify-between group/file hover:bg-slate-50 transition-all duration-200 -mx-2 cursor-pointer"
                        id={`recent-file-row-${file.id}`}
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

                          {/* 3-Dot Dropdown / Context Menu Container */}
                          <div className="relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuFileId(activeMenuFileId === file.id ? null : file.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-705 hover:bg-slate-100 transition-all cursor-pointer relative"
                              id={`three-dot-menu-toggle-${file.id}`}
                            >
                              <MoreVertical className="w-4 h-4 text-slate-400" />
                            </button>

                            <AnimatePresence>
                              {activeMenuFileId === file.id && (
                                <React.Fragment key={`recent-menu-frag-${file.id}`}>
                                  {/* Invisible click outside overlay */}
                                  <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setActiveMenuFileId(null); 
                                    }} 
                                  />
                                  <motion.div
                                    key={`recent-menu-dropdown-${file.id}`}
                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-1 w-52 bg-white border border-slate-100 rounded-[16px] shadow-[0_10px_35px_rgba(0,0,0,0.12)] py-1.5 z-50 text-left overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                    id={`context-menu-popover-${file.id}`}
                                  >
                                    <button
                                      onClick={() => {
                                        setPreviewFile(file);
                                        setActiveMenuFileId(null);
                                      }}
                                      className="w-full px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <Eye className="w-4.5 h-4.5 text-slate-400 stroke-[1.8]" />
                                      <span>👁 Preview</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        handleDownload(file);
                                        setActiveMenuFileId(null);
                                      }}
                                      className="w-full px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <Download className="w-4.5 h-4.5 text-slate-400 stroke-[1.8]" />
                                      <span>⬇ Download File</span>
                                    </button>

                                    <button
                                      onClick={() => handleToggleStar(file)}
                                      className="w-full px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <Star className={`w-4.5 h-4.5 stroke-[1.8] ${file.isStarred ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                                      <span>{file.isStarred ? '⭐ Unstar Item' : '⭐ Star Item'}</span>
                                    </button>

                                    <button
                                      onClick={() => handleOpenShareModal(file)}
                                      className="w-full px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <Share2 className="w-4.5 h-4.5 text-slate-400 stroke-[1.8]" />
                                      <span>🔗 Share</span>
                                    </button>

                                    <div className="h-[1px] bg-slate-50 my-1" />

                                    <button
                                      onClick={() => {
                                        setRenameFile(file);
                                        setRenameValue(file.name);
                                        setActiveMenuFileId(null);
                                      }}
                                      className="w-full px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <Edit3 className="w-4.5 h-4.5 text-slate-400 stroke-[1.8]" />
                                      <span>✏ Rename</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        setMoveFile(file);
                                        setTargetFolderId(file.parentId);
                                        setActiveMenuFileId(null);
                                      }}
                                      className="w-full px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <Move className="w-4.5 h-4.5 text-slate-400 stroke-[1.8]" />
                                      <span>📂 Move</span>
                                    </button>

                                    <button
                                      onClick={() => handleDuplicate(file)}
                                      className="w-full px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <Copy className="w-4.5 h-4.5 text-slate-400 stroke-[1.8]" />
                                      <span>📑 Duplicate</span>
                                    </button>

                                    <div className="h-[1px] bg-slate-50 my-1" />

                                    <button
                                      onClick={() => handleMoveToTrash(file)}
                                      className="w-full px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-4.5 h-4.5 text-rose-500 stroke-[1.8]" />
                                      <span>🗑 Move to Trash</span>
                                    </button>
                                  </motion.div>
                                </React.Fragment>
                              )}
                            </AnimatePresence>
                          </div>
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

      {/* ================= PREMIUM ANCHORED MODALS & OVERLAYS ================= */}
      <AnimatePresence>
        {/* 1. PREMIUM FILE PREVIEW MODAL */}
        {previewFile && (() => {
          const securePreviewUrl = `/api/files/download/${previewFile.id}?token=${token}`;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6" id="premium-preview-modal-root">
              {/* Elegant blurred backdrop click-to-close */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPreviewFile(null)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
                id="preview-modal-backdrop"
              />

              {/* Main Premium Card Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: "tween", ease: "easeOut", duration: 0.12 }}
                className="relative w-full max-w-4xl bg-white rounded-[24px] shadow-[0_24px_60px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-10 flex flex-col max-h-[85vh]"
                id="preview-modal-card"
              >
                {/* TOP HEADER PANEL */}
                <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3.5 truncate text-left">
                    <div className="shrink-0 scale-90">
                      {renderItemVisual(previewFile)}
                    </div>
                    <div className="truncate">
                      <h3 className="font-bold text-slate-800 text-[14.5px] truncate" title={previewFile.name}>
                        {previewFile.name}
                      </h3>
                      <p className="text-[10.5px] text-slate-400 font-semibold font-sans mt-0.5">
                        {formatBytes(previewFile.size)} • Modified on {new Date(previewFile.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {previewFile.id && (
                      <button
                        onClick={() => window.open(securePreviewUrl, '_blank')}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="hidden sm:inline">New Tab</span>
                      </button>
                    )}
                    <button
                      onClick={() => setPreviewFile(null)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-705 hover:bg-slate-100 transition-all cursor-pointer"
                      id="preview-modal-close-btn"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* MIDDLE PREVIEW AREA */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20 flex flex-col items-center justify-center min-h-[350px]">
                  {(() => {
                    const mime = previewFile.mimeType.toLowerCase();
                    const name = previewFile.name.toLowerCase();

                    // 1. Image Preview
                    if (mime.startsWith('image/') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp') || name.endsWith('.gif') || name.endsWith('.svg')) {
                      return (
                        <div className="flex flex-col items-center justify-center space-y-4 w-full">
                          <div className="overflow-auto max-h-[50vh] flex items-center justify-center p-2 rounded-2xl bg-white border border-slate-100/60 shadow-xs max-w-full">
                            <img
                              src={securePreviewUrl}
                              alt={previewFile.name}
                              referrerPolicy="no-referrer"
                              className="max-h-[45vh] w-auto h-auto object-contain transition-transform duration-200"
                              style={{ transform: `scale(${isPublicLink ? 1.2 : 1})` }} // simple visual scale support
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Responsive Web High-Quality preview</p>
                        </div>
                      );
                    }

                    // 2. PDF Preview
                    if (mime.includes('pdf') || name.endsWith('.pdf')) {
                      return (
                        <div className="w-full h-[50vh] rounded-xl overflow-hidden border border-slate-150 shadow-xs bg-white">
                          <iframe
                            src={`${securePreviewUrl}#toolbar=1`}
                            title={previewFile.name}
                            className="w-full h-full border-0"
                          />
                        </div>
                      );
                    }

                    // 3. Audio Preview
                    if (mime.startsWith('audio/') || name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.m4a') || name.endsWith('.ogg')) {
                      return (
                        <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center space-y-4">
                          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto border border-indigo-100">
                            <Music className="w-6 h-6 animate-pulse" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-extrabold text-sm text-slate-800 truncate">{previewFile.name}</p>
                            <p className="text-[11px] text-slate-400 font-bold tracking-tight">Audio Player Integration</p>
                          </div>
                          <audio src={securePreviewUrl} controls className="w-full mt-2" />
                        </div>
                      );
                    }

                    // 4. Video Preview
                    if (mime.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.mkv') || name.endsWith('.mov') || name.endsWith('.webm')) {
                      return (
                        <div className="w-full max-w-2xl bg-black rounded-2xl overflow-hidden shadow-lg border border-slate-800">
                          <video
                            src={securePreviewUrl}
                            controls
                            className="w-full max-h-[50vh] bg-black"
                            preload="metadata"
                            playsInline
                          />
                        </div>
                      );
                    }

                    // 5. Code & Text files (Live formatted view)
                    const textExtensions = ['.txt', '.js', '.ts', '.tsx', '.json', '.html', '.css', '.md', '.xml', '.py', '.cpp', '.java'];
                    const isTextFile = mime.startsWith('text/') || mime.includes('json') || mime.includes('xml') || textExtensions.some(ext => name.endsWith(ext));
                    if (isTextFile) {
                      if (loadingText) {
                        return (
                          <div className="flex flex-col items-center justify-center space-y-2 py-10">
                            <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                            <p className="text-xs font-bold text-slate-500">Buffering document secure stream...</p>
                          </div>
                        );
                      }

                      if (name.endsWith('.csv')) {
                        return renderCsvTable(textContent);
                      }

                      return (
                        <div className="w-full rounded-xl border border-slate-150 shadow-xs bg-white text-left font-mono text-xs overflow-hidden max-h-[50vh] flex flex-col">
                          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                            <span>SYNTAX VIEWER</span>
                            <span>{mime.toUpperCase()}</span>
                          </div>
                          <pre className="flex-1 overflow-auto p-4 bg-slate-55 bg-slate-50 text-slate-700 whitespace-pre scrollbar-thin font-mono leading-relaxed text-[11px] select-text">
                            {textContent || "No text payload."}
                          </pre>
                        </div>
                      );
                    }

                  // 6. Excel sheets panels
                  if (name.endsWith('.xls') || name.endsWith('.xlsx')) {
                    return (
                      <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center space-y-4">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                          <BarChart3 className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-extrabold text-sm text-slate-800">{previewFile.name}</p>
                          <p className="text-xs text-slate-400 font-medium">Microsoft Excel Spreadsheet Document</p>
                        </div>
                        <p className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          Interactive worksheets require Office Online permissions. Download this document to review and modify standard sheets.
                        </p>
                        <button
                          onClick={() => handleDownload(previewFile)}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                        >
                          Download Excel Workbook
                        </button>
                      </div>
                    );
                  }

                  // 7. Zip/Rar Archives listings
                  if (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.tar') || name.endsWith('.7z')) {
                    return (
                      <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center space-y-4">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-100">
                          <Folder className="w-6 h-6" />
                        </div>
                        <div className="space-y-1.5">
                          <p className="font-extrabold text-sm text-slate-800">{previewFile.name}</p>
                          <p className="text-xs text-slate-400 font-medium">Compressed Archive Folder ({formatBytes(previewFile.size)})</p>
                        </div>
                        
                        <div className="text-left text-[11px] space-y-2 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                          <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Potential Archive Contents:</p>
                          <div className="flex items-center justify-between text-slate-600">
                            <span>📂 assets/</span>
                            <span>Folder</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span>📄 index.html</span>
                            <span>12.4 KB</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span>📄 package.json</span>
                            <span>1.1 KB</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDownload(previewFile)}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-705 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                        >
                          Download ZIP Archive
                        </button>
                      </div>
                    );
                  }

                  // Default Unknown files layout
                  return (
                    <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center space-y-4">
                      <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-extrabold text-sm text-slate-800 truncate">{previewFile.name}</p>
                        <p className="text-xs text-slate-400 font-medium">Unknown Resource Type • {previewFile.mimeType || "application/octet-stream"}</p>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed max-w-[280px] mx-auto font-semibold">
                        This mime-type is fully supported for offline usage. Download the file below to open it inside local host applications.
                      </p>
                      <button
                        onClick={() => handleDownload(previewFile)}
                        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                      >
                        Download Resource
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* BOTTOM FOOTER CONTROLS */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-2 items-center justify-between">
                <button
                  onClick={() => handleDownload(previewFile)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenShareModal(previewFile)}
                    className="px-3.5 py-2 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-150 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setRenameFile(previewFile);
                      setRenameValue(previewFile.name);
                      setPreviewFile(null);
                    }}
                    className="px-3.5 py-2 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-150 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Rename</span>
                  </button>

                  <button
                    onClick={() => {
                      handleMoveToTrash(previewFile);
                      setPreviewFile(null);
                    }}
                    className="px-3.5 py-2 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Trash</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
          );
        })()}

        {/* 2. PREMIUM SHARE DIALOG MODAL */}
        {shareFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="share-modal-root">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShareFile(null)}
              className="absolute inset-0 bg-slate-900/35 backdrop-blur-xs" 
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-md bg-white rounded-[22px] shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-slate-100 overflow-hidden z-10 flex flex-col"
            >
              <form onSubmit={handleShareSubmit}>
                {/* Header */}
                <div className="px-5.5 py-4 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Share "{shareFile.name}"</h3>
                      <p className="text-[10.5px] text-slate-400 font-semibold font-sans mt-0.5">Control audience permissions</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShareFile(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5.5 space-y-4 text-left">
                  {/* Share with email */}
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-extrabold uppercase text-slate-400 tracking-wider">Add operator collaborator</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          placeholder="collaborator@operator.com"
                          value={newShareEmail}
                          onChange={(e) => setNewShareEmail(e.target.value)}
                          className="w-full pl-9.5 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 font-sans"
                        />
                      </div>
                      <select
                        value={newSharePerm}
                        onChange={(e) => setNewSharePerm(e.target.value)}
                        className="px-1.5 py-2 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none focus:border-blue-500 bg-white"
                      >
                        <option value="view">Viewer</option>
                        <option value="edit">Editor</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleAddShareEmail}
                        className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* List of collaborators */}
                  <div className="space-y-1.5">
                    <span className="text-[10.5px] font-extrabold uppercase text-slate-400 tracking-wider">Collaborators list</span>
                    <div className="border border-slate-100 rounded-xl bg-slate-50/30 p-2 max-h-[140px] overflow-y-auto divide-y divide-slate-100">
                      {sharedEmailList.length === 0 ? (
                        <p className="text-[11px] text-slate-400 py-3 text-center font-semibold font-sans">No private emails added</p>
                      ) : (
                        sharedEmailList.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
                            <div className="truncate text-left font-semibold text-[11px] text-slate-700 font-sans">
                              <span>{item.email}</span>
                              <span className="text-[9px] px-1 py-0.5 rounded-md ml-1 bg-slate-100 text-slate-500 font-black tracking-wide font-sans">{item.permission.toUpperCase()}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveShareEmail(idx)}
                              className="text-[10px] text-slate-400 hover:text-rose-600 font-extrabold cursor-pointer hover:underline transition-colors font-sans"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Public Link Generator */}
                  <div className="p-3.5 rounded-xl border border-sky-100/50 bg-sky-50/25 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xs font-extrabold text-sky-950 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-sky-600" />
                          <span>Generate Public Download Link</span>
                        </p>
                        <p className="text-[10.5px] text-sky-600 font-semibold font-sans mt-0.5">Allows direct downloading via a unique slug</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPublicLink(!isPublicLink)}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors focus:outline-none ${isPublicLink ? 'bg-sky-600' : 'bg-slate-200'}`}
                        id="public-share-toggle-switch"
                      >
                        <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-xs transform duration-200 ${isPublicLink ? 'translate-x-4.5' : ''}`} />
                      </button>
                    </div>

                    {isPublicLink && (
                      <div className="flex items-center gap-2 pt-1 border-t border-sky-100/40 mt-1">
                        <div className="flex-1 bg-white px-2 py-1.5 border border-slate-150 rounded-lg text-[10.5px] text-slate-500 font-mono select-all truncate">
                          {window.location.origin}/api/files/download/{shareFile.id}
                        </div>
                        <button
                          type="button"
                          onClick={() => copyShareLinkToClipboard(shareFile.id)}
                          className="p-2 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 rounded-lg shrink-0 transition-colors cursor-pointer"
                        >
                          {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5.5 py-4 border-t border-slate-50 bg-slate-50/20 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShareFile(null)}
                    className="px-4 py-2 hover:bg-slate-150 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer border border-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm hover:shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* 3. PROFESSIONAL RENAME MODAL */}
        {renameFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRenameFile(null)}
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs" 
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-sm bg-white rounded-[22px] shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-slate-100 overflow-hidden z-10 flex flex-col text-left"
            >
              <form onSubmit={handleRenameSubmit}>
                <div className="px-5.5 py-4 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm">Rename Item</h3>
                  <button type="button" onClick={() => setRenameFile(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5.5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">File Name</label>
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      required
                      placeholder="Enter new name"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 font-sans"
                    />
                  </div>
                </div>

                <div className="px-5.5 py-4 border-t border-slate-50 bg-slate-50/20 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setRenameFile(null)}
                    className="px-4 py-2 hover:bg-slate-150 text-slate-600 rounded-xl text-xs font-bold border border-transparent cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                  >
                    Rename
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* 4. MOVE TO FOLDER MODAL */}
        {moveFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoveFile(null)}
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs" 
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-sm bg-white rounded-[22px] shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-slate-100 overflow-hidden z-10 flex flex-col text-left"
            >
              <form onSubmit={handleMoveSubmit}>
                <div className="px-5.5 py-4 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm">Move "{moveFile.name}"</h3>
                  <button type="button" onClick={() => setMoveFile(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5.5 space-y-3">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Target Destination Folder</label>
                  
                  <div className="border border-slate-100 rounded-xl max-h-[220px] overflow-y-auto divide-y divide-slate-50">
                    <button
                      type="button"
                      onClick={() => setTargetFolderId(null)}
                      className={`w-full px-3 py-2 text-xs font-bold text-slate-705 text-left flex items-center gap-2 cursor-pointer transition-colors ${targetFolderId === null ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50'}`}
                    >
                      <HardDrive className="w-4 h-4 text-slate-400" />
                      <span>Root Workspace / All Files</span>
                    </button>

                    {files
                      .filter(f => f.isFolder && !f.isTrashed && f.id !== moveFile.id)
                      .map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setTargetFolderId(f.id)}
                          className={`w-full px-3 py-2 text-xs font-bold text-slate-705 text-left flex items-center gap-2 cursor-pointer transition-colors ${targetFolderId === f.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50'}`}
                        >
                          <Folder className="w-4 h-4 text-slate-400" />
                          <span>{f.name}</span>
                        </button>
                      ))}
                  </div>
                </div>

                <div className="px-5.5 py-4 border-t border-slate-50 bg-slate-50/20 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setMoveFile(null)}
                    className="px-4 py-2 hover:bg-slate-150 text-slate-600 rounded-xl text-xs font-bold border border-transparent cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                  >
                    Move Here
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* 5. FLOATING SLIDE TOAST NOTIFICATION */}
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-6 right-6 bg-slate-900 text-white px-5.5 py-3 rounded-2xl shadow-xl z-55 flex items-center gap-2.5 text-xs font-bold max-w-sm tracking-wide"
            id="premium-toast-alert"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
