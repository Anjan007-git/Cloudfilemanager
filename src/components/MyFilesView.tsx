import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, File, ChevronRight, Grid, List, MoreVertical, Star, Trash2, Download, 
  Share2, Edit3, Eye, FileText, Image, Film, Music, Archive, Move, Copy, Plus, 
  ArrowUp, Search, SlidersHorizontal, ChevronDown, Check, X, ShieldAlert, Key, FolderPlus,
  Play, Lock, Loader2, PlayCircle, ToggleLeft, Activity, Trash
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
  
  // Views layout settings
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Search parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMimeFilter, setActiveMimeFilter] = useState<string>(''); // 'image', 'pdf', etc
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Interactive Modals and Actions triggers
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState<CloudFile | null>(null);
  
  // Context action popup menu
  const [activeContextId, setActiveContextId] = useState<string | null>(null);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  // Rename Dialog popup
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Move Dialog configurations
  const [moveId, setMoveId] = useState<string | null>(null);
  const [targetParentId, setTargetParentId] = useState<string | 'null'>('null');

  // Sharing Dialog configurations
  const [shareFile, setShareFile] = useState<CloudFile | null>(null);
  const [newShareEmail, setNewShareEmail] = useState('');
  const [newSharePerm, setNewSharePerm] = useState<'viewer' | 'editor' | 'download_only'>('viewer');
  const [sharedEmailList, setSharedEmailList] = useState<SharedUser[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [pwdEnabled, setPwdEnabled] = useState(false);
  const [pwdValue, setPwdValue] = useState('');
  const [expiresAtValue, setExpiresAtValue] = useState('');

  // Drag and drop states
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Active Upload Queue States
  const [uploadQueue, setUploadQueue] = useState<any[]>([]);

  // Format Helper for file sizes
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Determine Mime Group Icons automatically
  const getFileIcon = (file: CloudFile) => {
    if (file.isFolder) return <Folder className="w-5 h-5 text-indigo-500 fill-indigo-500/10" />;
    const mime = file.mimeType.toLowerCase();
    if (mime.startsWith('image/')) return <Image className="w-5 h-5 text-sky-500" />;
    if (mime.includes('/pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mime.startsWith('video/')) return <Film className="w-5 h-5 text-purple-500" />;
    if (mime.startsWith('audio/')) return <Music className="w-5 h-5 text-pink-500" />;
    if (mime.includes('zip') || mime.includes('tar') || mime.includes('archive')) return <Archive className="w-5 h-5 text-amber-500" />;
    return <FileText className="w-5 h-5 text-slate-500" />;
  };

  // Filter and sort workspace items based on user inputs
  const currentFolderFiles = initialFiles.filter(item => {
    // Exclude trashed elements from the standard folder paths explorer views
    if (item.isTrashed) return false;
    
    // If there is an active global search query string, skip local folderId limits
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    }
    
    // Otherwise limit representation to files belonging to this parent folderId directory
    return item.parentId === selectedFolderId;
  });

  // Filter by Type
  const filteredAndSortedFiles = currentFolderFiles.filter(item => {
    if (!activeMimeFilter) return true;
    if (item.isFolder) return false; // exclude directory folders from category filters
    
    const mime = item.mimeType.toLowerCase();
    if (activeMimeFilter === 'image') return mime.startsWith('image/');
    if (activeMimeFilter === 'pdf') return mime.includes('/pdf');
    if (activeMimeFilter === 'document') {
      return mime.includes('word') || mime.includes('excel') || mime.includes('presentation') || mime.includes('officedocument') || mime.includes('text') || mime.includes('pdf');
    }
    if (activeMimeFilter === 'zip') return mime.includes('zip') || mime.includes('tar') || mime.includes('rar') || mime.includes('archive');
    return true;
  });

  // Sort
  filteredAndSortedFiles.sort((a, b) => {
    // Folders always pushed to the top for pristine explorer layouts
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

  // Hierarchy Nav Breadcrumbs calculation
  const getBreadcrumbs = () => {
    const list: { id: string | null; name: string }[] = [{ id: null, name: 'My Workspace' }];
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

  // 1. Action: Create Folder
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

  // 2. Action: Duplicate file
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

  // 3. Action: Star favorites
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

  // 4. Action: Move elements
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

  // 5. Action: Rename elements
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

  // 6. Action: Relocate elements to trash
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

  // 7. Action: Sharing Links Configuration
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
    // Simple email format check
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
      // 1. Save general emails list
      const shareResp = await fetch(`/api/files/share/${shareFile.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sharedWith: sharedEmailList })
      });

      if (!shareResp.ok) throw new Error('Failed sharing item with target email lists');

      // 2. Save public Link properties
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

  // 8. Action: Direct file downloading triggers
  const handleDownload = (file: CloudFile) => {
    if (file.isFolder) {
      alert('Bulk directory zip downloading complies with Pro membership tier.');
      return;
    }
    const downloadUrl = `/api/files/download/${file.id}?token=${token}`;
    window.open(downloadUrl, '_blank');
  };

  // 9. Files drag & drop triggers
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

  // Main high performance upload pipeline supporting queues and pause simulators
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

      // Execute actual POST file to Express server via boundary multi-parts
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

        // Mark progress completed
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
      className="space-y-6 font-sans relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      id="my-files-explorer-root"
    >
      {/* Absolute overlay for drag and drop active status */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-indigo-600/10 border-4 border-dashed border-indigo-500 rounded-3xl z-40 flex flex-col items-center justify-center space-y-3 pointer-events-none backdrop-blur-sm"
          >
            <div className="p-4 bg-white rounded-full text-indigo-600 shadow-xl">
              <ArrowUp className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-indigo-900 font-display">Drop elements anywhere to upload</h3>
            <p className="text-xs text-indigo-600 font-medium">Auto-upload begins immediately inside active folder paths</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden system file inputs */}
      <input 
        type="file" 
        multiple
        ref={fileInputRef} 
        onChange={handleFileInputChange}
        className="hidden" 
      />

      {/* 1. Header Toolbar Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/50 pb-5">
        {/* Hierarchy Breadcrumbs */}
        <div className="flex items-center space-x-2 overflow-x-auto py-1 scrollbar-none">
          {getBreadcrumbs().map((b, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              <button 
                id={`breadcrumb-${idx}`}
                onClick={() => onSelectFolder(b.id)}
                className={`text-sm font-semibold whitespace-nowrap transition-colors hover:text-indigo-600 ${
                  b.id === selectedFolderId ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {b.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Layout Filters and views choices */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold" />
            <input 
              id="explorer-search"
              type="text" 
              placeholder="Search active folder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9.5 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all text-slate-800 w-full sm:w-48 placeholder-slate-400"
            />
          </div>

          <button 
            id="trigger-file-select"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center space-x-1.5 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white rounded-xl shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Files</span>
          </button>

          <button 
            id="trigger-folder-modal"
            onClick={() => setIsNewFolderOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 font-semibold text-xs text-slate-700 rounded-xl"
          >
            <FolderPlus className="w-4 h-4 text-slate-500" />
            <span>Folder</span>
          </button>

          {/* Grid/List switch toggle */}
          <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
            <button 
              id="view-grid-toggle"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid Layout"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              id="view-list-toggle"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="List Layout"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Upload queue notifications logs drawer */}
      {uploadQueue.length > 0 && (
        <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 border border-slate-800 space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <p className="font-semibold text-slate-100 uppercase tracking-wider font-mono text-[10px]">Active Upload Monitor</p>
            </div>
            <button 
              onClick={handleClearCompletedUploads}
              className="text-indigo-400 font-bold hover:underline"
            >
              Clear Completed
            </button>
          </div>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-2">
            {uploadQueue.map(item => (
              <div key={item.id} className="flex items-center justify-between text-xs bg-slate-800/50 p-2.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center space-x-3 w-2/3">
                  <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div className="truncate">
                    <p className="font-semibold text-slate-200 truncate">{item.name}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{formatBytes(item.size)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {item.status === 'uploading' && (
                    <span className="text-indigo-400 font-mono font-bold animate-pulse">{item.progress}%</span>
                  )}
                  {item.status === 'completed' && (
                    <span className="text-emerald-500 font-mono font-semibold">Completed</span>
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

      {/* 3. Empty State or Workspace Explorer Panels */}
      {filteredAndSortedFiles.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center space-y-4 max-w-2xl mx-auto my-12" id="explorer-empty">
          <div className="shadow-lg shadow-indigo-600/5 bg-slate-50 p-4 rounded-full inline-flex text-slate-400">
            <Folder className="w-12 h-12" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-slate-800 text-lg">Empty Cloud Directory</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              There are no matching files or directories inside this location folder. Drag and Drop your assets here to execute an encrypted cloud upload.
            </p>
          </div>
          <div className="pt-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center space-x-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-slate-900 font-bold text-xs text-white rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Select File from Machine</span>
            </button>
          </div>
        </div>
      ) : (
        /* Layout Rendering */
        viewMode === 'grid' ? (
          /* Grid View Layout Dashboard */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="explorer-grid">
            {filteredAndSortedFiles.map(item => {
              const isMenuOpen = activeContextId === item.id;
              return (
                <div 
                  key={item.id}
                  className="bg-white border border-slate-200/60 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-600/5 hover:-translate-y-0.5 rounded-2xl p-4.5 transition-all relative flex flex-col justify-between h-40"
                  onDoubleClick={() => item.isFolder && onSelectFolder(item.id)}
                >
                  <div className="flex items-start justify-between">
                    <button 
                      onClick={() => item.isFolder && onSelectFolder(item.id)}
                      className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      {getFileIcon(item)}
                    </button>
                    
                    {/* Star status indicator */}
                    <div className="flex items-center space-x-1.5">
                      {item.isStarred && <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />}
                      
                      {/* Interactive metadata actions toggle */}
                      <div className="relative">
                        <button 
                          onClick={() => setActiveContextId(isMenuOpen ? null : item.id)}
                          className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          {loadingActionId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                          ) : (
                            <MoreVertical className="w-4 h-4" />
                          )}
                        </button>

                        {/* Dropdown Options */}
                        <AnimatePresence>
                          {isMenuOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setActiveContextId(null)} />
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50 text-xs text-slate-700"
                              >
                                {item.isFolder ? (
                                  <button onClick={() => { onSelectFolder(item.id); setActiveContextId(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold text-slate-800 flex items-center gap-2">
                                    <Folder className="w-3.5 h-3.5" /> Open Folder
                                  </button>
                                ) : (
                                  <button onClick={() => { handleDownload(item); setActiveContextId(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 font-semibold text-emerald-700 flex items-center gap-2">
                                    <Download className="w-3.5 h-3.5" /> Download file
                                  </button>
                                )}

                                <button onClick={() => handleToggleStar(item.id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold text-slate-800 flex items-center gap-2">
                                  <Star className="w-3.5 h-3.5 text-slate-400" /> Star Item
                                </button>

                                <button onClick={() => { handleOpenShare(item); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold text-slate-800 flex items-center gap-2">
                                  <Share2 className="w-3.5 h-3.5 text-slate-400" /> Sharing Links
                                </button>

                                <button onClick={() => { setRenameId(item.id); setRenameValue(item.name); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold text-slate-800 flex items-center gap-2">
                                  <Edit3 className="w-3.5 h-3.5 text-slate-400" /> Rename
                                </button>

                                <button onClick={() => { setMoveId(item.id); setTargetParentId(item.parentId || 'null'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold text-slate-800 flex items-center gap-2">
                                  <Move className="w-3.5 h-3.5 text-slate-400" /> Move location
                                </button>

                                {!item.isFolder && (
                                  <button onClick={() => handleDuplicate(item.id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold text-slate-800 flex items-center gap-2">
                                    <Copy className="w-3.5 h-3.5 text-slate-400" /> Duplicate
                                  </button>
                                )}

                                <div className="border-t border-slate-100 my-1"></div>
                                
                                <button onClick={() => handleDeleteFolderOrFile(item)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 font-semibold text-red-600 flex items-center gap-2">
                                  <Trash2 className="w-3.5 h-3.5" /> Move to Trash
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  <div className="truncate">
                    <button 
                      onClick={() => item.isFolder ? onSelectFolder(item.id) : handleDownload(item)}
                      className="font-display font-semibold text-slate-800 text-[13px] hover:text-indigo-600 text-left truncate block w-full outline-none cursor-pointer"
                    >
                      {item.name}
                    </button>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                      <span>{item.isFolder ? 'Folder' : formatBytes(item.size)}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View Layout Dashboard */
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto" id="explorer-list">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50 text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left">Document Title</th>
                  <th scope="col" className="px-6 py-3.5 text-left">Created Date</th>
                  <th scope="col" className="px-6 py-3.5 text-left">Size Index</th>
                  <th scope="col" className="px-6 py-3.5 text-left">Shared with</th>
                  <th scope="col" className="px-6 py-3.5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAndSortedFiles.map(item => {
                  const isMenuOpen = activeContextId === item.id;
                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-55 transition-colors group"
                      onDoubleClick={() => item.isFolder && onSelectFolder(item.id)}
                    >
                      <td className="px-6 py-4 flex items-center space-x-3 w-1/3">
                        <button 
                          onClick={() => item.isFolder && onSelectFolder(item.id)}
                          className="p-1.5 bg-slate-100 rounded-lg text-slate-500 group-hover:text-indigo-600 cursor-pointer"
                        >
                          {getFileIcon(item)}
                        </button>
                        <button 
                          onClick={() => item.isFolder ? onSelectFolder(item.id) : handleDownload(item)}
                          className="font-semibold text-slate-800 hover:text-indigo-600 truncate max-w-sm text-left truncate cursor-pointer"
                        >
                          {item.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono">
                        {item.isFolder ? '--' : formatBytes(item.size)}
                      </td>
                      <td className="px-6 py-4">
                        {item.sharedWith.length === 0 ? (
                          <span className="text-[10px] text-slate-400">Only Me</span>
                        ) : (
                          <div className="flex -space-x-1 overflow-hidden" title={item.sharedWith.map(s => s.email).join(', ')}>
                            {item.sharedWith.map((su, idx) => (
                              <div key={idx} className="h-5 w-5 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[8px] font-bold text-slate-700">
                                {su.email.substring(0, 2).toUpperCase()}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button 
                          onClick={() => setActiveContextId(isMenuOpen ? null : item.id)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
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
                                className="absolute right-6 top-10 mt-1 w-44 bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50 text-xs text-slate-700 text-left"
                              >
                                {item.isFolder ? (
                                  <button onClick={() => { onSelectFolder(item.id); setActiveContextId(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold text-slate-800 flex items-center gap-2">
                                    <Folder className="w-3.5 h-3.5" /> Open Folder
                                  </button>
                                ) : (
                                  <button onClick={() => { handleDownload(item); setActiveContextId(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 font-semibold text-emerald-700 flex items-center gap-2">
                                    <Download className="w-3.5 h-3.5" /> Download file
                                  </button>
                                )}

                                <button onClick={() => handleToggleStar(item.id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold text-slate-800 flex items-center gap-2">
                                  <Star className="w-3.5 h-3.5 text-slate-400" /> Star Item
                                </button>

                                <button onClick={() => { handleOpenShare(item); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold text-slate-800 flex items-center gap-2">
                                  <Share2 className="w-3.5 h-3.5 text-slate-400" /> Sharing Links
                                </button>

                                <button onClick={() => { setRenameId(item.id); setRenameValue(item.name); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold text-slate-800 flex items-center gap-2">
                                  <Edit3 className="w-3.5 h-3.5 text-slate-400" /> Rename
                                </button>

                                <button onClick={() => { setMoveId(item.id); setTargetParentId(item.parentId || 'null'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold text-slate-800 flex items-center gap-2">
                                  <Move className="w-3.5 h-3.5 text-slate-400" /> Move location
                                </button>

                                {!item.isFolder && (
                                  <button onClick={() => handleDuplicate(item.id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold text-slate-800 flex items-center gap-2">
                                    <Copy className="w-3.5 h-3.5 text-slate-400" /> Duplicate
                                  </button>
                                )}

                                <div className="border-t border-slate-100 my-1"></div>
                                
                                <button onClick={() => handleDeleteFolderOrFile(item)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 font-semibold text-red-600 flex items-center gap-2">
                                  <Trash2 className="w-3.5 h-3.5" /> Move to Trash
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

      {/* ======================================================== */}
      {/* 4. Overlay Modal: Create Folder Form */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-sm w-full space-y-6 shadow-2xl"
          >
            <div className="text-center">
              <h3 className="font-display font-bold text-slate-800 text-lg">Create Directory Folder</h3>
              <p className="text-xs text-slate-400 mt-1">Folders let you catalog and share relative files efficiently.</p>
            </div>
            <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
              <input 
                id="create-folder-name"
                type="text" 
                required
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enterprise Reports"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium text-slate-800"
              />
              <div className="flex space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsNewFolderOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-250 font-semibold text-xs text-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  id="create-folder-submit"
                  type="submit"
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-slate-900 font-bold text-xs text-white rounded-xl shadow-md"
                >
                  Create Directory
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 5. Overlay Modal: Rename Element Form */}
      {renameId && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full space-y-6 shadow-2xl"
          >
            <div className="text-center">
              <h3 className="font-display font-bold text-slate-800 text-lg">Modify Element Label</h3>
              <p className="text-xs text-slate-400 mt-1">Type name suffix properties securely.</p>
            </div>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input 
                id="rename-element-input"
                type="text" 
                required
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium text-slate-800"
              />
              <div className="flex space-x-3">
                <button 
                  type="button" 
                  onClick={() => setRenameId(null)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  id="rename-element-submit"
                  type="submit"
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-slate-900 font-bold text-xs text-white rounded-xl"
                >
                  Apply Rename
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 6. Overlay Modal: Move Elements Location */}
      {moveId && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-sm w-full space-y-6 shadow-2xl"
          >
            <div className="text-center">
              <h3 className="font-display font-bold text-slate-800 text-lg">Relocate Element Location</h3>
              <p className="text-xs text-slate-400 mt-1">Select new target parent directory folder</p>
            </div>
            <form onSubmit={handleMoveSubmit} className="space-y-4">
              <select 
                value={targetParentId}
                onChange={(e) => setTargetParentId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium text-slate-800"
              >
                <option value="null">My Workspace (Root)</option>
                {initialFiles.filter(f => f.isFolder && f.id !== moveId && !f.isTrashed).map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <div className="flex space-x-3">
                <button 
                  type="button" 
                  onClick={() => setMoveId(null)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 font-semibold text-xs text-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  id="move-element-submit"
                  type="submit"
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-slate-900 font-bold text-xs text-white rounded-xl"
                >
                  Move Element
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 7. Overlay Modal: Comprehensive Share Link Controls */}
      {shareFile && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4" id="share-modal-container">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-600 font-extrabold block">Secure Encryption Controls</span>
              <h3 className="font-display font-bold text-slate-800 text-lg">Sharing Properties: {shareFile.name}</h3>
              <p className="text-xs text-slate-400 mt-1">Establish security parameters to share files securely.</p>
            </div>

            {/* Part A: Private Email Permissions list */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">Collaborator Permissions</span>
              
              <div className="flex items-center gap-2">
                <input 
                  type="email"
                  placeholder="colleague@enterprise.com"
                  value={newShareEmail}
                  onChange={(e) => setNewShareEmail(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 font-medium text-slate-800"
                />
                <select 
                  value={newSharePerm}
                  onChange={(e: any) => setNewSharePerm(e.target.value)}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="download_only">Download-Only</option>
                </select>
                <button 
                  type="button" 
                  onClick={handleAddShareEmail}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
                >
                  Add
                </button>
              </div>

              {/* Members lists representation */}
              <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
                {sharedEmailList.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No explicit emails configured yet.</p>
                ) : (
                  sharedEmailList.map((su, index) => (
                    <div key={index} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div>
                        <span className="font-semibold text-slate-700 block">{su.email}</span>
                        <span className="text-[9px] uppercase font-mono text-indigo-600 font-bold">{su.permission.replace('_', ' ')}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveShareEmail(su.email)}
                        className="p-1 rounded hover:bg-red-50 text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Part B: Secure Public Direct Share Link Option */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">External Secure Share Links URL</span>
              
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <span className="font-semibold text-slate-800 text-xs block">Toggle Public Access Links</span>
                  <span className="text-[10px] text-slate-400">Generate a signed URL accessible by external clients.</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${isPublic ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`bg-white w-5.5 h-5.5 rounded-full shadow-md transform duration-300 ${isPublic ? 'translate-x-5.5' : ''}`} />
                </button>
              </div>

              {isPublic && (
                <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  {/* Password Lock configuration */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 text-xs block">Password Verification Locked</span>
                      <span className="text-[10px] text-slate-400">Force viewer to type key phrase to resolve downloads.</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setPwdEnabled(!pwdEnabled)}
                      className={`w-10 h-5.5 rounded-full p-0.5 transition-colors focus:outline-none ${pwdEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform duration-300 ${pwdEnabled ? 'translate-x-4.5' : ''}`} />
                    </button>
                  </div>

                  {pwdEnabled && (
                    <input 
                      type="text"
                      placeholder="AccessPassword2026"
                      value={pwdValue}
                      onChange={(e) => setPwdValue(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 text-slate-800 font-semibold"
                    />
                  )}

                  {/* Expire settings */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 mb-1">Link Expirations Date</label>
                    <input 
                      type="date"
                      value={expiresAtValue}
                      onChange={(e) => setExpiresAtValue(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 font-medium text-slate-800"
                    />
                  </div>

                  {/* Print direct download path helper */}
                  <div className="bg-white p-2.5 rounded-xl border border-dotted border-slate-200 text-[10px] text-indigo-700 font-mono break-all font-semibold">
                    <span>{window.location.origin}/api/files/download/{shareFile.id}{pwdEnabled && pwdValue ? `?pwd=${pwdValue}` : ''}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setShareFile(null)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Close Controls
              </button>
              <button 
                id="share-save-btn"
                type="button"
                onClick={handleSaveShareConfig}
                className="w-1/2 py-2.5 bg-indigo-600 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Save Permissions
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
