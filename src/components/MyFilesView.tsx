import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, File, ChevronRight, Grid, List, MoreVertical, Star, Trash2, Download, 
  Share2, Edit3, Eye, FileText, Image, Film, Music, Archive, Move, Copy, Plus, 
  ArrowUp, Search, SlidersHorizontal, ChevronDown, Check, X, ShieldAlert, Key, FolderPlus,
  Play, Lock, Loader2, PlayCircle, ToggleLeft, Activity, Trash, Sparkles
} from 'lucide-react';
import { CloudFile, SharedUser, ShareLink } from '../types.js';

interface MyFilesViewProps {
  files: CloudFile[];
  onRefresh: () => void;
  token: string;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onTrackActivity: () => void;
}

export default function MyFilesView({ 
  files: initialFiles, 
  onRefresh, 
  token,
  selectedFolderId,
  onSelectFolder,
  onTrackActivity
}: MyFilesViewProps) {
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMimeFilter, setActiveMimeFilter] = useState<string>(''); 
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState<CloudFile | null>(null);
  const [previewFile, setPreviewFile] = useState<CloudFile | null>(null);
  
  const [activeContextId, setActiveContextId] = useState<string | null>(null);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [moveId, setMoveId] = useState<string | null>(null);
  const [targetParentId, setTargetParentId] = useState<string | 'null'>('null');

  const [shareFile, setShareFile] = useState<CloudFile | null>(null);
  const [newShareEmail, setNewShareEmail] = useState('');
  const [newSharePerm, setNewSharePerm] = useState<'viewer' | 'editor' | 'download_only'>('viewer');
  const [sharedEmailList, setSharedEmailList] = useState<SharedUser[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [pwdEnabled, setPwdEnabled] = useState(false);
  const [pwdValue, setPwdValue] = useState('');
  const [expiresAtValue, setExpiresAtValue] = useState('');

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const [uploadQueue, setUploadQueue] = useState<any[]>([]);

  // Keep preview file data in sync with changes in the active workspace
  useEffect(() => {
    if (previewFile) {
      const updated = initialFiles.find(f => f.id === previewFile.id);
      if (updated) {
        setPreviewFile(updated);
      } else {
        setPreviewFile(null); // Close if the file gets deleted
      }
    }
  }, [initialFiles]);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: CloudFile) => {
    if (file.isFolder) return <Folder className="w-4.5 h-4.5 text-blue-600 fill-blue-500/10" />;
    const mime = file.mimeType.toLowerCase();
    if (mime.startsWith('image/')) return <Image className="w-4.5 h-4.5 text-cyan-500" />;
    if (mime.includes('/pdf')) return <FileText className="w-4.5 h-4.5 text-red-500" />;
    if (mime.startsWith('video/')) return <Film className="w-4.5 h-4.5 text-purple-500" />;
    if (mime.startsWith('audio/')) return <Music className="w-4.5 h-4.5 text-pink-500" />;
    if (mime.includes('zip') || mime.includes('tar') || mime.includes('archive')) return <Archive className="w-4.5 h-4.5 text-amber-500" />;
    return <FileText className="w-4.5 h-4.5 text-slate-500" />;
  };

  const currentFolderFiles = initialFiles.filter(item => {
    if (item.isTrashed) return false;
    
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    }
    
    return item.parentId === selectedFolderId;
  });

  const filteredAndSortedFiles = currentFolderFiles.filter(item => {
    if (!activeMimeFilter) return true;
    if (item.isFolder) return false; 
    
    const mime = item.mimeType.toLowerCase();
    if (activeMimeFilter === 'image') return mime.startsWith('image/');
    if (activeMimeFilter === 'pdf') return mime.includes('/pdf');
    if (activeMimeFilter === 'document') {
      return mime.includes('word') || mime.includes('excel') || mime.includes('presentation') || mime.includes('officedocument') || mime.includes('text') || mime.includes('pdf');
    }
    if (activeMimeFilter === 'zip') return mime.includes('zip') || mime.includes('tar') || mime.includes('rar') || mime.includes('archive');
    return true;
  });

  filteredAndSortedFiles.sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;

    let compA: any = a.name;
    let compB: any = b.name;

    if (sortBy === 'size') {
      compA = a.size;
      compB = b.size;
    } else if (sortBy === 'createdAt') {
      compA = new Date(a.createdAt).getTime();
      compB = new Date(b.createdAt).getTime();
    }

    const comparison = compA < compB ? -1 : compA > compB ? 1 : 0;
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const getBreadcrumbs = () => {
    const list: { id: string | null; name: string }[] = [{ id: null, name: 'S3 Root Workspace' }];
    let currId = selectedFolderId;
    
    const breadcrumbChain: { id: string; name: string }[] = [];
    while (currId) {
      const folderRecord = initialFiles.find(f => f.id === currId);
      if (folderRecord) {
        breadcrumbChain.unshift({ id: folderRecord.id, name: folderRecord.name });
        currId = folderRecord.parentId;
      } else {
        break;
      }
    }
    return [...list, ...breadcrumbChain];
  };

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch('/api/files/create-folder', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newFolderName.trim(), parentId: selectedFolderId }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed creating new folder');
      }

      setNewFolderName('');
      setIsNewFolderOpen(false);
      onRefresh();
      onTrackActivity();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error creating folder');
    }
  };

  const handleDuplicate = async (fileId: string) => {
    setLoadingActionId(fileId);
    try {
      const response = await fetch(`/api/files/duplicate/${fileId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const ed = await response.json();
        throw new Error(ed.error || 'Duplicate operation failed.');
      }
      onRefresh();
      onTrackActivity();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingActionId(null);
      setActiveContextId(null);
    }
  };

  const handleToggleStar = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/toggle-star/${fileId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Toggle favorite status failed');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActiveContextId(null);
    }
  };

  const handleMoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveId) return;

    try {
      const response = await fetch(`/api/files/move/${moveId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ parentId: targetParentId === 'null' ? null : targetParentId })
      });

      if (!response.ok) {
        const ed = await response.json();
        throw new Error(ed.error || 'Move files failed');
      }

      setMoveId(null);
      onRefresh();
      onTrackActivity();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActiveContextId(null);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameId || !renameValue.trim()) return;

    try {
      const response = await fetch(`/api/files/rename/${renameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: renameValue.trim() })
      });

      if (!response.ok) throw new Error('Rename failed');
      setRenameId(null);
      onRefresh();
      onTrackActivity();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActiveContextId(null);
    }
  };

  const handleDeleteFolderOrFile = async (item: CloudFile) => {
    if (!confirm(`Are you sure you want to move "${item.name}" into the trash?`)) return;
    
    setLoadingActionId(item.id);
    try {
      const response = await fetch(`/api/files/delete/${item.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to trash this element');
      onRefresh();
      onTrackActivity();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingActionId(null);
      setActiveContextId(null);
    }
  };

  const handleOpenShare = (item: CloudFile) => {
    setShareFile(item);
    setSharedEmailList(item.sharedWith || []);
    if (item.shareLink) {
      setIsPublic(item.shareLink.isPublic);
      setPwdEnabled(item.shareLink.passwordEnabled);
      setPwdValue(item.shareLink.password || '');
      setExpiresAtValue(item.shareLink.expiresAt ? item.shareLink.expiresAt.substring(0, 10) : '');
    } else {
      setIsPublic(false);
      setPwdEnabled(false);
      setPwdValue('');
      setExpiresAtValue('');
    }
    setActiveContextId(null);
  };

  const handleAddShareEmail = () => {
    if (!newShareEmail.trim()) return;
    if (!newShareEmail.includes('@')) {
      alert('Must supply valid email format');
      return;
    }

    const itemExists = sharedEmailList.some(su => su.email.toLowerCase() === newShareEmail.toLowerCase().trim());
    if (itemExists) return;

    const newList = [...sharedEmailList, { email: newShareEmail.toLowerCase().trim(), permission: newSharePerm }];
    setSharedEmailList(newList);
    setNewShareEmail('');
  };

  const handleRemoveShareEmail = (email: string) => {
    setSharedEmailList(sharedEmailList.filter(su => su.email !== email));
  };

  const handleSaveShareConfig = async () => {
    if (!shareFile) return;

    try {
      const shareResp = await fetch(`/api/files/share/${shareFile.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sharedWith: sharedEmailList })
      });

      if (!shareResp.ok) throw new Error('Failed sharing item with target email lists');

      const linkPayload = {
        isPublic,
        passwordEnabled: pwdEnabled,
        password: pwdValue.trim() || null,
        expiresAt: expiresAtValue || null
      };

      const linkResp = await fetch(`/api/files/share-link/${shareFile.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(linkPayload)
      });

      if (!linkResp.ok) throw new Error('Failed generating share link configuration properties');

      setShareFile(null);
      onRefresh();
      onTrackActivity();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDownload = (file: CloudFile) => {
    if (file.isFolder) {
      alert('Bulk directory zip downloading complies with Pro membership tier.');
      return;
    }
    const downloadUrl = `/api/files/download/${file.id}?token=${token}`;
    window.open(downloadUrl, '_blank');
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesUpload(e.target.files);
    }
  };

  const handleFilesUpload = async (items: FileList) => {
    const queueList = [...uploadQueue];

    for (let i = 0; i < items.length; i++) {
      const element = items[i];
      const trackingId = 'q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      
      const newQueueItem = {
        id: trackingId,
        name: element.name,
        size: element.size,
        progress: 10,
        status: 'uploading',
        part: element
      };

      queueList.push(newQueueItem);
      setUploadQueue([...queueList]);

      const formData = new FormData();
      formData.append('file', element);
      if (selectedFolderId) {
        formData.append('parentId', selectedFolderId);
      }

      try {
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Upload error');
        }

        setUploadQueue(prev => prev.map(item => item.id === trackingId ? { ...item, progress: 100, status: 'completed' } : item));
        onRefresh();
        onTrackActivity();
      } catch (err: any) {
        setUploadQueue(prev => prev.map(item => item.id === trackingId ? { ...item, status: 'error', progress: 0, errorMsg: err.message } : item));
      }
    }
  };

  const handleClearCompletedUploads = () => {
    setUploadQueue(uploadQueue.filter(item => item.status === 'uploading'));
  };

  return (
    <div 
      className="space-y-6 font-sans relative pb-12"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      id="my-files-explorer-root"
    >
      {/* Drag & Drop Overlay backdrop */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-blue-600/10 border-4 border-dashed border-blue-500 rounded-3xl z-40 flex flex-col items-center justify-center space-y-4 pointer-events-none backdrop-blur-md"
          >
            <div className="p-5 bg-white rounded-full text-blue-600 shadow-xl">
              <ArrowUp className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-xl font-bold text-blue-900 font-display">Drop elements to upload</h3>
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Live synchronized secure stream</p>
          </motion.div>
        )}
      </AnimatePresence>

      <input 
        type="file" 
        multiple
        ref={fileInputRef} 
        onChange={handleFileInputChange}
        className="hidden" 
      />

      {/* 1. Header Toolbar Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 border-b border-slate-200/50 pb-5">
        
        {/* Navigation breadcrumbs */}
        <div className="flex items-center space-x-2.5 overflow-x-auto py-1 scrollbar-none w-full xl:w-auto">
          {getBreadcrumbs().map((b, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />}
              <button 
                id={`breadcrumb-${idx}`}
                onClick={() => onSelectFolder(b.id)}
                className={`text-sm font-semibold whitespace-nowrap transition-colors hover:text-blue-600 cursor-pointer ${
                  b.id === selectedFolderId ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                {b.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Category Quick Filter badges */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start sm:justify-end">
          
          {/* Category Quick Filter badges */}
          <div className="flex space-x-1 overflow-x-auto bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 leading-none">
            <button 
              onClick={() => setActiveMimeFilter('')} 
              className={`px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-all ${!activeMimeFilter ? 'bg-white text-slate-900 shadow-sm shadow-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
            >
              All Files
            </button>
            <button 
              onClick={() => setActiveMimeFilter('document')} 
              className={`px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-all ${activeMimeFilter === 'document' ? 'bg-white text-slate-900 shadow-sm shadow-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Docs
            </button>
            <button 
              onClick={() => setActiveMimeFilter('image')} 
              className={`px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-all ${activeMimeFilter === 'image' ? 'bg-white text-slate-900 shadow-sm shadow-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Images
            </button>
            <button 
              onClick={() => setActiveMimeFilter('zip')} 
              className={`px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-all ${activeMimeFilter === 'zip' ? 'bg-white text-slate-900 shadow-sm shadow-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
            >
              ZIPs
            </button>
          </div>

          {/* Quick search input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-semibold" />
            <input 
              id="explorer-search"
              type="text" 
              placeholder="Search active folder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-slate-200 bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 transition-all text-slate-800 w-full sm:w-48 placeholder-slate-400 shadow-sm"
            />
          </div>

          <button 
            id="trigger-file-select"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center space-x-2 px-4.5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-bold text-xs text-white rounded-2xl shadow-lg shadow-blue-500/10 cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Upload</span>
          </button>

          <button 
            id="trigger-folder-modal"
            onClick={() => setIsNewFolderOpen(true)}
            className="inline-flex items-center space-x-2 px-4.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-700 rounded-2xl cursor-pointer active:scale-95 transition-all shadow-sm shadow-slate-100"
          >
            <FolderPlus className="w-4 h-4 text-slate-500" />
            <span>Folder</span>
          </button>

          {/* Grid/List toggler */}
          <div className="flex bg-slate-100 border border-slate-200 rounded-2xl p-0.5 shadow-sm">
            <button 
              id="view-grid-toggle"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm shadow-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid Layout"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              id="view-list-toggle"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm shadow-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              title="List Layout"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Upload queues drawer */}
      {uploadQueue.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 text-slate-200 rounded-2xl p-4.5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              <p className="font-semibold text-slate-100 uppercase tracking-wider font-mono text-[10px]">Synchronizer Queue monitor</p>
            </div>
            <button 
              onClick={handleClearCompletedUploads}
              className="text-blue-400 font-bold hover:underline"
            >
              Clear Completed
            </button>
          </div>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-2">
            {uploadQueue.map(item => (
              <div key={item.id} className="flex items-center justify-between text-xs bg-slate-800/40 p-3 rounded-xl border border-slate-800/60">
                <div className="flex items-center space-x-3 w-2/3">
                  <FileText className="w-4.5 h-4.5 text-blue-400 flex-shrink-0" />
                  <div className="truncate">
                    <p className="font-semibold text-slate-200 truncate">{item.name}</p>
                    <span className="text-[10px] text-slate-500 font-mono">{formatBytes(item.size)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {item.status === 'uploading' && (
                    <span className="text-blue-400 font-mono font-bold animate-pulse">{item.progress}%</span>
                  )}
                  {item.status === 'completed' && (
                    <span className="text-emerald-400 font-mono font-semibold">Completed</span>
                  )}
                  {item.status === 'error' && (
                    <span className="text-red-400 font-mono font-semibold" title={item.errorMsg}>Error</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Empty or files layout list */}
      {filteredAndSortedFiles.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200/80 p-20 text-center space-y-5 max-w-xl mx-auto my-12 shadow-sm" id="explorer-empty">
          <div className="shadow-xl shadow-slate-100 bg-slate-50 border border-slate-100 p-5 rounded-full inline-flex text-slate-400">
            <Folder className="w-10 h-10 text-blue-600" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display font-medium text-slate-800 text-lg">Empty Cloud Directory</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              No elements matches configured metrics. Drag and drop file representations to dispatch multi-part uploads inside S3 buckets.
            </p>
          </div>
          <div className="pt-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center space-x-1.5 px-5 py-3 bg-blue-650 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-bold text-xs text-white rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Browse Machine files</span>
            </button>
          </div>
        </div>
      ) : (
        viewMode === 'grid' ? (
          /* Grid View Layout panel */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="explorer-grid">
            {filteredAndSortedFiles.map(item => {
              const isMenuOpen = activeContextId === item.id;
              return (
                <div 
                  key={item.id}
                  className="bg-white border border-slate-200/50 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-100/60 hover:-translate-y-0.5 rounded-2xl p-5 transition-all relative flex flex-col justify-between h-44 cursor-pointer"
                  onDoubleClick={() => item.isFolder && onSelectFolder(item.id)}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('.relative') || target.closest('button')) return;
                    if (item.isFolder) {
                      onSelectFolder(item.id);
                    } else {
                      setPreviewFile(item);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.isFolder) {
                          onSelectFolder(item.id);
                        } else {
                          setPreviewFile(item);
                        }
                      }}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      {getFileIcon(item)}
                    </button>
                    
                    <div className="flex items-center space-x-1.5">
                      {item.isStarred && <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />}
                      
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveContextId(isMenuOpen ? null : item.id);
                          }}
                          className="p-1 px-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
                        >
                          {loadingActionId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                          ) : (
                            <MoreVertical className="w-4 h-4" />
                          )}
                        </button>

                        <AnimatePresence>
                          {isMenuOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setActiveContextId(null)} />
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.96, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: -5 }}
                                className="absolute right-0 mt-1 w-44 bg-white border border-slate-200/80 shadow-xl rounded-xl p-1.5 z-50 text-xs text-slate-700 text-left font-semibold space-y-0.5"
                              >
                                {item.isFolder ? (
                                  <button onClick={(e) => { e.stopPropagation(); onSelectFolder(item.id); setActiveContextId(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                                    <Folder className="w-3.5 h-3.5 text-blue-500" /> Open Folder
                                  </button>
                                ) : (
                                  <button onClick={(e) => { e.stopPropagation(); handleDownload(item); setActiveContextId(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 font-bold text-blue-600 flex items-center gap-2 cursor-pointer">
                                    <Download className="w-3.5 h-3.5" /> Download File
                                  </button>
                                )}

                                <button onClick={(e) => { e.stopPropagation(); setPreviewFile(item); setActiveContextId(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-2 cursor-pointer">
                                  <Eye className="w-3.5 h-3.5 text-blue-600" /> Preview Details
                                </button>

                                <button onClick={() => handleToggleStar(item.id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-2 cursor-pointer">
                                  <Star className="w-3.5 h-3.5 text-amber-500" /> Star Item
                                </button>

                                <button onClick={() => { handleOpenShare(item); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-2 cursor-pointer">
                                  <Share2 className="w-3.5 h-3.5 text-cyan-500" /> Share Config
                                </button>

                                <button onClick={() => { setRenameId(item.id); setRenameValue(item.name); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-2 cursor-pointer">
                                  <Edit3 className="w-3.5 h-3.5 text-slate-400" /> Rename
                                </button>

                                <button onClick={() => { setMoveId(item.id); setTargetParentId(item.parentId || 'null'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-2 cursor-pointer">
                                  <Move className="w-3.5 h-3.5 text-slate-400" /> Relocate
                                </button>

                                {!item.isFolder && (
                                  <button onClick={() => handleDuplicate(item.id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-2 cursor-pointer">
                                    <Copy className="w-3.5 h-3.5 text-purple-400" /> Duplicate
                                  </button>
                                )}

                                <div className="border-t border-slate-100 my-1"></div>
                                
                                <button onClick={() => handleDeleteFolderOrFile(item)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" /> Direct Trash
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  <div className="truncate space-y-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.isFolder) {
                          onSelectFolder(item.id);
                        } else {
                          setPreviewFile(item);
                        }
                      }}
                      className="font-display font-semibold text-slate-900 text-sm hover:text-blue-600 text-left truncate block w-full outline-none cursor-pointer"
                    >
                      {item.name}
                    </button>
                    <div className="flex items-center justify-between text-xs text-slate-450 font-semibold font-sans">
                      <span>{item.isFolder ? 'Folder' : formatBytes(item.size)}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View Layout panel */
          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-x-auto" id="explorer-list">
            <table className="min-w-full divide-y divide-slate-150">
              <thead className="bg-[#F8FAFC]/55 text-xs text-slate-500 font-semibold border-b border-slate-200/40">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left">Document Title</th>
                  <th scope="col" className="px-6 py-3.5 text-left">Created Date</th>
                  <th scope="col" className="px-6 py-3.5 text-left">Size Index</th>
                  <th scope="col" className="px-6 py-3.5 text-left">Collaboration Sharing</th>
                  <th scope="col" className="px-6 py-3.5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                 {filteredAndSortedFiles.map(item => {
                  const isMenuOpen = activeContextId === item.id;
                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onDoubleClick={() => item.isFolder && onSelectFolder(item.id)}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest('.relative') || target.closest('button') || target.closest('a')) return;
                        if (item.isFolder) {
                          onSelectFolder(item.id);
                        } else {
                          setPreviewFile(item);
                        }
                      }}
                    >
                      <td className="px-6 py-4 flex items-center space-x-3.5 w-1/3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.isFolder) {
                              onSelectFolder(item.id);
                            } else {
                              setPreviewFile(item);
                            }
                          }}
                          className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 group-hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          {getFileIcon(item)}
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.isFolder) {
                              onSelectFolder(item.id);
                            } else {
                              setPreviewFile(item);
                            }
                          }}
                          className="font-semibold text-slate-900 hover:text-blue-600 truncate max-w-sm text-left block outline-none cursor-pointer"
                        >
                          {item.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-sans font-medium text-xs">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                        {item.isFolder ? '--' : formatBytes(item.size)}
                      </td>
                      <td className="px-6 py-4">
                        {item.sharedWith.length === 0 ? (
                          <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/10">Private (Me)</span>
                        ) : (
                          <div className="flex -space-x-1.5 overflow-hidden" title={item.sharedWith.map(s => s.email).join(', ')}>
                            {item.sharedWith.map((su, idx) => (
                              <div key={idx} className="h-5.5 w-5.5 rounded-full bg-blue-50 border border-white flex items-center justify-center text-[8px] font-bold text-blue-700">
                                {su.email.substring(0, 2).toUpperCase()}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveContextId(isMenuOpen ? null : item.id);
                          }}
                          className="p-1 px-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                          {isMenuOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setActiveContextId(null)} />
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                className="absolute right-6 top-10 mt-1 w-44 bg-white border border-slate-200/80 shadow-xl rounded-xl p-1.5 z-50 text-xs text-slate-700 text-left font-semibold space-y-0.5"
                              >
                                {item.isFolder ? (
                                  <button onClick={(e) => { e.stopPropagation(); onSelectFolder(item.id); setActiveContextId(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                                    <Folder className="w-3.5 h-3.5 text-blue-500" /> Open Folder
                                  </button>
                                ) : (
                                  <button onClick={(e) => { e.stopPropagation(); handleDownload(item); setActiveContextId(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 font-bold text-blue-600 flex items-center gap-2 cursor-pointer">
                                    <Download className="w-3.5 h-3.5" /> Download File
                                  </button>
                                )}

                                <button onClick={(e) => { e.stopPropagation(); setPreviewFile(item); setActiveContextId(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-2 cursor-pointer">
                                  <Eye className="w-3.5 h-3.5 text-blue-600" /> Preview Details
                                </button>

                                <button onClick={() => handleToggleStar(item.id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-2 cursor-pointer">
                                  <Star className="w-3.5 h-3.5 text-amber-500" /> Star Item
                                </button>

                                <button onClick={() => { handleOpenShare(item); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-2 cursor-pointer">
                                  <Share2 className="w-3.5 h-3.5 text-cyan-500" /> Share Config
                                </button>

                                <button onClick={() => { setRenameId(item.id); setRenameValue(item.name); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-2 cursor-pointer">
                                  <Edit3 className="w-3.5 h-3.5 text-slate-400" /> Rename
                                </button>

                                <button onClick={() => { setMoveId(item.id); setTargetParentId(item.parentId || 'null'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-2 cursor-pointer">
                                  <Move className="w-3.5 h-3.5 text-slate-400" /> Relocate
                                </button>

                                {!item.isFolder && (
                                  <button onClick={() => handleDuplicate(item.id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-2 cursor-pointer">
                                    <Copy className="w-3.5 h-3.5 text-purple-400" /> Duplicate
                                  </button>
                                )}

                                <div className="border-t border-slate-100 my-1"></div>
                                
                                <button onClick={() => handleDeleteFolderOrFile(item)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" /> Direct Trash
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* 4. Modal: Create Folder Form */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 max-w-sm w-full space-y-6 shadow-2xl relative z-10"
          >
            <div className="text-center space-y-1.5">
              <h3 className="font-display font-bold text-slate-800 text-lg">Create Directory Folder</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">Organize files and catalog assets within continuous partitions.</p>
            </div>
            <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
              <input 
                id="create-folder-name"
                type="text" 
                required
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enterprise Analytics Subfolders"
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-blue-600 transition-all text-slate-800"
              />
              <div className="flex space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsNewFolderOpen(false)}
                  className="w-1/2 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-xl border border-slate-200/60 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  id="create-folder-submit"
                  type="submit"
                  className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 font-bold text-white text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 5. Modal: Rename Element */}
      {renameId && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 max-w-sm w-full space-y-6 shadow-2xl"
          >
            <div className="text-center space-y-1.5">
              <h3 className="font-display font-bold text-slate-800 text-lg">Modify Label Name</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">Changes are reflected in direct-download links.</p>
            </div>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input 
                id="rename-element-input"
                type="text" 
                required
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-blue-600 transition-all text-slate-800"
              />
              <div className="flex space-x-3">
                <button 
                  type="button" 
                  onClick={() => setRenameId(null)}
                  className="w-1/2 py-3 bg-slate-50 hover:bg-slate-100 font-bold text-slate-500 text-xs border border-slate-200/60 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  id="rename-element-submit"
                  type="submit"
                  className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 font-bold text-white text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Confirm Rename
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 6. Modal: Move Element Location */}
      {moveId && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 max-w-sm w-full space-y-6 shadow-2xl container"
          >
            <div className="text-center space-y-1.5">
              <h3 className="font-display font-medium text-slate-800 text-lg">Move Folder Location</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">Relocate elements to different nested S3 subdirectories.</p>
            </div>
            <form onSubmit={handleMoveSubmit} className="space-y-4">
              <select 
                value={targetParentId}
                onChange={(e) => setTargetParentId(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-blue-600 font-semibold text-slate-700"
              >
                <option value="null">S3 Workspace (Root)</option>
                {initialFiles.filter(f => f.isFolder && f.id !== moveId && !f.isTrashed).map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <div className="flex space-x-3">
                <button 
                  type="button" 
                  onClick={() => setMoveId(null)}
                  className="w-1/2 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs border border-slate-200/60 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  id="move-element-submit"
                  type="submit"
                  className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 font-bold text-white text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Move element
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 7. Modal: Share Settings Links */}
      {shareFile && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm" id="share-modal-container">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-blue-600 font-black block">Private S3 link settings</span>
              <h3 className="font-display font-bold text-slate-800 text-lg">Sharing Permissions: {shareFile.name}</h3>
              <p className="text-xs text-slate-400 mt-1">Configure keys, email domains and expires rules securely.</p>
            </div>

            {/* Part A: email list permissions */}
            <div className="space-y-3.5 pt-4 border-t border-slate-100">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">Collaborator Permissions</span>
              
              <div className="flex items-center gap-2">
                <input 
                  type="email"
                  placeholder="colleague@enterprise.com"
                  value={newShareEmail}
                  onChange={(e) => setNewShareEmail(e.target.value)}
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 font-semibold text-slate-800"
                />
                <select 
                  value={newSharePerm}
                  onChange={(e: any) => setNewSharePerm(e.target.value)}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="download_only">Download Only</option>
                </select>
                <button 
                  type="button" 
                  onClick={handleAddShareEmail}
                  className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Emails lists representation */}
              <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
                {sharedEmailList.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic font-semibold">No direct email addresses whitelisted.</p>
                ) : (
                  sharedEmailList.map((su, index) => (
                    <div key={index} className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="font-semibold text-slate-800 block">{su.email}</span>
                        <span className="text-[9px] uppercase font-mono text-blue-600 font-bold">{su.permission.replace('_', ' ')}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveShareEmail(su.email)}
                        className="p-1 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Part B: public link expiry */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">External Secure Direct Link Options</span>
              
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="font-bold text-slate-850 text-xs block">Allow Public Share Links</span>
                  <span className="text-[11px] font-semibold text-slate-400">Generates a live link index in public dashboards.</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`w-12 h-6.5 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer ${isPublic ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <div className={`bg-white w-5.5 h-5.5 rounded-full shadow transform duration-300 ${isPublic ? 'translate-x-5.5' : ''}`} />
                </button>
              </div>

              {isPublic && (
                <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  {/* password verification switches */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-850 text-xs block">Apply Key Password Lock</span>
                      <span className="text-[11px] font-semibold text-slate-400">Force viewers to solve lock to download file.</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setPwdEnabled(!pwdEnabled)}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer ${pwdEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow transform duration-300 ${pwdEnabled ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  {pwdEnabled && (
                    <input 
                      type="text"
                      placeholder="Enter Secure Link Password"
                      value={pwdValue}
                      onChange={(e) => setPwdValue(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 text-slate-800"
                    />
                  )}

                  {/* expires block */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Expire Date Threshold</label>
                    <input 
                      type="date"
                      value={expiresAtValue}
                      onChange={(e) => setExpiresAtValue(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 text-slate-700"
                    />
                  </div>

                  {/* clipboard links print */}
                  <div className="bg-white p-3 rounded-xl border border-dashed border-slate-200 text-[10px] text-blue-600 font-mono break-all font-bold">
                    <span>{window.location.origin}/api/files/download/{shareFile.id}{pwdEnabled && pwdValue ? `?pwd=${pwdValue}` : ''}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setShareFile(null)}
                className="w-1/2 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs border border-slate-200/60 rounded-xl transition-all cursor-pointer"
              >
                Close Controls
              </button>
              <button 
                id="share-save-btn"
                type="button"
                onClick={handleSaveShareConfig}
                className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Save Permissions
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 8. Modal: Elegant File Inspector Preview */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
            <div className="fixed inset-0" onClick={() => setPreviewFile(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[28px] border border-slate-200/80 max-w-2xl w-full overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row h-auto max-h-[90vh] md:max-h-[85vh] text-slate-800"
            >
              {/* Left Side: Art & Icon Container */}
              <div className={`md:w-5/12 flex flex-col justify-between p-6 ${
                previewFile.isFolder ? 'bg-blue-50/40 border-r border-slate-100' :
                previewFile.mimeType.toLowerCase().startsWith('image/') ? 'bg-cyan-50/30 border-r border-slate-100' :
                previewFile.mimeType.toLowerCase().includes('/pdf') ? 'bg-red-50/30 border-r border-slate-100' :
                previewFile.mimeType.toLowerCase().startsWith('video/') ? 'bg-purple-50/30 border-r border-slate-100' :
                previewFile.mimeType.toLowerCase().startsWith('audio/') ? 'bg-pink-50/30 border-r border-slate-100' :
                previewFile.mimeType.toLowerCase().includes('zip') || previewFile.mimeType.toLowerCase().includes('tar') || previewFile.mimeType.toLowerCase().includes('rar') ? 'bg-amber-50/30 border-r border-slate-100' :
                'bg-slate-50/50 border-r border-slate-100'
              }`}>
                {/* Header badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 bg-white/80 border border-slate-200/40 px-2.5 py-1 rounded-full shadow-sm font-semibold">
                    {previewFile.isFolder ? 'Directory' : 'File Metadata'}
                  </span>
                  {previewFile.isStarred && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50/60 border border-amber-200/50 px-2 py-0.5 rounded-full font-semibold">
                      <Star className="w-3 h-3 fill-current text-amber-500" /> Starred
                    </span>
                  )}
                </div>

                {/* Big Beautiful Dynamic Placeholder Icon Representation */}
                <div className="py-8 flex flex-col items-center justify-center space-y-4">
                  <div className={`p-6 rounded-2xl shadow-xl shadow-slate-200/30 transition-all ${
                    previewFile.isFolder ? 'bg-white border border-blue-100 text-blue-600' :
                    previewFile.mimeType.toLowerCase().startsWith('image/') ? 'bg-white border border-cyan-100 text-cyan-500' :
                    previewFile.mimeType.toLowerCase().includes('/pdf') ? 'bg-white border border-red-100 text-red-500' :
                    previewFile.mimeType.toLowerCase().startsWith('video/') ? 'bg-white border border-purple-100 text-purple-500' :
                    previewFile.mimeType.toLowerCase().startsWith('audio/') ? 'bg-white border border-pink-100 text-pink-500' :
                    previewFile.mimeType.toLowerCase().includes('zip') || previewFile.mimeType.toLowerCase().includes('tar') || previewFile.mimeType.toLowerCase().includes('rar') ? 'bg-white border border-amber-100 text-amber-500' :
                    'bg-white border border-slate-200 text-slate-500'
                  }`}>
                    {previewFile.isFolder ? (
                      <Folder className="w-12 h-12 text-blue-600 fill-blue-500/5" />
                    ) : (
                      previewFile.mimeType.toLowerCase().startsWith('image/') ? (
                        <Image className="w-12 h-12 text-cyan-500" />
                      ) : previewFile.mimeType.toLowerCase().includes('/pdf') ? (
                        <FileText className="w-12 h-12 text-red-500" />
                      ) : previewFile.mimeType.toLowerCase().startsWith('video/') ? (
                        <Film className="w-12 h-12 text-purple-500" />
                      ) : previewFile.mimeType.toLowerCase().startsWith('audio/') ? (
                        <Music className="w-12 h-12 text-pink-500" />
                      ) : previewFile.mimeType.toLowerCase().includes('zip') || previewFile.mimeType.toLowerCase().includes('tar') || previewFile.mimeType.toLowerCase().includes('rar') || previewFile.mimeType.toLowerCase().includes('archive') ? (
                        <Archive className="w-12 h-12 text-amber-500" />
                      ) : (
                        <File className="w-12 h-12 text-slate-500" />
                      )
                    )}
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-[10px] uppercase font-mono font-extrabold tracking-widest text-slate-400 block">Format Index</span>
                    <span className="text-xs font-bold text-slate-700 capitalize">
                      {previewFile.isFolder ? 'Container Directory' : previewFile.name.substring(previewFile.name.lastIndexOf('.') + 1).toUpperCase() + ' Source'}
                    </span>
                  </div>
                </div>

                {/* S3 Security Badge information placeholder */}
                <div className="border border-dashed border-slate-200/80 bg-white/70 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[10px]">
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>AWS KMS SHA-256</span>
                  </div>
                  <p className="text-[9.5px] text-slate-450 leading-relaxed font-semibold">
                    Continuous server-side encryption with AWS managed encryption keys protects active assets.
                  </p>
                </div>
              </div>

              {/* Right Side: Metadata list & Actions */}
              <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 space-y-6">
                
                {/* Header Close Panel */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="font-display font-bold text-slate-900 text-sm leading-snug break-all truncate" title={previewFile.name}>
                      {previewFile.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold truncate">
                      ID Index: <span className="font-mono text-[10.5px] text-slate-500 font-medium">{previewFile.id}</span>
                    </p>
                  </div>
                  <button 
                    onClick={() => setPreviewFile(null)}
                    className="p-1 px-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Properties detailed grid */}
                <div className="grid grid-cols-2 gap-x-5 gap-y-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">Storage Size</span>
                    <span className="font-semibold text-slate-800 block">
                      {previewFile.isFolder ? '--' : formatBytes(previewFile.size)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">Type Stream</span>
                    <span className="font-semibold text-slate-800 block truncate" title={previewFile.mimeType}>
                      {previewFile.isFolder ? 'System Folder' : previewFile.mimeType}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">Workspace Directory</span>
                    <span className="font-semibold text-slate-800 block truncate">
                      {previewFile.parentId ? (initialFiles.find(f => f.id === previewFile.parentId)?.name || 'Subfolder') : 'S3 Root Workspace'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">Permission Scope</span>
                    <span className="font-semibold text-slate-800 block">
                      {previewFile.sharedWith.length > 0 ? `${previewFile.sharedWith.length} Users` : 'Dedicated Private'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">Timeline Created</span>
                    <span className="font-semibold text-slate-850 text-[11px] block">
                      {new Date(previewFile.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">Ownership Authority</span>
                    <span className="font-semibold text-slate-850 text-[11px] block truncate" title={`${previewFile.ownerName} (${previewFile.ownerEmail})`}>
                      {previewFile.ownerName || 'Console Admin'}
                    </span>
                  </div>
                </div>

                {/* Collaborators list */}
                <div className="border-t border-slate-100 pt-5">
                  {previewFile.sharedWith.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">Collaborator Network</span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {previewFile.sharedWith.map((su, sidx) => (
                          <span key={sidx} className="inline-flex items-center gap-1.5 bg-blue-50/70 border border-blue-100/50 px-2.5 py-1 rounded-full text-xs font-bold text-blue-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            <span className="max-w-[120px] truncate">{su.email}</span>
                            <span className="opacity-60 text-[9.5px] uppercase font-mono">({su.permission})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 bg-slate-50 border border-slate-105 p-3.5 rounded-2xl">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">Sharing Scope Status</span>
                      <span className="inline-flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Private Access (Only owner can read & download representational model)</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Interactive control action row */}
                <div className="flex space-x-2.5 pt-5 border-t border-slate-150">
                  <button
                    onClick={() => handleToggleStar(previewFile.id)}
                    className="px-4 py-3 bg-slate-50 hover:bg-[#FFFDF5] text-slate-655 hover:text-amber-500 active:scale-[0.97] border border-slate-200/50 hover:border-amber-200 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs"
                    title="Toggle Favorite Star"
                  >
                    <Star className={`w-4 h-4 ${previewFile.isStarred ? 'text-amber-500 fill-current' : ''}`} />
                    <span>{previewFile.isStarred ? 'Starred' : 'Star'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShareFile(previewFile);
                      setPreviewFile(null);
                    }}
                    className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-650 hover:text-cyan-600 active:scale-[0.97] border border-slate-250/50 hover:border-cyan-200 rounded-2xl transition-all cursor-pointer flex items-center justify-center"
                    title="Configure Share Settings"
                  >
                    <Share2 className="w-4 h-4 text-cyan-600" />
                  </button>

                  {!previewFile.isFolder ? (
                    <button
                      onClick={() => handleDownload(previewFile)}
                      className="flex-1 py-3 bg-blue-650 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-bold text-xs text-white rounded-2xl shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Download className="w-4 h-4" /> Download File
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onSelectFolder(previewFile.id);
                        setPreviewFile(null);
                      }}
                      className="flex-1 py-3 bg-blue-650 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-bold text-xs text-white rounded-2xl shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Folder className="w-4 h-4" /> Open Folder
                    </button>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
