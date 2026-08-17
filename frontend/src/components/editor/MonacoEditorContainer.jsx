import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import { updateTabContent, markTabSaved, openTab, setFileTree, setSelectedPath } from '../../store/slices/fileSlice';
import { writeFile, createEntry, getFileTree } from '../../api/fileApi';
import { getLanguageMeta, executeActiveCode } from '../../utils/codeRunner';
import { toast } from 'sonner';
import {
  Code2,
  Save,
  Play,
  FileCode,
  Sparkles,
  Terminal as TerminalIcon,
  ChevronRight,
  Folder
} from 'lucide-react';

const detectLanguage = (filename) => {
  if (!filename) return 'plaintext';
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'h':
    case 'hpp':
      return 'cpp';
    case 'c':
      return 'c';
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
    case 'bash':
      return 'shell';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'java':
      return 'java';
    default:
      return 'plaintext';
  }
};

const STARTER_TEMPLATES = [
  {
    name: 'main.cpp',
    label: 'C++ Program',
    desc: 'High-performance C++17 with standard I/O',
    icon: '⚡',
    content: `#include <iostream>
#include <vector>
#include <string>

int main() {
    std::cout << "🚀 Hello from Cloud IDE C++17!" << std::endl;
    
    std::vector<std::string> features = {
        "Instant Compilation with g++",
        "Isolated Docker Sandbox",
        "Direct Terminal Stream"
    };

    std::cout << "\\n✨ Features available:" << std::endl;
    for (size_t i = 0; i < features.size(); ++i) {
        std::cout << "  " << (i + 1) << ". " << features[i] << std::endl;
    }

    return 0;
}
`,
  },
  {
    name: 'main.py',
    label: 'Python 3 Script',
    desc: 'Data analysis and scripting ready',
    icon: '🐍',
    content: `#!/usr/bin/env python3
import sys
import platform

def main():
    print("🐍 Welcome to Cloud IDE Python Workspace!")
    print(f"System: {platform.system()} | Python {platform.python_version()}")
    
    languages = ["C++", "Python", "JavaScript", "TypeScript", "Bash"]
    print("\\nSupported Runtimes:")
    for lang in languages:
        print(f"  • {lang}")

if __name__ == "__main__":
    main()
`,
  },
  {
    name: 'index.js',
    label: 'Node.js Script',
    desc: 'Modern JavaScript runtime environment',
    icon: '🚀',
    content: `// Cloud IDE - Node.js
console.log("⚡ Hello from Node.js in Docker Container!");

const serverInfo = {
  runtime: process.version,
  platform: process.platform,
  uptime: process.uptime(),
};

console.table(serverInfo);
console.log("Press [▶ Run Code] in the top bar to execute anytime.");
`,
  },
  {
    name: 'index.html',
    label: 'Web Application',
    desc: 'HTML5 template with live preview capability',
    icon: '🌐',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cloud IDE Web App</title>
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
      background: #090d16;
      color: #e2e8f0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: #0f172a;
      border: 1px solid #1e293b;
      padding: 2.5rem;
      border-radius: 1rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      text-align: center;
      max-width: 480px;
    }
    h1 {
      color: #38bdf8;
      margin-top: 0;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #38bdf8;
      border-radius: 9999px;
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">🚀 Live Preview</span>
    <h1>Cloud IDE Web Demo</h1>
    <p>Run <code>serve-link 3000</code> in your terminal or click Preview to see changes instantly!</p>
  </div>
</body>
</html>
`,
  },
];

const MonacoEditorContainer = ({ setTerminalHeight }) => {
  const dispatch = useDispatch();
  const { openTabs, activeTabPath } = useSelector((state) => state.file);
  const editorRef = useRef(null);

  const activeTab = openTabs.find((t) => t.path === activeTabPath);
  const langMeta = getLanguageMeta(activeTab?.path);

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

  const handleRun = () => {
    executeActiveCode(activeTab, dispatch, setTerminalHeight);
  };

  // Keyboard shortcut Ctrl+S / Cmd+S handler & Ctrl+Enter to Run
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  const handleCreateStarter = async (starter) => {
    try {
      await createEntry(starter.name, 'file');
      await writeFile(starter.name, starter.content);
      const res = await getFileTree();
      dispatch(setFileTree(res.tree || []));
      dispatch(setSelectedPath(starter.name));
      dispatch(openTab({ path: starter.name, name: starter.name, content: starter.content }));
      toast.success(`Created ${starter.name}`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to create ${starter.name}`);
    }
  };

  if (!activeTab) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[#090d16] text-slate-300 select-none p-6 overflow-y-auto">
        <div className="flex flex-col items-center text-center max-w-xl">
          <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 via-slate-900 to-blue-600/20 border border-cyan-500/30 shadow-xl shadow-cyan-950/50">
            <Code2 className="h-10 w-10 text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
            Cloud IDE Workspace
          </h2>
          <p className="mt-2 text-xs text-slate-400 max-w-md">
            Select a file from the explorer on the left, or launch a starter template below to start coding instantly with 1-click execution.
          </p>

          {/* Quick Starter Templates */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            {STARTER_TEMPLATES.map((starter) => (
              <button
                key={starter.name}
                onClick={() => handleCreateStarter(starter)}
                className="group flex flex-col items-start p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-cyan-500/40 text-left transition-all duration-200 shadow-sm hover:shadow-cyan-950/30"
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{starter.icon}</span>
                    <span className="font-semibold text-xs text-slate-200 group-hover:text-cyan-300">
                      {starter.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-800/50">
                    {starter.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{starter.desc}</p>
              </button>
            ))}
          </div>

          {/* Quick Shortcuts Helper */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px]">
                Ctrl+Enter
              </kbd>
              <span>Run Code</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px]">
                Ctrl+S
              </kbd>
              <span>Save File</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Parse path breadcrumbs
  const pathParts = activeTab.path.split('/');

  return (
    <div className="relative flex h-full w-full flex-col bg-[#090d16]">
      {/* Modern Breadcrumbs & Action Toolbar */}
      <div className="flex h-9 items-center justify-between bg-slate-900/90 px-3 text-xs text-slate-400 border-b border-slate-800 select-none">
        {/* Breadcrumb path */}
        <div className="flex items-center gap-1 overflow-hidden font-mono text-[11px] text-slate-400">
          <Folder className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-500">workspace</span>
          {pathParts.map((part, index) => (
            <span key={index} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />
              <span className={index === pathParts.length - 1 ? 'text-slate-200 font-medium' : 'text-slate-400'}>
                {part}
              </span>
            </span>
          ))}
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Language Pill */}
          <div className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono border ${langMeta.badgeColor}`}>
            <span>{langMeta.name}</span>
          </div>

          {/* Save Status & Button */}
          <button
            onClick={handleSave}
            disabled={!activeTab.isDirty}
            title="Save (Ctrl+S)"
            className="flex items-center gap-1.5 rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-cyan-400 transition-colors disabled:opacity-40"
          >
            <Save className="h-3 w-3" />
            <span>{activeTab.isDirty ? 'Save *' : 'Saved'}</span>
          </button>

          {/* Quick Run in Editor Toolbar */}
          <button
            onClick={handleRun}
            title={langMeta.runnable ? `${langMeta.runnerLabel} (Ctrl+Enter)` : 'Execute in Terminal (Ctrl+Enter)'}
            className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-[11px] font-bold text-slate-950 hover:from-emerald-400 hover:to-teal-400 shadow-md shadow-emerald-950/40 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="h-3 w-3 fill-slate-950" />
            <span>Run Code</span>
          </button>
        </div>
      </div>

      {/* Monaco Editor Component */}
      <div className="flex-1 w-full overflow-hidden">
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
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            minimap: { enabled: true, maxColumn: 80 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            lineNumbersMinChars: 3,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            padding: { top: 8, bottom: 8 },
            renderLineHighlight: 'all',
          }}
        />
      </div>
    </div>
  );
};

export default MonacoEditorContainer;
