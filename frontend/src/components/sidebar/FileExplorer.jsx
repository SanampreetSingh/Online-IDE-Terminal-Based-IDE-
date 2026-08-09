import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Folder,
  FileCode,
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
  RefreshCw,
  Trash2,
  Edit2
} from 'lucide-react';
import { getFileTree, readFile, createEntry, deleteEntry, renameEntry } from '../../api/fileApi';
import { setFileTree, openTab } from '../../store/slices/fileSlice';
import { toast } from 'sonner';

const TreeNode = ({ node, level = 0, onFileClick, onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(node.name);

  const isDirectory = node.type === 'directory';

  const handleClick = async () => {
    if (isDirectory) {
      setIsOpen(!isOpen);
    } else {
      onFileClick(node);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${node.name}?`)) return;
    try {
      await deleteEntry(node.path);
      toast.success(`Deleted ${node.name}`);
      onRefresh();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleRename = async (e) => {
    e.stopPropagation();
    if (isEditing) {
      if (newName && newName !== node.name) {
        try {
          const parentDir = node.path.includes('/') ? node.path.substring(0, node.path.lastIndexOf('/')) : '';
          const newPath = parentDir ? `${parentDir}/${newName}` : newName;
          await renameEntry(node.path, newPath);
          toast.success('Renamed successfully');
          onRefresh();
        } catch (err) {
          toast.error('Failed to rename');
        }
      }
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        className="group flex items-center justify-between py-1 pr-2 text-xs text-slate-300 hover:bg-slate-800/60 cursor-pointer rounded transition-colors"
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          {isDirectory ? (
            <>
              {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />}
              <Folder className="h-4 w-4 shrink-0 text-cyan-400" />
            </>
          ) : (
            <>
              <span className="w-3.5 shrink-0" />
              <FileCode className="h-4 w-4 shrink-0 text-blue-400" />
            </>
          )}

          {isEditing ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename(e)}
              onBlur={handleRename}
              autoFocus
              className="rounded bg-slate-950 px-1 py-0.5 text-xs text-slate-100 outline-none border border-cyan-500"
            />
          ) : (
            <span className="truncate">{node.name}</span>
          )}
        </div>

        {/* Action icons on hover */}
        <div className="hidden items-center gap-1 group-hover:flex">
          <button onClick={handleRename} title="Rename" className="text-slate-400 hover:text-cyan-400">
            <Edit2 className="h-3 w-3" />
          </button>
          <button onClick={handleDelete} title="Delete" className="text-slate-400 hover:text-red-400">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {isDirectory && isOpen && node.children && (
        <div>
          {node.children.map((child, index) => (
            <TreeNode
              key={child.path || index}
              node={child}
              level={level + 1}
              onFileClick={onFileClick}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileExplorer = () => {
  const dispatch = useDispatch();
  const tree = useSelector((state) => state.file.tree);
  const [loading, setLoading] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [creatingType, setCreatingType] = useState(null);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await getFileTree();
      dispatch(setFileTree(res.tree || []));
    } catch (err) {
      console.error('Failed to load file tree', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const handleFileClick = async (node) => {
    try {
      const res = await readFile(node.path);
      dispatch(openTab({ path: node.path, name: node.name, content: res.content || '' }));
    } catch (err) {
      toast.error(`Failed to read file ${node.name}`);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newItemName || !creatingType) return;
    try {
      await createEntry(newItemName, creatingType);
      toast.success(`Created ${creatingType} ${newItemName}`);
      setNewItemName('');
      setCreatingType(null);
      fetchTree();
    } catch (err) {
      toast.error('Failed to create entry');
    }
  };

  return (
    <div className="flex h-full w-60 flex-col border-r border-slate-800 bg-slate-900 select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
        <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Explorer</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCreatingType('file')}
            title="New File"
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-400"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setCreatingType('directory')}
            title="New Folder"
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-400"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={fetchTree}
            title="Refresh Explorer"
            className={`rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Create Input */}
      {creatingType && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-slate-800">
          <input
            type="text"
            placeholder={`New ${creatingType} name...`}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            autoFocus
            className="w-full rounded bg-slate-950 px-2 py-1 text-xs text-slate-100 border border-cyan-500 outline-none"
          />
        </form>
      )}

      {/* File Tree Items */}
      <div className="flex-1 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-800">
        {tree && tree.length > 0 ? (
          tree.map((node, i) => (
            <TreeNode
              key={node.path || i}
              node={node}
              onFileClick={handleFileClick}
              onRefresh={fetchTree}
            />
          ))
        ) : (
          <div className="px-3 py-6 text-center text-xs text-slate-500">
            No files in workspace. Click + to create one.
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
