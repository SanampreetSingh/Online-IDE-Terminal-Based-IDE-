import { useDispatch, useSelector } from 'react-redux';
import { X, FileCode, Globe, Plus } from 'lucide-react';
import { setActiveTab, closeTab, openPreviewTab } from '../../store/slices/fileSlice';
import { getLanguageMeta } from '../../utils/codeRunner';

const TabBar = () => {
  const dispatch = useDispatch();
  const { openTabs, activeTabPath } = useSelector((state) => state.file);

  if (!openTabs || openTabs.length === 0) return null;

  return (
    <div className="flex h-9 w-full items-center justify-between border-b border-slate-800 bg-[#090d16] select-none px-1 overflow-hidden">
      {/* Scrollable Tabs */}
      <div className="flex h-full items-center overflow-x-auto scrollbar-none flex-1">
        {openTabs.map((tab) => {
          const isActive = tab.path === activeTabPath;
          const isPreview = tab.type === 'preview' || tab.path.startsWith('__preview__');
          const langMeta = getLanguageMeta(tab.path);

          return (
            <div
              key={tab.path}
              onClick={() => dispatch(setActiveTab(tab.path))}
              className={`group relative flex h-full shrink-0 items-center gap-2 border-r border-slate-800/80 px-3 text-xs cursor-pointer transition-all ${
                isActive
                  ? 'bg-slate-900 text-slate-100 font-medium'
                  : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
              }`}
            >
              {/* Active Top Accent Line */}
              {isActive && (
                <span className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-blue-500" />
              )}

              {isPreview ? (
                <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              ) : (
                <FileCode className={`h-3.5 w-3.5 ${langMeta.color || 'text-slate-500'} shrink-0`} />
              )}

              <span className="truncate max-w-[140px] font-mono text-[11px]">{tab.name}</span>

              {/* Dirty Dot or Close Button */}
              <div className="flex items-center ml-1">
                {tab.isDirty && (
                  <span className="h-2 w-2 rounded-full bg-cyan-400 group-hover:hidden transition-transform" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(closeTab(tab.path));
                  }}
                  title="Close Tab"
                  className={`rounded p-0.5 text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors ${
                    tab.isDirty ? 'hidden group-hover:block' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Launch Preview Tab Button */}
      <div className="flex items-center pl-2 pr-1 shrink-0">
        <button
          onClick={() => dispatch(openPreviewTab({ port: '3000' }))}
          title="Open Live Preview Tab (:3000)"
          className="flex items-center gap-1 rounded bg-slate-950 px-2 py-0.5 text-[10px] font-medium text-slate-400 hover:bg-slate-800 hover:text-cyan-400 border border-slate-800 transition-colors"
        >
          <Globe className="h-3 w-3 text-cyan-400" />
          <span>+ Preview</span>
        </button>
      </div>
    </div>
  );
};

export default TabBar;
