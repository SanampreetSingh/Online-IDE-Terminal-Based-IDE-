import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { logout as logoutAction } from '../store/slices/authSlice';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import 'xterm/css/xterm.css';

const TerminalComponent = () => {
  const dispatch = useDispatch();
  const containerStatus = useSelector((state) => state.workspace.status);

  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const wsRef = useRef(null);
  const fitAddonRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const connectSocket = useCallback(() => {
    if (!terminalRef.current) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    setConnecting(true);

    // Initialize Xterm if not created yet
    if (!xtermRef.current) {
      const term = new Terminal({
        cursorBlink: true,
        convertEol: true,
        scrollback: 5000,
        fontSize: 13,
        fontFamily: '"Fira Code", "Cascadia Code", monospace',
        allowProposedApi: true,
        theme: {
          background: '#000000',
          foreground: '#ffffff',
          cursor: '#38bdf8',
        },
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);

      fitAddonRef.current = fitAddon;
      xtermRef.current = term;
    }

    const term = xtermRef.current;
    const fitAddon = fitAddonRef.current;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${protocol}://${window.location.host}/socket.io/`);
    socket.binaryType = 'arraybuffer';
    wsRef.current = socket;

    const syncSize = () => {
      if (socket.readyState === WebSocket.OPEN && fitAddon && term) {
        fitAddon.fit();
        socket.send(
          JSON.stringify({
            type: 'resize',
            cols: term.cols,
            rows: term.rows,
          })
        );
      }
    };

    socket.onopen = () => {
      setConnected(true);
      setConnecting(false);
      term.writeln('\x1b[32m✔ Connected to workspace container shell.\x1b[0m\r\n');
      setTimeout(() => {
        syncSize();
        term.focus();
      }, 150);
    };

    socket.onclose = (event) => {
      setConnected(false);
      setConnecting(false);
      console.warn(`Terminal WebSocket closed (Code: ${event.code})`);

      if (event.code === 4001) {
        term.writeln('\r\n\x1b[31m❌ Session expired or unauthorized. Logging out...\x1b[0m\r\n');
        dispatch(logoutAction());
      } else {
        term.writeln('\r\n\x1b[33m⚡ Container process stopped or disconnected. Reconnect when container is active.\x1b[0m\r\n');
      }
    };

    socket.onerror = () => {
      setConnected(false);
      setConnecting(false);
    };

    socket.onmessage = (event) => {
      const data = event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : event.data;
      term.write(data);
    };

    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      if (term && fitAddon) {
        requestAnimationFrame(() => {
          syncSize();
        });
      }
    });

    resizeObserver.observe(terminalRef.current);
  }, [dispatch]);

  // Initial connect & auto-reconnect when container status becomes active
  useEffect(() => {
    if (containerStatus === 'active') {
      connectSocket();
    } else if (containerStatus === 'stopped' && wsRef.current) {
      wsRef.current.close();
      setConnected(false);
    }
  }, [containerStatus, connectSocket]);

  // Clean mount/unmount
  useEffect(() => {
    connectSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-black">
      {/* Terminal Reconnect Toolbar Overlay */}
      <div className="absolute right-4 top-2 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[10px] text-slate-300 border border-slate-800 backdrop-blur">
          {connected ? (
            <>
              <Wifi className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-amber-400" />
              <span className="text-amber-400 font-medium">Disconnected</span>
            </>
          )}
        </div>

        <button
          onClick={connectSocket}
          disabled={connecting}
          title="Reconnect Terminal WebSocket"
          className="flex items-center gap-1 rounded bg-slate-800/90 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700 hover:text-cyan-400 border border-slate-700 disabled:opacity-40"
        >
          <RefreshCw className={`h-3 w-3 ${connecting ? 'animate-spin text-cyan-400' : ''}`} />
          {connecting ? 'Connecting...' : 'Reconnect'}
        </button>
      </div>

      <div className="flex-1 relative">
        <div ref={terminalRef} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />
      </div>

      <style>{`
        .xterm-screen {
          width: 100% !important;
        }
        .xterm-viewport {
          width: 100% !important;
          overflow-y: auto !important;
        }
        .terminal.xterm {
          padding: 8px 12px;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

export default TerminalComponent;