import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Download, Star, Share2, Play, Pause, Volume2, VolumeX, Maximize2, 
  ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, FileText, 
  Image, Film, Music, Archive, File, Printer, Loader2, Sparkles, AlertCircle
} from 'lucide-react';
import { CloudFile } from '../types.js';

interface FilePreviewModalProps {
  file: CloudFile;
  onClose: () => void;
  token: string;
  onDownload: (file: CloudFile) => void;
  onToggleStar: (id: string) => void;
  allFiles: CloudFile[];
  onNavigateFile: (file: CloudFile) => void;
}

export default function FilePreviewModal({
  file,
  onClose,
  token,
  onDownload,
  onToggleStar,
  allFiles,
  onNavigateFile
}: FilePreviewModalProps) {
  // Navigation Index calculation
  const siblingFiles = allFiles.filter(f => !f.isFolder && !f.isTrashed);
  const currentIndex = siblingFiles.findIndex(f => f.id === file.id);
  const prevFile = currentIndex > 0 ? siblingFiles[currentIndex - 1] : null;
  const nextFile = currentIndex < siblingFiles.length - 1 ? siblingFiles[currentIndex + 1] : null;

  // Zoom and layout states
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeViewer, setActiveViewer] = useState<'native' | 'google' | 'ms'>('native');

  // Text/Code files content state
  const [textContent, setTextContent] = useState<string>('');
  const [isTextLoading, setIsTextLoading] = useState<boolean>(false);
  const [textError, setTextError] = useState<string | null>(null);

  // Audio/Video player ref and state
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const fileUrl = `/api/files/download/${file.id}?token=${token}`;

  // Reset states on file change
  useEffect(() => {
    setZoomLevel(1);
    setRotation(0);
    setTextContent('');
    setTextError(null);
    setIsTextLoading(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    const nameLower = file.name.toLowerCase();
    const mimeLower = file.mimeType.toLowerCase();
    const isPDF = mimeLower.includes('pdf') || nameLower.endsWith('.pdf');
    const isOffice = mimeLower.includes('word') || mimeLower.includes('excel') || mimeLower.includes('powerpoint') || mimeLower.includes('sheet') || mimeLower.includes('presentation') ||
                     nameLower.endsWith('.doc') || nameLower.endsWith('.docx') || nameLower.endsWith('.xls') || nameLower.endsWith('.xlsx') || nameLower.endsWith('.ppt') || nameLower.endsWith('.pptx');

    if (isPDF) {
      setActiveViewer('native');
    } else if (isOffice) {
      setActiveViewer('ms');
    } else {
      setActiveViewer('google');
    }

    const isTextOrCode = isTextType(file.mimeType) || isCodeType(file.name);
    if (isTextOrCode) {
      loadTextContent();
    }
  }, [file.id]);

  const loadTextContent = async () => {
    setIsTextLoading(true);
    setTextError(null);
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch text content.');
      }
      const text = await response.text();
      setTextContent(text);
    } catch (err: any) {
      console.error(err);
      setTextError(err.message || 'Error parsing text metadata.');
    } finally {
      setIsTextLoading(false);
    }
  };

  const isTextType = (mime: string) => {
    const m = mime.toLowerCase();
    return m.startsWith('text/') || m.includes('json') || m.includes('xml') || m.includes('md') || m.includes('csv');
  };

  const isCodeType = (name: string) => {
    const ext = name.substring(name.lastIndexOf('.') + 1).toLowerCase();
    return ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'c', 'cpp', 'sh', 'sql', 'go', 'rs'].includes(ext);
  };

  const isDocumentType = (mime: string, name: string) => {
    const m = mime.toLowerCase();
    const n = name.toLowerCase();
    return m.includes('pdf') || m.includes('word') || m.includes('document') || m.includes('excel') || m.includes('sheet') || m.includes('powerpoint') || m.includes('presentation') ||
           n.endsWith('.pdf') || n.endsWith('.doc') || n.endsWith('.docx') || n.endsWith('.xls') || n.endsWith('.xlsx') || n.endsWith('.ppt') || n.endsWith('.pptx');
  };

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Printing support (specifically for PDFs and images)
  const handlePrint = () => {
    const isPDF = file.mimeType.toLowerCase().includes('pdf');
    const isImg = file.mimeType.toLowerCase().startsWith('image/');
    if (isPDF || isImg) {
      const printWindow = window.open(fileUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    } else {
      window.print();
    }
  };

  // Video/Audio handlers
  const handlePlayPause = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play().catch(e => console.error(e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (mediaRef.current) {
      mediaRef.current.volume = value;
      mediaRef.current.muted = value === 0;
      setIsMuted(value === 0);
    }
  };

  const handleToggleMute = () => {
    if (mediaRef.current) {
      const nextMuted = !isMuted;
      mediaRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Get Syntax Highlighting style or simple formatting
  const renderCodeFormatted = () => {
    const ext = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase();
    return (
      <pre className="font-mono text-xs text-slate-100 bg-[#0F172A] p-6 rounded-2xl overflow-auto w-full leading-relaxed border border-slate-800/80 max-h-[50vh] text-left">
        <code className={`language-${ext}`}>{textContent}</code>
      </pre>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-hidden font-sans"
      id="file-preview-modal-root"
    >
      {/* Background close overlay */}
      <div className="absolute inset-0 cursor-zoom-out" onClick={onClose} />

      {/* Navigation Arrow Left */}
      {prevFile && (
        <button
          onClick={() => onNavigateFile(prevFile)}
          className="absolute left-4 sm:left-8 z-50 p-3 rounded-full bg-white hover:bg-slate-50 text-slate-700 shadow-lg border border-slate-200 transition-all active:scale-95 cursor-pointer hidden md:flex"
          title={`Prev: ${prevFile.name}`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Navigation Arrow Right */}
      {nextFile && (
        <button
          onClick={() => onNavigateFile(nextFile)}
          className="absolute right-4 sm:right-8 z-50 p-3 rounded-full bg-white hover:bg-slate-50 text-slate-700 shadow-lg border border-slate-200 transition-all active:scale-95 cursor-pointer hidden md:flex"
          title={`Next: ${nextFile.name}`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ type: "tween", ease: "easeOut", duration: 0.12 }}
        className="bg-white border border-slate-250/80 border-slate-200 rounded-3xl max-w-5xl w-full h-[85vh] overflow-hidden shadow-2xl relative z-10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Control Bar */}
        <div className="px-6 py-4.5 border-b border-slate-200/60 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center space-x-3.5 min-w-0">
            <span className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 block shrink-0">
              {file.mimeType.toLowerCase().startsWith('image/') ? <Image className="w-5 h-5" /> :
               file.mimeType.toLowerCase().includes('pdf') ? <FileText className="w-5 h-5" /> :
               file.mimeType.toLowerCase().startsWith('video/') ? <Film className="w-5 h-5" /> :
               file.mimeType.toLowerCase().startsWith('audio/') ? <Music className="w-5 h-5" /> :
               file.mimeType.toLowerCase().includes('zip') ? <Archive className="w-5 h-5" /> :
               <File className="w-5 h-5" />}
            </span>
            <div className="truncate text-left leading-tight">
              <h3 className="font-display font-black text-slate-900 text-sm truncate" title={file.name}>
                {file.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono font-bold tracking-wider mt-0.5">
                {formatBytes(file.size)} • {file.mimeType}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleStar(file.id)}
              className={`p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                file.isStarred 
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20' 
                  : 'bg-white border-slate-200 text-slate-450 hover:text-slate-700 hover:bg-slate-50'
              }`}
              title="Toggle Star"
            >
              <Star className={`w-4 h-4 ${file.isStarred ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => onDownload(file)}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-705 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
              title="Download File"
            >
              <Download className="w-4 h-4" />
            </button>

            {(file.mimeType.toLowerCase().includes('pdf') || file.mimeType.toLowerCase().startsWith('image/')) && (
              <button
                onClick={handlePrint}
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-705 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
                title="Print File"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}

            <div className="h-6 w-px bg-slate-200" />

            <button 
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-all active:scale-95"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Inner Content Area - Flex-1 to adjust space dynamically with soft premium secondary background */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-slate-50/50 relative">
          
          {/* IMAGE PREVIEW */}
          {file.mimeType.toLowerCase().startsWith('image/') && (
            <div className="relative flex flex-col items-center justify-center max-w-full max-h-full">
              <motion.div
                style={{ scale: zoomLevel, rotate: `${rotation}deg` }}
                className="transition-transform duration-100 ease-out flex items-center justify-center"
              >
                <img 
                  src={fileUrl} 
                  alt={file.name} 
                  referrerPolicy="no-referrer"
                  className="max-w-[70vw] max-h-[55vh] object-contain rounded-2xl shadow-xl border border-slate-200 bg-white"
                />
              </motion.div>

              {/* Float controls for Images */}
              <div className="absolute bottom-4 bg-white/95 border border-slate-200/80 backdrop-blur-md rounded-full px-4 py-2 flex items-center space-x-3.5 shadow-lg text-slate-600">
                <button onClick={() => setZoomLevel(prev => Math.max(0.4, prev - 0.2))} className="hover:text-slate-900 cursor-pointer"><ZoomOut className="w-4 h-4" /></button>
                <span className="text-[10px] font-mono font-bold tracking-wider">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.2))} className="hover:text-slate-900 cursor-pointer"><ZoomIn className="w-4 h-4" /></button>
                <div className="h-4 w-px bg-slate-200" />
                <button onClick={() => setRotation(prev => (prev + 90) % 360)} className="hover:text-slate-900 cursor-pointer" title="Rotate"><RotateCcw className="w-4 h-4" /></button>
                <button onClick={() => { setZoomLevel(1); setRotation(0); }} className="hover:text-slate-900 text-xs font-bold cursor-pointer">Reset</button>
              </div>
            </div>
          )}

          {/* PDF & OFFICE DOCUMENTS PREVIEW */}
          {isDocumentType(file.mimeType, file.name) && (
            <div className="w-full h-full flex flex-col rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
              {/* Tab Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50 text-[11px] gap-3 font-sans shrink-0 text-left">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-500">Preview Mode:</span>
                  {(file.mimeType.toLowerCase().includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) && (
                    <button
                      onClick={() => setActiveViewer('native')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${activeViewer === 'native' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
                    >
                      Browser Native Frame
                    </button>
                  )}
                  <button
                    onClick={() => setActiveViewer('google')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${activeViewer === 'google' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    Google Web Viewer
                  </button>
                  {!(file.mimeType.toLowerCase().includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) && (
                    <button
                      onClick={() => setActiveViewer('ms')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${activeViewer === 'ms' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
                    >
                      Office Live Viewer
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">
                  💡 Tip: Slow connection? Try another mode, Open in New Tab, or Download directly.
                </div>
              </div>
              
              {/* iframe Container */}
              <div className="flex-1 bg-slate-50 relative min-h-[300px]">
                {activeViewer === 'native' && (file.mimeType.toLowerCase().includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) && (
                  <iframe 
                    src={`${fileUrl}#toolbar=1`} 
                    title={file.name}
                    className="w-full h-full border-0 absolute inset-0"
                  />
                )}
                {activeViewer === 'google' && (
                  <iframe 
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(window.location.origin + fileUrl)}&embedded=true`} 
                    title={file.name}
                    className="w-full h-full border-0 absolute inset-0 bg-white"
                  />
                )}
                {activeViewer === 'ms' && (
                  <iframe 
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + fileUrl)}`} 
                    title={file.name}
                    className="w-full h-full border-0 absolute inset-0 bg-white"
                  />
                )}
              </div>
            </div>
          )}

          {/* VIDEO PREVIEW */}
          {file.mimeType.toLowerCase().startsWith('video/') && (
            <div className="w-full max-w-3xl flex flex-col items-center justify-center bg-slate-900 rounded-2xl overflow-hidden border border-slate-250 shadow-xl relative group">
              <video 
                ref={mediaRef as any}
                src={fileUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                className="w-full max-h-[50vh] object-contain"
                onClick={handlePlayPause}
              />
              
              {/* Premium Video HUD Player Controls */}
              <div className="absolute bottom-0 inset-x-0 bg-white/95 border-t border-slate-200 p-4 space-y-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col">
                <div className="flex items-center space-x-3">
                  <span className="text-[10px] font-mono font-bold text-slate-500">{formatTime(currentTime)}</span>
                  <input 
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeekChange}
                    className="flex-1 accent-blue-600 h-1 rounded-full cursor-pointer opacity-80 hover:opacity-100 bg-slate-200"
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-500">{formatTime(duration)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={handlePlayPause}
                      className="p-1 px-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>

                    <div className="flex items-center space-x-2">
                      <button onClick={handleToggleMute} className="text-slate-500 hover:text-slate-800 cursor-pointer">
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-20 accent-blue-600 h-1 rounded-full cursor-pointer bg-slate-200"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (mediaRef.current) {
                        mediaRef.current.requestFullscreen().catch(e => console.error(e));
                      }
                    }}
                    className="text-slate-500 hover:text-slate-800 cursor-pointer"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AUDIO PREVIEW */}
          {file.mimeType.toLowerCase().startsWith('audio/') && (
            <div className="bg-white border border-slate-200 p-8 rounded-3xl w-full max-w-md shadow-xl flex flex-col items-center space-y-6">
              <audio 
                ref={mediaRef as any}
                src={fileUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />

              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/10">
                <Music className="w-10 h-10" />
              </div>

              <div className="text-center space-y-1.5 w-full">
                <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 font-extrabold">Audio stream</span>
                <h4 className="font-display font-bold text-slate-900 text-sm truncate px-4" title={file.name}>{file.name}</h4>
                <p className="text-[10px] text-slate-450 font-mono font-bold leading-relaxed">{formatBytes(file.size)}</p>
              </div>

              {/* Progress and controls */}
              <div className="w-full space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-[10px] font-mono font-bold text-slate-450">{formatTime(currentTime)}</span>
                  <input 
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeekChange}
                    className="flex-1 accent-blue-600 h-1 bg-slate-100 rounded-full cursor-pointer"
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-450">{formatTime(duration)}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <button onClick={handleToggleMute} className="text-slate-450 hover:text-slate-700 cursor-pointer">
                      {isMuted ? <VolumeX className="w-4 h-3.5" /> : <Volume2 className="w-4 h-3.5" />}
                    </button>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 accent-blue-600 h-1 bg-slate-100 rounded-full cursor-pointer"
                    />
                  </div>

                  <button 
                    onClick={handlePlayPause}
                    className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>

                  <div className="w-16" /> {/* Spacer */}
                </div>
              </div>
            </div>
          )}

          {/* TEXT OR CODE PREVIEWS */}
          {(isTextType(file.mimeType) || isCodeType(file.name)) && (
            <div className="w-full max-w-4xl h-full flex flex-col bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {isTextLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Parsing file nodes...</span>
                </div>
              ) : textError ? (
                <div className="flex-1 flex flex-col items-center justify-center text-red-500 space-y-3 p-6 text-center">
                  <AlertCircle className="w-8 h-8" />
                  <p className="text-xs font-bold font-mono uppercase tracking-wider">{textError}</p>
                </div>
              ) : (
                <div className="flex-1 overflow-auto text-left leading-relaxed">
                  <pre className="font-mono text-xs text-slate-800 bg-white p-6 rounded-2xl overflow-auto w-full leading-relaxed border border-slate-200 max-h-[50vh] text-left">
                    <code>{textContent}</code>
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* ARCHIVE/ZIP/WORD/OFFICE PREVIEWS */}
          {!file.mimeType.toLowerCase().startsWith('image/') && 
           !file.mimeType.toLowerCase().includes('pdf') && 
           !file.mimeType.toLowerCase().startsWith('video/') && 
           !file.mimeType.toLowerCase().startsWith('audio/') && 
           !(isTextType(file.mimeType) || isCodeType(file.name)) &&
           !isDocumentType(file.mimeType, file.name) && (
            <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl w-full max-w-md shadow-xl space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto shadow-sm">
                {file.mimeType.toLowerCase().includes('zip') ? (
                  <Archive className="w-8 h-8 text-amber-500" />
                ) : (
                  <File className="w-8 h-8 text-blue-500" />
                )}
              </div>

              <div className="space-y-2 px-2">
                <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 font-extrabold block">Resource Information</span>
                <h4 className="font-display font-bold text-slate-900 text-sm truncate" title={file.name}>{file.name}</h4>
                <p className="text-[11px] font-medium text-slate-450 leading-relaxed font-sans">
                  Inline viewport rendering is not supported for this document protocol. Direct download is recommended.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left p-4 bg-slate-50 rounded-2xl text-[11px] font-semibold border border-slate-100">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono tracking-wide uppercase text-slate-400 block font-bold">Class format</span>
                  <span className="text-slate-700 block truncate">{file.mimeType}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono tracking-wide uppercase text-slate-400 block font-bold">Index weight</span>
                  <span className="text-slate-700 block">{formatBytes(file.size)}</span>
                </div>
                <div className="space-y-1 pt-1.5 border-t border-slate-150">
                  <span className="text-[9px] font-mono tracking-wide uppercase text-slate-400 block font-bold">Owner UUID</span>
                  <span className="text-slate-700 block truncate">{file.ownerName || 'Console Admin'}</span>
                </div>
                <div className="space-y-1 pt-1.5 border-t border-slate-150">
                  <span className="text-[9px] font-mono tracking-wide uppercase text-slate-400 block font-bold">Timestamp</span>
                  <span className="text-slate-700 block">{new Date(file.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <button
                onClick={() => onDownload(file)}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md cursor-pointer active:scale-95 transition-all text-center flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download File
              </button>
            </div>
          )}

        </div>

        {/* Bottom Metadata & Info Footer Panel */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs shrink-0 text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-705 font-sans">S3 Multizone Synchronization Safe</span>
          </div>

          <div className="flex items-center space-x-4">
            <p className="font-semibold text-slate-500">
              Uploaded as: <span className="text-slate-800 font-bold">{file.ownerEmail}</span>
            </p>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
