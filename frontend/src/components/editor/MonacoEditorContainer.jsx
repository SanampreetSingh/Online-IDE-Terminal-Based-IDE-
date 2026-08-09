import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import { updateTabContent, markTabSaved } from '../../store/slices/fileSlice';
import { writeFile } from '../../api/fileApi';
import { toast } from 'sonner';
import { Code2, Save } from 'lucide-react';

const detectLanguage = (filename) => {
  if (!filename) return 'plaintext';
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'cpp':
    case 'cc':
    case 'c':
    case 'h':
    case 'hpp':
      return 'cpp';
    case 'py':
      return 'python';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'sh':
      return 'shell';
    default:
      return 'plaintext';
  }
};

const MonacoEditorContainer = () => {
  const dispatch = useDispatch();
  const { openTabs, activeTabPath } = useSelector((state) => state.file);
  const editorRef = useRef(null);

  const activeTab = openTabs.find((t) => t.path === activeTabPath);

  const handleEditorChange = (value) => {
    if (activeTab) {
      dispatch(updateTabContent({ path: activeTab.path, content: value || '' }));
    }
  };

  const handleSave = async () => {
    if (!activeTab) return;
    try {
      await writeFile(activeTab.path, activeTab.content);
      dispatch(markTabSaved(activeTab.path));
      toast.success(`Saved ${activeTab.name}`);
    } catch (err) {
      toast.error(`Failed to save ${activeTab.name}`);
    }
  };

  // Keyboard shortcut Ctrl+S / Cmd+S handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  if (!activeTab) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-950 text-slate-600 select-none">
        <Code2 className="mb-4 h-16 w-16 opacity-30 text-cyan-400" />
        <p className="font-mono text-sm tracking-widest text-slate-400">NO FILE OPEN</p>
        <p className="mt-1 text-xs text-slate-500">Select a file from the explorer on the left to start coding</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-slate-950">
      {/* Active File Header / Save Status */}
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 text-xs text-slate-400 border-b border-slate-800">
        <span className="font-mono">{activeTab.path}</span>
        <button
          onClick={handleSave}
          disabled={!activeTab.isDirty}
          className="flex items-center gap-1 rounded bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-30"
        >
          <Save className="h-3 w-3" />
          {activeTab.isDirty ? 'Save (Ctrl+S)' : 'Saved'}
        </button>
      </div>

      {/* Monaco Editor Component */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={detectLanguage(activeTab.name)}
          value={activeTab.content}
          theme="vs-dark"
          onChange={handleEditorChange}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
          options={{
            fontSize: 13,
            fontFamily: "'Fira Code', 'Cascadia Code', monospace",
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            lineNumbersMinChars: 3,
          }}
        />
      </div>
    </div>
  );
};

export default MonacoEditorContainer;
