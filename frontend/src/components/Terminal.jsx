import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { logout as logoutAction } from '../store/slices/authSlice';
import { RefreshCw, Wifi, WifiOff, Trash2, StopCircle, CornerDownLeft } from 'lucide-react';
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
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)
    ) {
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
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
        allowProposedApi: true,
        theme: {
          background: '#090d16',
          foreground: '#e2e8f0',
          cursor: '#22d3ee',
          cursorAccent: '#020617',
          selectionBackground: '#1e293b',
          black: '#0f172a',
          red: '#f87171',
          green: '#4ade80',
          yellow: '#facc15',
          blue: '#38bdf8',
          magenta: '#c084fc',
          cyan: '#22d3ee',
          white: '#f1f5f9',
          brightBlack: '#475569',
          brightRed: '#ef4444',
          brightGreen: '#22c55e',
          brightYellow: '#eab308',
          brightBlue: '#0ea5e9',
          brightMagenta: '#a855f7',
          brightCyan: '#06b6d4',
          brightWhite: '#ffffff',
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
        try {
          fitAddon.fit();
          socket.send(
            JSON.stringify({
              type: 'resize',
              cols: term.cols,
              rows: term.rows,
            })
          );
        } catch (e) {
          console.warn('Resize sync err', e);
        }
      }
    };

    socket.onopen = () => {
      setConnected(true);
      setConnecting(false);
      term.writeln('\x1b[38;2;34;211;238m✔ Connected to interactive container shell.\x1b[0m\r\n');
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
        term.writeln('\r\n\x1b[33m⚡ Container disconnected. Click Reconnect to resume session.\x1b[0m\r\n');
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

  // Handle external program execution events (1-Click Run Code)
  useEffect(() => {
    const handleRunCommand = (e) => {
      const command = e.detail?.command;
      if (!command) return;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(command + '\n');
        if (xtermRef.current) {
          xtermRef.current.focus();
        }
      } else {
        // Reconnect if needed, then send
        connectSocket();
        setTimeout(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(command + '\n');
            if (xtermRef.current) {
              xtermRef.current.focus();
            }
          }
        }, 600);
      }
    };

    window.addEventListener('ide-run-command', handleRunCommand);
    return () => window.removeEventListener('ide-run-command', handleRunCommand);
  }, [connectSocket]);

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

  const handleClearTerminal = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send('clear\n');
    }
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.focus();
    }
  };

  const handleInterruptProcess = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Send Ctrl+C ANSI code
      wsRef.current.send('\x03');
      if (xtermRef.current) {
        xtermRef.current.focus();
      }
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#090d16]">
      {/* Sleek Terminal Utility Bar */}
      <div className="absolute right-3 top-2 z-20 flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800 backdrop-blur shadow-md">
        <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] text-slate-300">
          {connected ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-500/50" />
              <span className="text-emerald-400 font-semibold tracking-wide">ONLINE</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-amber-400 font-semibold tracking-wide">OFFLINE</span>
            </>
          )}
        </div>

        <div className="h-3 w-px bg-slate-800" />

        <button
          onClick={handleInterruptProcess}
          title="Interrupt Running Process (Ctrl+C)"
          className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
        >
          <StopCircle className="h-3 w-3 text-red-400" />
          <span>Stop</span>
        </button>

        <button
          onClick={handleClearTerminal}
          title="Clear Terminal Screen (Ctrl+L)"
          className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          <span>Clear</span>
        </button>

        <button
          onClick={connectSocket}
          disabled={connecting}
          title="Reconnect Terminal WebSocket"
          className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`h-3 w-3 ${connecting ? 'animate-spin text-cyan-400' : ''}`} />
          <span>{connecting ? 'Connecting...' : 'Reconnect'}</span>
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