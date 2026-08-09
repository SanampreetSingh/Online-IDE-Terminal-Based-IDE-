import React, { useState, useCallback, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserContext } from '../context/UserContext';
import { logout as logoutAction } from '../store/slices/authSlice';
import TerminalComponent from './Terminal';
import FileExplorer from './sidebar/FileExplorer';
import TabBar from './editor/TabBar';
import MonacoEditorContainer from './editor/MonacoEditorContainer';
import LivePreviewBar from './preview/LivePreviewBar';
import { startWorkspace, stopWorkspace, getWorkspaceStatus } from '../api/workspaceApi';
import { setWorkspaceStatus, setWorkspaceLoading } from '../store/slices/workspaceSlice';
import { LogOut, Terminal as TerminalIcon, Code2, Play, Square, Loader2, Cpu } from 'lucide-react';
import { toast } from 'sonner';

const IDEWorkspace = () => {
  const dispatch = useDispatch();
  const reduxUser = useSelector((state) => state.auth.user);
  const userContext = useContext(UserContext) || {};
  const contextUser = userContext.user;
  const contextLogout = userContext.logout;

  const user = reduxUser || contextUser;

  const { status: containerStatus, loading: workspaceLoading } = useSelector((state) => state.workspace);

  const [terminalHeight, setTerminalHeight] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = () => setIsResizing(true);
  const stopResizing = () => setIsResizing(false);

  const resize = useCallback(
    (e) => {
      if (isResizing) {
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight > 100 && newHeight < window.innerHeight * 0.85) {
          setTerminalHeight(newHeight);
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

  const handleStartContainer = async () => {
    dispatch(setWorkspaceLoading(true));
    try {
      const res = await startWorkspace();
      dispatch(setWorkspaceStatus({ status: res.status || 'active', mapping: res.mapping }));
      toast.success('Isolated container started!');
    } catch (err) {
      toast.error('Failed to start container');
    }
  };

  const handleStopContainer = async () => {
    dispatch(setWorkspaceLoading(true));
    try {
      await stopWorkspace();
      dispatch(setWorkspaceStatus({ status: 'stopped' }));
      toast.success('Container stopped');
    } catch (err) {
      toast.error('Failed to stop container');
    }
  };

  const handleLogout = () => {
    dispatch(logoutAction());
    if (contextLogout) contextLogout();
  };

  return (
    <div
      className={`flex h-screen w-full max-w-full flex-col bg-slate-950 text-slate-100 overflow-x-hidden overflow-y-hidden ${
        isResizing ? 'cursor-row-resize select-none' : ''
      }`}
    >
      {/* Top Navbar Header */}
      <header className="flex h-12 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 z-50 select-none">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 font-bold text-slate-950">
            <Code2 size={16} />
          </div>
          <span className="font-bold text-sm tracking-widest text-slate-100">CLOUD_IDE</span>

          {/* Container Lifecycle Status Pill */}
          <div className="ml-4 flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs">
            <Cpu size={12} className="text-cyan-400" />
            <span className="capitalize text-slate-300">Container: {containerStatus}</span>
            {containerStatus === 'active' ? (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-amber-400" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Start / Stop Container Actions */}
          {containerStatus === 'active' ? (
            <button
              onClick={handleStopContainer}
              disabled={workspaceLoading}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-40"
            >
              {workspaceLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
              Stop Container
            </button>
          ) : (
            <button
              onClick={handleStartContainer}
              disabled={workspaceLoading}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-40"
            >
              {workspaceLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Start Container
            </button>
          )}

          {/* Profile Badge */}
          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs">
            {user?.picture ? (
              <img src={user.picture} alt="profile" className="h-4 w-4 rounded-full" />
            ) : (
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-bold text-slate-950">
                {user?.name?.[0] || 'U'}
              </div>
            )}
            <span className="font-medium text-slate-200">{user?.name || user?.email}</span>
          </div>

          <button onClick={handleLogout} title="Logout" className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="relative flex flex-1 overflow-hidden bg-slate-950">
        {/* Left File Explorer Sidebar */}
        <FileExplorer />

        {/* Center Code Editor & Live Preview Panel */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <LivePreviewBar />
          <TabBar />
          <div className="relative flex-1">
            <MonacoEditorContainer />
            {isResizing && <div className="absolute inset-0 z-50 bg-transparent" />}
          </div>
        </div>
      </main>

      {/* Resizable Divider */}
      <div
        onMouseDown={startResizing}
        className={`h-1 z-50 cursor-row-resize transition-colors ${
          isResizing ? 'bg-cyan-500' : 'bg-slate-800 hover:bg-cyan-500/80'
        }`}
      />

      {/* Bottom Terminal Drawer */}
      <section style={{ height: `${terminalHeight}px` }} className="relative flex flex-col w-full bg-black">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none">
          <div className="flex items-center gap-2">
            <TerminalIcon size={13} className="text-cyan-400" />
            <span>Terminal</span>
          </div>
          <span className="text-[10px] font-normal text-slate-500">Interactive Docker Shell</span>
        </div>

        <div className="flex-1 w-full bg-black">
          <TerminalComponent />
        </div>
      </section>
    </div>
  );
};

export default IDEWorkspace;