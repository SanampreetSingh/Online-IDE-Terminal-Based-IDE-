import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Globe,
  ExternalLink,
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  X,
  Play
} from 'lucide-react';
import { sendTerminalCommand } from '../../utils/codeRunner';
import { toast } from 'sonner';

const POPULAR_PORTS = ['3000', '5173', '8080', '8000'];

const LivePreviewBar = ({ showPreview, setShowPreview }) => {
  const user = useSelector((state) => state.auth.user);
  const [inputUrl, setInputUrl] = useState('localhost:3000');
  const [iframeKey, setIframeKey] = useState(0);
  const [viewMode, setViewMode] = useState('responsive'); // 'responsive', 'tablet', 'mobile'

  const getPreviewUrl = (rawInput) => {
    let clean = (rawInput || 'localhost:3000').trim().replace(/^https?:\/\//, '');
    const [hostPort, ...pathParts] = clean.split('/');
    const path = pathParts.length > 0 ? `/${pathParts.join('/')}` : '';
    const [host, port] = hostPort.split(':');
    const targetPort = port || (isNaN(host) ? '3000' : host);
    const userId = user?.id || user?._id || 'guest';

    return `/preview/${userId}${path}?port=${targetPort}`;
  };

  const currentPreviewUrl = getPreviewUrl(inputUrl);

  const handleOpenNewTab = () => {
    window.open(currentPreviewUrl, '_blank');
  };

  const handleRefreshPreview = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleQuickPort = (port) => {
    setInputUrl(`localhost:${port}`);
    if (!showPreview) setShowPreview(true);
  };

  if (!showPreview) return null;

  return (
    <div className="flex flex-col border-b border-slate-800 bg-slate-900/95 backdrop-blur shadow-lg z-40 transition-all select-none">
      {/* Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs">
            <Globe className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="localhost:3000"
              className="w-full bg-transparent font-mono text-cyan-300 outline-none text-xs"
            />
          </div>

          {/* Quick Port Chips */}
          <div className="hidden sm:flex items-center gap-1">
            {POPULAR_PORTS.map((p) => (
              <button
                key={p}
                onClick={() => handleQuickPort(p)}
                className={`rounded px-1.5 py-0.5 text-[10px] font-mono transition-colors ${
                  inputUrl.includes(`:${p}`)
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                :{p}
              </button>
            ))}
          </div>
        </div>

        {/* Viewport & Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Responsive device buttons */}
          <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            <button
              onClick={() => setViewMode('responsive')}
              title="Desktop / Full View"
              className={`rounded p-1 text-slate-400 hover:text-slate-100 ${
                viewMode === 'responsive' ? 'bg-slate-800 text-cyan-400 shadow-sm' : ''
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('tablet')}
              title="Tablet View (768px)"
              className={`rounded p-1 text-slate-400 hover:text-slate-100 ${
                viewMode === 'tablet' ? 'bg-slate-800 text-cyan-400 shadow-sm' : ''
              }`}
            >
              <Tablet className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              title="Mobile View (375px)"
              className={`rounded p-1 text-slate-400 hover:text-slate-100 ${
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
            onClick={handleOpenNewTab}
            title="Open in new browser tab"
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-2.5 py-1 text-xs font-semibold text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md shadow-cyan-950/30"
          >
            <span>Open Tab</span>
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

      {/* Embedded Iframe Container with Device Simulator Frames */}
      <div className="h-72 w-full bg-slate-950 flex items-center justify-center p-2 overflow-hidden">
        <div
          className={`h-full bg-white rounded-md overflow-hidden transition-all duration-300 shadow-2xl border border-slate-800 ${
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
            className="h-full w-full border-none bg-white"
          />
        </div>
      </div>
    </div>
  );
};

export default LivePreviewBar;
