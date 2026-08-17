import React, { useState, useCallback, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserContext } from '../context/UserContext';
import { logout as logoutAction } from '../store/slices/authSlice';
import TerminalComponent from './Terminal';
import FileExplorer from './sidebar/FileExplorer';
import TabBar from './editor/TabBar';
import MonacoEditorContainer from './editor/MonacoEditorContainer';
import LivePreviewBar from './preview/LivePreviewBar';
import { getWorkspaceStatus } from '../api/workspaceApi';
import { setWorkspaceStatus } from '../store/slices/workspaceSlice';
import { getLanguageMeta, executeActiveCode } from '../utils/codeRunner';
import {
  LogOut,
  Terminal as TerminalIcon,
  Code2,
  Cpu,
  Play,
  Globe,
  PanelLeftClose,
  PanelLeft,
  Maximize2,
  Minimize2,
  Sparkles,
  Command
} from 'lucide-react';
import { toast } from 'sonner';

const IDEWorkspace = () => {
  const dispatch = useDispatch();
  const reduxUser = useSelector((state) => state.auth.user);
  const userContext = useContext(UserContext) || {};
  const contextUser = userContext.user;
  const contextLogout = userContext.logout;

  const user = reduxUser || contextUser;

  const { status: containerStatus } = useSelector((state) => state.workspace);
  const { openTabs, activeTabPath } = useSelector((state) => state.file);

  const activeTab = openTabs.find((t) => t.path === activeTabPath);
  const langMeta = getLanguageMeta(activeTab?.path);

  // Layout states
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(260);
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = () => setIsResizing(true);
  const stopResizing = () => setIsResizing(false);

  const resize = useCallback(
    (e) => {
      if (isResizing) {
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight > 80 && newHeight < window.innerHeight * 0.85) {
          setTerminalHeight(newHeight);
          setIsTerminalCollapsed(false);
          setIsTerminalMaximized(false);
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
  }, [isResizing, resize]);

  // Fetch workspace status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await getWorkspaceStatus();
        dispatch(setWorkspaceStatus({ status: res.status, mapping: res.mapping }));
      } catch (err) {
        console.error('Failed to get container status', err);
      }
    };
    fetchStatus();
  }, [dispatch]);

  // 1-Click Code Runner Trigger
  const handleRunCode = () => {
    if (!activeTab) {
      toast.info('Open a file first to compile or run');
      return;
    }
    if (isTerminalCollapsed) {
      setIsTerminalCollapsed(false);
    }
    executeActiveCode(activeTab, dispatch, setTerminalHeight);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ctrl+Enter or Cmd+Enter: Run Code
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
      // Ctrl+B: Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setShowSidebar((prev) => !prev);
      }
      // Ctrl+` (backtick): Toggle Terminal
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setIsTerminalCollapsed((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeTab, isTerminalCollapsed]);

  const handleLogout = () => {
    dispatch(logoutAction());
    if (contextLogout) contextLogout();
  };

  const toggleTerminalMaximize = () => {
    if (isTerminalMaximized) {
      setIsTerminalMaximized(false);
      setTerminalHeight(260);
    } else {
      setIsTerminalMaximized(true);
      setIsTerminalCollapsed(false);
    }
  };

  return (
    <div
      className={`flex h-screen w-full max-w-full flex-col bg-[#020617] text-slate-100 overflow-hidden font-sans ${
        isResizing ? 'cursor-row-resize select-none' : ''
      }`}
    >
      {/* Top Navbar Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-800/90 bg-[#090d16] px-3 z-50 select-none shadow-md">
        {/* Left Brand & Workspace Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-md shadow-cyan-900/40 border border-cyan-300/30">
              <Code2 size={18} className="text-slate-950 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-sm tracking-wider bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
              CLOUD_IDE
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Container Lifecycle Status Pill */}
          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/80 px-2.5 py-1 text-[11px] backdrop-blur">
            <Cpu size={12} className="text-cyan-400" />
            <span className="text-slate-300 hidden sm:inline">Docker Sandbox:</span>
            <span className="capitalize text-slate-200 font-medium">{containerStatus || 'active'}</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </div>

        {/* Center: Prominent Interactive 1-Click Code Runner */}
        <div className="flex items-center gap-2">
          {activeTab ? (
            <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800/90 shadow-inner">
              {/* Language Chip */}
              <span className={`px-2 py-0.5 text-[11px] font-mono rounded ${langMeta.badgeColor} border mr-1.5 hidden sm:inline-flex items-center gap-1`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {langMeta.name}
              </span>

              {/* Main Glowing Run Button */}
              <button
                onClick={handleRunCode}
                title={langMeta.runnable ? `${langMeta.runnerLabel} (Ctrl+Enter)` : 'Execute File (Ctrl+Enter)'}
                className="group flex items-center gap-2 rounded-md bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-3.5 py-1 text-xs font-bold text-slate-950 hover:from-emerald-400 hover:to-cyan-400 shadow-md shadow-emerald-950/50 hover:shadow-emerald-900/80 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-slate-950 group-hover:scale-110 transition-transform" />
                <span>Run Code</span>
                <span className="hidden md:inline text-[9px] font-mono bg-slate-950/30 px-1 py-0.2 rounded text-slate-900 border border-slate-950/20">
                  Ctrl+↵
                </span>
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-950/60 px-3 py-1 text-xs text-slate-500 border border-slate-800">
              <Sparkles className="h-3.5 w-3.5 text-slate-600" />
              <span>Select or create a file to run code</span>
            </div>
          )}
        </div>

        {/* Right Tools & Profile */}
        <div className="flex items-center gap-2">
          {/* Toggle Explorer Button */}
          <button
            onClick={() => setShowSidebar((prev) => !prev)}
            title="Toggle File Explorer (Ctrl+B)"
            className={`rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors ${
              showSidebar ? 'text-cyan-400 bg-slate-800/40' : ''
            }`}
          >
            {showSidebar ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          </button>

          {/* Toggle Live Web Preview */}
          <button
            onClick={() => setShowPreview((prev) => !prev)}
            title="Toggle Live Web Preview Drawer"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
              showPreview
                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400 shadow-sm shadow-cyan-950'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Globe size={13} className={showPreview ? 'text-cyan-400' : ''} />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Toggle Terminal Drawer */}
          <button
            onClick={() => setIsTerminalCollapsed((prev) => !prev)}
            title="Toggle Terminal Shell (Ctrl+`)"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
              !isTerminalCollapsed
                ? 'border-slate-700 bg-slate-800/60 text-cyan-300'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <TerminalIcon size={13} />
            <span className="hidden sm:inline">Terminal</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-0.5" />

          {/* Profile Badge */}
          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs shadow-inner">
            {user?.picture ? (
              <img src={user.picture} alt="profile" className="h-4 w-4 rounded-full" />
            ) : (
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-[9px] font-bold text-slate-950">
                {user?.name?.[0] || 'U'}
              </div>
            )}
            <span className="font-medium text-slate-300 hidden md:inline max-w-[100px] truncate">
              {user?.name || user?.email}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="relative flex flex-1 overflow-hidden bg-[#020617]">
        {/* Left File Explorer Sidebar (collapsible) */}
        {showSidebar && <FileExplorer />}

        {/* Center Code Editor & Live Preview Panel */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#090d16]">
          {/* Live Web Preview Drawer (Collapsible) */}
          <LivePreviewBar showPreview={showPreview} setShowPreview={setShowPreview} />

          {/* Editor Tab Bar */}
          <TabBar />

          {/* Monaco Editor Container */}
          <div className="relative flex-1 overflow-hidden">
            <MonacoEditorContainer setTerminalHeight={setTerminalHeight} />
            {isResizing && <div className="absolute inset-0 z-50 bg-transparent" />}
          </div>
        </div>
      </main>

      {/* Resizable Divider between Editor and Terminal */}
      {!isTerminalCollapsed && !isTerminalMaximized && (
        <div
          onMouseDown={startResizing}
          className={`h-1.5 z-40 cursor-row-resize transition-all ${
            isResizing ? 'bg-cyan-500 shadow-lg shadow-cyan-500/50' : 'bg-slate-800 hover:bg-cyan-500/60'
          }`}
        />
      )}

      {/* Bottom Terminal Drawer */}
      <section
        style={{
          height: isTerminalCollapsed
            ? '32px'
            : isTerminalMaximized
            ? 'calc(100vh - 48px)'
            : `${terminalHeight}px`,
        }}
        className="relative flex flex-col w-full bg-[#090d16] border-t border-slate-800 transition-all duration-150"
      >
        {/* Terminal Header Bar */}
        <div className="flex h-8 items-center justify-between border-b border-slate-800/90 bg-slate-900/95 px-3 text-[11px] font-bold text-slate-300 select-none">
          <div
            onClick={() => setIsTerminalCollapsed((prev) => !prev)}
            className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors"
          >
            <TerminalIcon size={13} className="text-cyan-400" />
            <span className="tracking-wider uppercase font-mono text-[10px]">CONTAINER SHELL</span>
            <span className="text-[9px] font-normal text-slate-500 font-mono hidden sm:inline">
              [root@workspace]
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTerminalMaximize}
              title={isTerminalMaximized ? 'Restore Terminal' : 'Maximize Terminal'}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
            >
              {isTerminalMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
            <button
              onClick={() => setIsTerminalCollapsed((prev) => !prev)}
              title={isTerminalCollapsed ? 'Expand Terminal' : 'Minimize Terminal'}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
            >
              <Minimize2 size={13} className={isTerminalCollapsed ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        {!isTerminalCollapsed && (
          <div className="flex-1 w-full bg-[#090d16] overflow-hidden">
            <TerminalComponent />
          </div>
        )}
      </section>
    </div>
  );
};

export default IDEWorkspace;