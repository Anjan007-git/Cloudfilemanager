import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Download, Star, Share2, Play, Pause, Volume2, VolumeX, Maximize2, 
  ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, FileText, 
  Image, Film, Music, Archive, File, Printer, Loader2, Sparkles, AlertCircle
} from 'lucide-react';
import { CloudFile } from '../types.js';
import { apiFetch, getApiUrl } from '../firebase.js';

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

  // PDF.js Engine States
  const [pdfjsLoaded, setPdfjsLoaded] = useState<boolean>(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfRenderTaskRef = useRef<any>(null);

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

  const fileUrl = getApiUrl(`/api/files/download/${file.id}?token=${token}`);

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

    setPdfDoc(null);
    setCurrentPage(1);
    setNumPages(0);
    setPdfError(null);
    setIsPdfLoading(isPDF);

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

  // Dynamically load PDF.js client renderer from Cloudflare CDN
  useEffect(() => {
    const nameLower = file.name.toLowerCase();
    const mimeLower = file.mimeType.toLowerCase();
    const isPDF = mimeLower.includes('pdf') || nameLower.endsWith('.pdf');
    if (!isPDF) return;

    if ((window as any).pdfjsLib) {
      setPdfjsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.async = true;
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        setPdfjsLoaded(true);
      }
    };
    script.onerror = () => {
      setPdfError('Failed to load local HTML5 PDF helper libraries from global CDN network.');
      setIsPdfLoading(false);
    };
    document.body.appendChild(script);
  }, [file.id]);

  // Load PDF document nodes once script is injected
  useEffect(() => {
    const nameLower = file.name.toLowerCase();
    const mimeLower = file.mimeType.toLowerCase();
    const isPDF = mimeLower.includes('pdf') || nameLower.endsWith('.pdf');
    if (!isPDF || !pdfjsLoaded) return;

    let active = true;
    setIsPdfLoading(true);
    setPdfError(null);

    const pdfjsLib = (window as any).pdfjsLib;
    const loadingTask = pdfjsLib.getDocument(fileUrl);

    loadingTask.promise.then((pdfDocumentInstance: any) => {
      if (!active) return;
      setPdfDoc(pdfDocumentInstance);
      setNumPages(pdfDocumentInstance.numPages);
      setCurrentPage(1);
      setIsPdfLoading(false);
    }).catch((err: any) => {
      if (!active) return;
      console.error('Core PDF.js integration parsed rejection:', err);
      setPdfError('Encountered file decryption/corruption. Please download this file directly or open in a new tab.');
      setIsPdfLoading(false);
    });

    return () => {
      active = false;
    };
  }, [pdfjsLoaded, fileUrl, file.id]);

  // Render current pdf page frame on physical context canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let active = true;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    pdfDoc.getPage(currentPage).then((page: any) => {
      if (!active) return;

      // Cancel any ongoing render task to avoid frame interleaving
      if (pdfRenderTaskRef.current) {
        try {
          pdfRenderTaskRef.current.cancel();
        } catch (_) {}
      }

      const viewport = page.getViewport({ scale: 1.4 * zoomLevel });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);
      pdfRenderTaskRef.current = renderTask;

      renderTask.promise.then(() => {
        if (active) {
          pdfRenderTaskRef.current = null;
        }
      }).catch((err: any) => {
        if (err.name === 'RenderingCancelledException') {
          return;
        }
        console.error('PDF frame draw cycle failed:', err);
      });
    }).catch((err: any) => {
      console.error('PDF.js segment read failure:', err);
    });

    return () => {
      active = false;
    };
  }, [pdfDoc, currentPage, zoomLevel]);

  const loadTextContent = async () => {
    setIsTextLoading(true);
    setTextError(null);
    try {
      const response = await apiFetch(fileUrl);
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
            <div className="w-full h-full flex items-center justify-center p-4">
              {file.name.toLowerCase().endsWith('.pdf') || file.mimeType.toLowerCase().includes('pdf') ? (
                isPdfLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3.5">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Decrypting & rendering PDF pages...</span>
                  </div>
                ) : pdfError ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-3xl max-w-md shadow-sm space-y-5 text-center">
                    <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-display font-black text-slate-800 text-sm">Inline Preview Blocked</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Browser sandbox security rules prevent inline document viewers from loading. Open the document inside a secure secondary tab to view natively.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 w-full">
                      <a 
                        href={fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-center"
                      >
                        <Maximize2 className="w-3.5 h-3.5" /> Open in New Tab
                      </a>
                      <button 
                        onClick={() => onDownload(file)}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold text-xs rounded-xl transition-all border border-slate-200 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download PDF
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex flex-col items-center justify-center w-full max-h-[70vh] overflow-hidden">
                    <div className="flex-1 w-full flex items-center justify-center overflow-auto p-2" style={{ maxHeight: '58vh' }}>
                      <canvas 
                        ref={canvasRef} 
                        className="max-w-full h-auto shadow-xl rounded-xl bg-white border border-slate-200/80" 
                      />
                    </div>

                    <div className="mt-4 flex items-center space-x-4 bg-white/95 border border-slate-200/80 backdrop-blur-md rounded-full px-5 py-2.5 shadow-lg text-slate-650 text-xs font-bold select-none shrink-0 border border-slate-200 shadow-slate-100">
                      <button 
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className="hover:text-slate-950 hover:bg-slate-100 p-1 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <span className="font-mono text-xs uppercase tracking-wider text-slate-450 px-1 font-extrabold">
                        Page <span className="text-slate-900 font-black">{currentPage}</span> of <span className="text-slate-800 font-bold">{numPages}</span>
                      </span>

                      <button 
                        disabled={currentPage >= numPages}
                        onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                        className="hover:text-slate-950 hover:bg-slate-100 p-1 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
                        title="Next Page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <div className="h-4 w-px bg-slate-200" />

                      <button 
                        onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.2))} 
                        className="hover:text-slate-900 p-0.5 rounded cursor-pointer transition-all"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono font-black text-slate-500 w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
                      <button 
                        onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))} 
                        className="hover:text-slate-900 p-0.5 rounded cursor-pointer transition-all"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      
                      <button 
                        onClick={() => setZoomLevel(1)} 
                        className="hover:text-blue-600 hover:underline text-[10px] uppercase font-bold tracking-wider px-1 cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-3xl max-w-md shadow-lg space-y-5 text-center">
                  <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                    <FileText className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1.5 px-1">
                    <h4 className="font-display font-black text-slate-800 text-sm">{file.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Sandbox nesting rules block iframe rendering of Office documents. Click below to view natively in a safe individual viewport or tab.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 w-full">
                    <a 
                      href={fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-center"
                    >
                      <Maximize2 className="w-3.5 h-3.5" /> Open in New Tab
                    </a>
                    <button 
                      onClick={() => onDownload(file)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 hover:text-slate-905 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download File
                    </button>
                  </div>
                </div>
              )}
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
