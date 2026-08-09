import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Globe, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const LivePreviewBar = () => {
  const user = useSelector((state) => state.auth.user);
  const [inputUrl, setInputUrl] = useState('localhost:3000');
  const [iframeSrc, setIframeSrc] = useState('');
  const [showIframe, setShowIframe] = useState(false);

  const getPreviewUrl = (rawInput) => {
    let clean = (rawInput || 'localhost:3000').trim().replace(/^https?:\/\//, '');
    const [hostPort, ...pathParts] = clean.split('/');
    const path = pathParts.length > 0 ? `/${pathParts.join('/')}` : '';
    const [host, port] = hostPort.split(':');
    const targetPort = port || (isNaN(host) ? '3000' : host);
    const userId = user?.id || user?._id || 'guest';

    return `/preview/${userId}${path}?port=${targetPort}`;
  };

  const handleOpenNewTab = () => {
    const url = getPreviewUrl(inputUrl);
    window.open(url, '_blank');
  };

  const handleToggleEmbeddedPreview = () => {
    const url = getPreviewUrl(inputUrl);
    setIframeSrc(url);
    setShowIframe(!showIframe);
  };

  return (
    <div className="flex flex-col border-b border-slate-800 bg-slate-900">
      {/* Control Strip */}
      <div className="flex items-center gap-2 p-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300">
          <Globe className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="localhost:3000/path"
            className="w-full bg-transparent font-mono text-cyan-400 outline-none"
          />
        </div>

        <button
          onClick={handleToggleEmbeddedPreview}
          className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {showIframe ? 'Hide Preview' : 'Inline Preview'}
        </button>

        <button
          onClick={handleOpenNewTab}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:from-cyan-400 hover:to-blue-500"
        >
          <span>Open Tab</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Embedded Iframe Drawer */}
      {showIframe && (
        <div className="h-64 w-full border-t border-slate-800 bg-white">
          <iframe
            src={iframeSrc}
            title="Live Web Preview"
            className="h-full w-full border-none"
          />
        </div>
      )}
    </div>
  );
};

export default LivePreviewBar;
