import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Globe,
  ExternalLink,
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  X,
  Maximize2,
  Minimize2,
  GripHorizontal
} from 'lucide-react';
import { toast } from 'sonner';

const POPULAR_PORTS = [
  { port: '3000', label: '3000 (Static / Node)' },
  { port: '5173', label: '5173 (Vite / React)' },
  { port: '8080', label: '8080 (Webpack / Vue)' },
  { port: '8000', label: '8000 (Python / FastAPI)' },
  { port: '5000', label: '5000 (Flask / Express)' },
];

const LivePreviewBar = ({ showPreview, setShowPreview }) => {
  const user = useSelector((state) => state.auth.user);
  const [port, setPort] = useState('3000');
  const [path, setPath] = useState('');
  const [iframeKey, setIframeKey] = useState(0);
  const [viewMode, setViewMode] = useState('responsive'); // 'responsive', 'tablet', 'mobile'
  
  // Resizing state
  const [previewHeight, setPreviewHeight] = useState(340);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const userId = user?.id || user?._id || 'guest';

  const cleanPort = (port || '3000').toString().trim().replace(/[^0-9]/g, '') || '3000';
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  const currentPreviewUrl = `/preview/${userId}${cleanPath}?port=${cleanPort}`;

  const handleOpenNewTab = () => {
    window.open(currentPreviewUrl, '_blank');
  };

  const handleRefreshPreview = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleSelectPort = (selectedPort) => {
    setPort(selectedPort);
    setIframeKey((prev) => prev + 1);
  };

  const toggleMaximize = () => {
    setIsMaximized((prev) => !prev);
  };

  // Drag Resizing Logic
  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e) => {
      if (isResizing) {
        // e.clientY from top of viewport
        // Preview starts below header (48px) and preview controls strip (~40px)
        const newHeight = e.clientY - 90;
        if (newHeight >= 120 && newHeight <= window.innerHeight * 0.85) {
          setPreviewHeight(newHeight);
          setIsMaximized(false);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  if (!showPreview) return null;

  return (
    <div
      className={`relative flex flex-col border-b border-slate-800 bg-[#090d16] shadow-2xl z-40 transition-colors select-none ${
        isResizing ? 'cursor-row-resize' : ''
      }`}
    >
      {/* Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 border-b border-slate-800/80 bg-slate-900/95">
        {/* Left: Port & Path Inputs */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Simple Port Input Field */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs">
            <Globe className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
            <span className="text-[11px] font-semibold text-slate-400">Port:</span>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="3000"
              className="w-16 bg-transparent font-mono text-cyan-300 font-bold outline-none text-xs text-center"
            />
          </div>

          {/* Optional Path Input */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs max-w-[140px] sm:max-w-[200px]">
            <span className="text-[11px] text-slate-500 font-mono">Path:</span>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/"
              className="w-full bg-transparent font-mono text-slate-200 outline-none text-xs"
            />
          </div>

          {/* Fast Quick Port Selector Pills */}
          <div className="hidden lg:flex items-center gap-1">
            {POPULAR_PORTS.map((item) => (
              <button
                key={item.port}
                onClick={() => handleSelectPort(item.port)}
                title={`Switch preview to port ${item.label}`}
                className={`rounded px-2 py-0.5 text-[10px] font-mono transition-all ${
                  cleanPort === item.port
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                :{item.port}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions & Viewports */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Responsive device frames switcher */}
          <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            <button
              onClick={() => setViewMode('responsive')}
              title="Desktop / Full View"
              className={`rounded p-1 text-slate-400 hover:text-slate-100 transition-colors ${
                viewMode === 'responsive' ? 'bg-slate-800 text-cyan-400 shadow-sm' : ''
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('tablet')}
              title="Tablet View (768px)"
              className={`rounded p-1 text-slate-400 hover:text-slate-100 transition-colors ${
                viewMode === 'tablet' ? 'bg-slate-800 text-cyan-400 shadow-sm' : ''
              }`}
            >
              <Tablet className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              title="Mobile View (375px)"
              className={`rounded p-1 text-slate-400 hover:text-slate-100 transition-colors ${
                viewMode === 'mobile' ? 'bg-slate-800 text-cyan-400 shadow-sm' : ''
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={handleRefreshPreview}
            title="Reload Preview Frame"
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={toggleMaximize}
            title={isMaximized ? 'Restore Height' : 'Maximize Preview'}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
          >
            {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {/* Big Open Tab Button for Fast Access */}
          <button
            onClick={handleOpenNewTab}
            title={`Open port :${cleanPort} in new browser tab`}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1 text-xs font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md shadow-cyan-950/40 active:scale-95 cursor-pointer"
          >
            <span>Open Tab (:{cleanPort})</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setShowPreview(false)}
            title="Close Preview Panel"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Embedded Iframe Container with Device Simulator Frame */}
      <div
        style={{
          height: isMaximized ? 'calc(100vh - 160px)' : `${previewHeight}px`,
        }}
        className="relative w-full bg-[#020617] flex flex-col items-center justify-center p-2 overflow-hidden transition-all duration-75"
      >
        <div
          className={`h-full bg-white rounded-lg overflow-hidden transition-all duration-300 shadow-2xl border border-slate-800 flex flex-col ${
            viewMode === 'mobile'
              ? 'w-[375px] max-w-full'
              : viewMode === 'tablet'
              ? 'w-[768px] max-w-full'
              : 'w-full'
          }`}
        >
          <iframe
            key={iframeKey}
            src={currentPreviewUrl}
            title="Live Web Preview"
            className="h-full w-full border-none bg-white flex-1"
          />
        </div>

        {/* Overlay blocker while dragging so iframe doesn't swallow mouse events */}
        {isResizing && <div className="absolute inset-0 z-50 bg-transparent cursor-row-resize" />}
      </div>

      {/* Draggable Divider Handle */}
      {!isMaximized && (
        <div
          onMouseDown={startResizing}
          title="Drag up or down to resize Preview panel"
          className={`group flex h-2 w-full cursor-row-resize items-center justify-center border-b border-t border-slate-800/80 transition-colors select-none ${
            isResizing ? 'bg-cyan-500 shadow-lg shadow-cyan-500/50' : 'bg-slate-900 hover:bg-cyan-500/80'
          }`}
        >
          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100">
            <span className="h-0.5 w-6 rounded-full bg-slate-400 group-hover:bg-slate-950" />
            <GripHorizontal className="h-3 w-3 text-slate-400 group-hover:text-slate-950" />
            <span className="h-0.5 w-6 rounded-full bg-slate-400 group-hover:bg-slate-950" />
          </div>
        </div>
      )}
    </div>
  );
};

export default LivePreviewBar;
