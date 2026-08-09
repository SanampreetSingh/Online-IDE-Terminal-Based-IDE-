import { useDispatch, useSelector } from 'react-redux';
import { X, FileCode } from 'lucide-react';
import { setActiveTab, closeTab } from '../../store/slices/fileSlice';

const TabBar = () => {
  const dispatch = useDispatch();
  const { openTabs, activeTabPath } = useSelector((state) => state.file);

  if (!openTabs || openTabs.length === 0) return null;

  return (
    <div className="flex h-9 w-full border-b border-slate-800 bg-slate-950 overflow-x-auto select-none scrollbar-none">
      {openTabs.map((tab) => {
        const isActive = tab.path === activeTabPath;
        return (
          <div
            key={tab.path}
            onClick={() => dispatch(setActiveTab(tab.path))}
            className={`group flex items-center gap-2 border-r border-slate-800/80 px-3 text-xs cursor-pointer transition-colors ${
              isActive
                ? 'bg-slate-900 text-cyan-400 font-medium border-t-2 border-t-cyan-400'
                : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
            }`}
          >
            <FileCode className={`h-3.5 w-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span className="truncate max-w-[120px]">{tab.name}</span>

            {/* Dirty Indicator or Close Button */}
            <div className="flex items-center ml-1">
              {tab.isDirty ? (
                <span className="h-2 w-2 rounded-full bg-cyan-400 group-hover:hidden" />
              ) : null}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(closeTab(tab.path));
                }}
                className={`rounded p-0.5 text-slate-500 hover:bg-slate-800 hover:text-red-400 ${
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
  );
};

export default TabBar;
