import { writeFile } from '../api/fileApi';
import { markTabSaved } from '../store/slices/fileSlice';
import { toast } from 'sonner';

/**
 * Dispatches a command string directly into the active Terminal WebSocket stream
 */
export const sendTerminalCommand = (command) => {
  window.dispatchEvent(
    new CustomEvent('ide-run-command', {
      detail: { command },
    })
  );
};

/**
 * Returns compiler/runner command for a given file path
 */
export const getRunCommand = (filePath) => {
  if (!filePath) return null;
  const fileName = filePath.includes('/') ? filePath.split('/').pop() : filePath;
  const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
  const safeFile = `"${filePath}"`;

  switch (ext) {
    case 'cpp':
    case 'cc':
    case 'cxx':
      return `clear && echo -e "\\033[1;36m🔨 Compiling ${fileName} (C++17)...\\033[0m" && g++ -O2 -std=c++17 ${safeFile} -o /tmp/run_bin && echo -e "\\033[1;32m🚀 Running ${fileName}:\\033[0m" && /tmp/run_bin`;

    case 'c':
      return `clear && echo -e "\\033[1;36m🔨 Compiling ${fileName} (C)...\\033[0m" && gcc -O2 ${safeFile} -o /tmp/run_bin && echo -e "\\033[1;32m🚀 Running ${fileName}:\\033[0m" && /tmp/run_bin`;

    case 'py':
      return `clear && echo -e "\\033[1;32m🚀 Executing ${fileName} (Python 3):\\033[0m" && python3 ${safeFile}`;

    case 'js':
    case 'mjs':
    case 'cjs':
      return `clear && echo -e "\\033[1;32m🚀 Executing ${fileName} (Node.js):\\033[0m" && node ${safeFile}`;

    case 'ts':
      return `clear && echo -e "\\033[1;32m🚀 Executing ${fileName} (TypeScript):\\033[0m" && npx --yes tsx ${safeFile}`;

    case 'sh':
    case 'bash':
      return `clear && echo -e "\\033[1;32m🚀 Running Shell Script ${fileName}:\\033[0m" && bash ${safeFile}`;

    case 'html':
    case 'htm':
      return `clear && echo -e "\\033[1;36m🌐 Starting Web Server for ${fileName} on port 3000...\\033[0m" && (pkill -f "http.server 3000" 2>/dev/null || true) && python3 -m http.server 3000 --bind 0.0.0.0`;

    case 'go':
      return `clear && echo -e "\\033[1;32m🚀 Running ${fileName} (Go):\\033[0m" && go run ${safeFile}`;

    case 'rs':
      return `clear && echo -e "\\033[1;36m🔨 Compiling Rust ${fileName}...\\033[0m" && rustc ${safeFile} -o /tmp/run_bin && /tmp/run_bin`;

    case 'java':
      return `clear && echo -e "\\033[1;32m🚀 Running Java ${fileName}:\\033[0m" && java ${safeFile}`;

    default:
      return null;
  }
};

/**
 * Returns metadata (name, badge style, color, icon) for a file type
 */
export const getLanguageMeta = (filePath) => {
  if (!filePath) {
    return { name: 'No File', ext: '', color: 'text-slate-400', bg: 'bg-slate-800/40 text-slate-400 border-slate-700', runnable: false };
  }

  const fileName = filePath.includes('/') ? filePath.split('/').pop() : filePath;
  const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';

  switch (ext) {
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
    case 'h':
      return {
        name: 'C++17',
        ext: 'cpp',
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        badgeColor: 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300',
        runnable: true,
        runnerLabel: 'Compile & Run C++',
      };

    case 'c':
      return {
        name: 'C',
        ext: 'c',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        badgeColor: 'border-blue-500/40 bg-blue-950/40 text-blue-300',
        runnable: true,
        runnerLabel: 'Compile & Run C',
      };

    case 'py':
      return {
        name: 'Python 3',
        ext: 'py',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        badgeColor: 'border-yellow-500/40 bg-yellow-950/40 text-yellow-300',
        runnable: true,
        runnerLabel: 'Run Python',
      };

    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return {
        name: 'JavaScript',
        ext: 'js',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        badgeColor: 'border-amber-500/40 bg-amber-950/40 text-amber-300',
        runnable: true,
        runnerLabel: 'Run Node.js',
      };

    case 'ts':
    case 'tsx':
      return {
        name: 'TypeScript',
        ext: 'ts',
        color: 'text-sky-400',
        bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        badgeColor: 'border-sky-500/40 bg-sky-950/40 text-sky-300',
        runnable: true,
        runnerLabel: 'Run TypeScript',
      };

    case 'html':
      return {
        name: 'HTML5',
        ext: 'html',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        badgeColor: 'border-orange-500/40 bg-orange-950/40 text-orange-300',
        runnable: true,
        runnerLabel: 'Serve Preview',
      };

    case 'css':
      return {
        name: 'CSS3',
        ext: 'css',
        color: 'text-pink-400',
        bg: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
        badgeColor: 'border-pink-500/40 bg-pink-950/40 text-pink-300',
        runnable: false,
      };

    case 'json':
      return {
        name: 'JSON',
        ext: 'json',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        badgeColor: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300',
        runnable: false,
      };

    case 'sh':
    case 'bash':
      return {
        name: 'Shell',
        ext: 'sh',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        badgeColor: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300',
        runnable: true,
        runnerLabel: 'Run Bash Script',
      };

    case 'md':
      return {
        name: 'Markdown',
        ext: 'md',
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
        badgeColor: 'border-indigo-500/40 bg-indigo-950/40 text-indigo-300',
        runnable: false,
      };

    default:
      return {
        name: ext ? ext.toUpperCase() : 'Plain Text',
        ext,
        color: 'text-slate-400',
        bg: 'bg-slate-800/40 text-slate-400 border-slate-700',
        badgeColor: 'border-slate-700 bg-slate-900 text-slate-400',
        runnable: false,
      };
  }
};

/**
 * High-level helper: Auto-saves active file and executes it in the terminal
 */
export const executeActiveCode = async (activeTab, dispatch, setTerminalHeight) => {
  if (!activeTab) {
    toast.error('No file open to run');
    return;
  }

  // 1. Ensure terminal is open and visible
  if (setTerminalHeight) {
    setTerminalHeight((prev) => (prev < 200 ? 280 : prev));
  }

  // 2. Auto-save active file if dirty
  if (activeTab.isDirty) {
    try {
      await writeFile(activeTab.path, activeTab.content);
      if (dispatch) {
        dispatch(markTabSaved(activeTab.path));
      }
    } catch (err) {
      console.error('Failed to auto-save file before running', err);
      toast.error(`Could not save ${activeTab.name}`);
      return;
    }
  }

  // 3. Get language run command
  const runCmd = getRunCommand(activeTab.path);

  if (!runCmd) {
    toast.info(`No default compiler configured for .${activeTab.name.split('.').pop()} files. Running file directly...`);
    sendTerminalCommand(`clear && ./"${activeTab.path}"`);
    return;
  }

  // 4. Send command to terminal
  sendTerminalCommand(runCmd);
  const isHtml = activeTab.name.endsWith('.html') || activeTab.name.endsWith('.htm');
  if (isHtml) {
    toast.success(`🌐 Static server running on port 3000! Open Preview to view ${activeTab.name}.`);
  } else {
    toast.success(`⚡ Running ${activeTab.name}...`);
  }
};
