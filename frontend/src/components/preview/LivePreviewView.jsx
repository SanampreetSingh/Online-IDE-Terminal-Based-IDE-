import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Globe,
  ExternalLink,
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  ArrowLeft,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { openPreviewTab } from '../../store/slices/fileSlice';

const POPULAR_PORTS = [
  { port: '3000', label: '3000 (Static / Node)' },
  { port: '5173', label: '5173 (Vite / React)' },
  { port: '8080', label: '8080 (Webpack / Vue)' },
  { port: '8000', label: '8000 (Python / FastAPI)' },
  { port: '5000', label: '5000 (Flask / Express)' },
];

const LivePreviewView = ({ activeTab }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  
  // Extract initial port and subpath from active tab
  const initialPort = activeTab?.port || '3000';
  const initialPath = activeTab?.subpath || '';

  const [port, setPort] = useState(initialPort);
  const [path, setPath] = useState(initialPath);
  const [iframeKey, setIframeKey] = useState(0);
  const [viewMode, setViewMode] = useState('responsive'); // 'responsive', 'tablet', 'mobile'

  useEffect(() => {
    if (activeTab?.port) setPort(activeTab.port);
    if (activeTab?.subpath !== undefined) setPath(activeTab.subpath);
  }, [activeTab]);

  const userId = user?.id || user?._id || 'guest';

  const cleanPort = (port || '3000').toString().trim().replace(/[^0-9]/g, '') || '3000';
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  const currentPreviewUrl = `/preview/${userId}${cleanPath}?port=${cleanPort}`;

  const handleOpenNewTab = () => {
    window.open(currentPreviewUrl, '_blank');
  };

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleSelectPort = (selectedPort) => {
    setPort(selectedPort);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-[#020617] text-slate-100 select-none overflow-hidden">
      {/* Browser Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-1.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
        {/* Left: Port & Path Navigation Box */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="flex items-center gap-1 text-slate-500">
            <button onClick={handleRefresh} title="Reload page" className="p-1 rounded hover:bg-slate-800 hover:text-cyan-400">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Port Input */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs shadow-inner">
            <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-400">Port:</span>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="3000"
              className="w-16 bg-transparent font-mono text-cyan-300 font-bold outline-none text-xs text-center"
            />
          </div>

          {/* Path Input */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs max-w-[150px] sm:max-w-[220px]">
            <span className="text-[11px] text-slate-500 font-mono">Path:</span>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/"
              className="w-full bg-transparent font-mono text-slate-200 outline-none text-xs"
            />
          </div>

          {/* Quick Port Chips */}
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

        {/* Right: Device Viewport Controls & Open Tab */}
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

          {/* Open in New Browser Tab */}
          <button
            onClick={handleOpenNewTab}
            title={`Open port :${cleanPort} in new browser tab`}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1 text-xs font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md shadow-cyan-950/40 active:scale-95 cursor-pointer"
          >
            <span>Open in Tab (:{cleanPort})</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Full-Height Iframe Viewport Area */}
      <div className="flex-1 w-full bg-[#020617] flex flex-col items-center justify-center p-3 overflow-hidden">
        <div
          className={`h-full bg-white rounded-xl overflow-hidden transition-all duration-300 shadow-2xl border border-slate-800 flex flex-col ${
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
            title="Live Web Preview Tab"
            className="h-full w-full border-none bg-white flex-1"
          />
        </div>
      </div>
    </div>
  );
};

export default LivePreviewView;
