import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Folder,
  FolderOpen,
  FileCode,
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
  RefreshCw,
  Trash2,
  Edit2,
  FolderArchive
} from 'lucide-react';
import { getFileTree, readFile, createEntry, deleteEntry, renameEntry } from '../../api/fileApi';
import {
  setFileTree,
  openTab,
  setSelectedPath,
  closeTabsUnderPath,
  renameTabsUnderPath
} from '../../store/slices/fileSlice';
import { getLanguageMeta } from '../../utils/codeRunner';
import { toast } from 'sonner';

// Helper to get parent directory from a path
const getParentDir = (filePath) => {
  if (!filePath || !filePath.includes('/')) return '';
  return filePath.substring(0, filePath.lastIndexOf('/'));
};

// Inline creation input component
const InlineCreateRow = ({ level, type, parentPath, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (name.trim()) {
        onSubmit(name.trim(), type, parentPath);
      } else {
        onCancel();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    if (name.trim()) {
      onSubmit(name.trim(), type, parentPath);
    } else {
      onCancel();
    }
  };

  return (
    <div
      style={{ paddingLeft: `${level * 12 + 10}px` }}
      className="flex items-center gap-1.5 py-1 pr-2 bg-slate-800/40 border-l-2 border-cyan-400"
    >
      <span className="w-3.5 shrink-0" />
      {type === 'directory' ? (
        <Folder className="h-4 w-4 shrink-0 text-amber-400" />
      ) : (
        <FileCode className="h-4 w-4 shrink-0 text-cyan-400" />
      )}
      <input
        ref={inputRef}
        type="text"
        value={name}
        placeholder={type === 'directory' ? 'folder-name' : 'filename.ext'}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-full rounded bg-slate-950 px-1.5 py-0.5 text-xs text-slate-100 outline-none border border-cyan-500 font-mono shadow-inner"
      />
    </div>
  );
};

const TreeNode = ({
  node,
  level = 0,
  expandedPaths,
  selectedPath,
  creatingState,
  onFileClick,
  onFolderClick,
  onStartCreate,
  onSubmitCreate,
  onCancelCreate,
  onRefresh,
  onContextMenu
}) => {
  const dispatch = useDispatch();
  const isDirectory = node.type === 'directory';
  const isOpen = !!expandedPaths[node.path];
  const isSelected = selectedPath === node.path;

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);

  const handleClick = (e) => {
    e.stopPropagation();
    if (isDirectory) {
      onFolderClick(node);
    } else {
      onFileClick(node);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${node.name}"${isDirectory ? ' and its contents' : ''}?`)) {
      return;
    }
    try {
      await deleteEntry(node.path);
      dispatch(closeTabsUnderPath(node.path));
      toast.success(`Deleted ${node.name}`);
      onRefresh();
    } catch (err) {
      toast.error(`Failed to delete ${node.name}`);
    }
  };

  const handleRenameSubmit = async () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== node.name) {
      try {
        const parentDir = getParentDir(node.path);
        const newPath = parentDir ? `${parentDir}/${trimmed}` : trimmed;
        await renameEntry(node.path, newPath);
        dispatch(renameTabsUnderPath({ oldPath: node.path, newPath }));
        toast.success(`Renamed to ${trimmed}`);
        onRefresh();
      } catch (err) {
        toast.error(`Failed to rename ${node.name}`);
      }
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setRenameValue(node.name);
      setIsRenaming(false);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, node);
        }}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        className={`group relative flex items-center justify-between py-1 pr-2 text-xs cursor-pointer rounded transition-colors select-none ${
          isSelected
            ? 'bg-slate-800 text-cyan-300 font-medium'
            : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
        }`}
      >
        <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0 pr-1">
          {isDirectory ? (
            <>
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              )}
              {isOpen ? (
                <FolderOpen className="h-4 w-4 shrink-0 text-amber-400" />
              ) : (
                <Folder className="h-4 w-4 shrink-0 text-amber-400/90" />
              )}
            </>
          ) : (
            <>
              <span className="w-3.5 shrink-0" />
              <FileCode className={`h-4 w-4 shrink-0 ${getLanguageMeta(node.path).color}`} />
            </>
          )}

          {isRenaming ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameSubmit}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              className="rounded bg-slate-950 px-1 py-0.5 text-xs text-slate-100 outline-none border border-cyan-500 font-mono w-full"
            />
          ) : (
            <span className="truncate">{node.name}</span>
          )}
        </div>

        {/* Action icons on hover */}
        {!isRenaming && (
          <div className="hidden items-center gap-1 group-hover:flex shrink-0">
            {isDirectory ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartCreate(node.path, 'file');
                  }}
                  title="New File inside folder"
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-cyan-400"
                >
                  <FilePlus className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartCreate(node.path, 'directory');
                  }}
                  title="New Folder inside folder"
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-cyan-400"
                >
                  <FolderPlus className="h-3 w-3" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartCreate(getParentDir(node.path), 'file');
                  }}
                  title="New File in this folder"
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-cyan-400"
                >
                  <FilePlus className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartCreate(getParentDir(node.path), 'directory');
                  }}
                  title="New Folder in this folder"
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-cyan-400"
                >
                  <FolderPlus className="h-3 w-3" />
                </button>
              </>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsRenaming(true);
              }}
              title="Rename"
              className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-cyan-400"
            >
              <Edit2 className="h-3 w-3" />
            </button>
            <button
              onClick={handleDelete}
              title="Delete"
              className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Directory children & inline create row */}
      {isDirectory && isOpen && (
        <div>
          {/* If creating directly inside this folder, render inline input at top of children */}
          {creatingState && creatingState.parentPath === node.path && (
            <InlineCreateRow
              level={level + 1}
              type={creatingState.type}
              parentPath={node.path}
              onSubmit={onSubmitCreate}
              onCancel={onCancelCreate}
            />
          )}

          {node.children &&
            node.children.map((child, index) => (
              <TreeNode
                key={child.path || `${child.name}-${index}`}
                node={child}
                level={level + 1}
                expandedPaths={expandedPaths}
                selectedPath={selectedPath}
                creatingState={creatingState}
                onFileClick={onFileClick}
                onFolderClick={onFolderClick}
                onStartCreate={onStartCreate}
                onSubmitCreate={onSubmitCreate}
                onCancelCreate={onCancelCreate}
                onRefresh={onRefresh}
                onContextMenu={onContextMenu}
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
  const selectedPath = useSelector((state) => state.file.selectedPath);

  const [loading, setLoading] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState({});
  const [selectedNode, setSelectedNodeState] = useState(null);
  const [creatingState, setCreatingState] = useState(null); // { parentPath: string, type: 'file' | 'directory' }
  const [contextMenu, setContextMenu] = useState(null); // { x: number, y: number, node: object | null }

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFileTree();
      dispatch(setFileTree(res.tree || []));
    } catch (err) {
      console.error('Failed to load file tree', err);
      toast.error('Failed to load workspace file tree');
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleToggleFolder = (node) => {
    setSelectedNodeState(node);
    dispatch(setSelectedPath(node.path));
    setExpandedPaths((prev) => ({
      ...prev,
      [node.path]: !prev[node.path]
    }));
  };

  const handleFileClick = async (node) => {
    setSelectedNodeState(node);
    dispatch(setSelectedPath(node.path));
    try {
      const res = await readFile(node.path);
      dispatch(openTab({ path: node.path, name: node.name, content: res.content || '' }));
    } catch (err) {
      toast.error(`Failed to read file ${node.name}`);
    }
  };

  const handleStartCreate = (parentPath, type) => {
    // If creating inside a folder, ensure that folder is expanded
    if (parentPath) {
      // expand all path segments
      const segments = parentPath.split('/');
      let current = '';
      const toExpand = {};
      segments.forEach((seg) => {
        current = current ? `${current}/${seg}` : seg;
        toExpand[current] = true;
      });
      setExpandedPaths((prev) => ({ ...prev, ...toExpand }));
    }
    setCreatingState({ parentPath: parentPath || '', type });
  };

  const handleCancelCreate = () => {
    setCreatingState(null);
  };

  const handleSubmitCreate = async (name, type, parentPath) => {
    if (!name) {
      setCreatingState(null);
      return;
    }

    const fullPath = parentPath ? `${parentPath}/${name}` : name;

    try {
      await createEntry(fullPath, type);
      toast.success(`Created ${type} "${name}"`);
      setCreatingState(null);

      // If created inside a parent path, make sure parent is expanded
      if (parentPath) {
        setExpandedPaths((prev) => ({ ...prev, [parentPath]: true }));
      }

      await fetchTree();

      // If it's a file, automatically open it in Monaco editor tab
      if (type === 'file') {
        const fileName = fullPath.includes('/') ? fullPath.split('/').pop() : fullPath;
        dispatch(setSelectedPath(fullPath));
        dispatch(openTab({ path: fullPath, name: fileName, content: '' }));
      }
    } catch (err) {
      console.error('Failed to create entry', err);
      toast.error(`Failed to create ${type} "${name}"`);
    }
  };

  // Header "New File" / "New Folder" click handler
  const handleHeaderCreate = (type) => {
    let targetParent = '';
    if (selectedNode) {
      if (selectedNode.type === 'directory') {
        targetParent = selectedNode.path;
      } else {
        targetParent = getParentDir(selectedNode.path);
      }
    }
    handleStartCreate(targetParent, type);
  };

  const handleCollapseAll = () => {
    setExpandedPaths({});
  };

  const handleContextMenu = (e, node = null) => {
    e.preventDefault();
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 180),
      y: Math.min(e.clientY, window.innerHeight - 200),
      node
    });
  };

  return (
    <div
      onContextMenu={(e) => handleContextMenu(e, null)}
      className="flex h-full w-64 flex-col border-r border-slate-800 bg-slate-900 select-none text-slate-200"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 bg-slate-900/90">
        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Explorer</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => handleHeaderCreate('file')}
            title={
              selectedNode
                ? `New File inside ${selectedNode.type === 'directory' ? selectedNode.name : 'current folder'}`
                : 'New File in root'
            }
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleHeaderCreate('directory')}
            title={
              selectedNode
                ? `New Folder inside ${selectedNode.type === 'directory' ? selectedNode.name : 'current folder'}`
                : 'New Folder in root'
            }
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleCollapseAll}
            title="Collapse All Folders"
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
          >
            <FolderArchive className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={fetchTree}
            title="Refresh Explorer"
            className={`rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors ${
              loading ? 'animate-spin text-cyan-400' : ''
            }`}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Target Directory Hint if creating inside a subfolder */}
      {creatingState && (
        <div className="bg-cyan-950/30 border-b border-cyan-800/40 px-3 py-1 text-[10px] text-cyan-300 font-mono flex items-center justify-between">
          <span>
            Creating {creatingState.type} in: <strong className="text-cyan-200">/{creatingState.parentPath || 'root'}</strong>
          </span>
          <button
            onClick={handleCancelCreate}
            className="text-slate-400 hover:text-red-400 text-xs px-1"
            title="Cancel (Esc)"
          >
            ✕
          </button>
        </div>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-800">
        {/* Root level create input when parentPath is '' */}
        {creatingState && creatingState.parentPath === '' && (
          <InlineCreateRow
            level={0}
            type={creatingState.type}
            parentPath=""
            onSubmit={handleSubmitCreate}
            onCancel={handleCancelCreate}
          />
        )}

        {tree && tree.length > 0 ? (
          tree.map((node, i) => (
            <TreeNode
              key={node.path || `${node.name}-${i}`}
              node={node}
              level={0}
              expandedPaths={expandedPaths}
              selectedPath={selectedPath}
              creatingState={creatingState}
              onFileClick={handleFileClick}
              onFolderClick={handleToggleFolder}
              onStartCreate={handleStartCreate}
              onSubmitCreate={handleSubmitCreate}
              onCancelCreate={handleCancelCreate}
              onRefresh={fetchTree}
              onContextMenu={handleContextMenu}
            />
          ))
        ) : (
          <div className="px-3 py-8 text-center text-xs text-slate-500">
            <p className="mb-2">No files in workspace</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => handleStartCreate('', 'file')}
                className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] text-cyan-400 hover:bg-slate-700"
              >
                <FilePlus className="h-3 w-3" /> New File
              </button>
              <button
                onClick={() => handleStartCreate('', 'directory')}
                className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] text-amber-400 hover:bg-slate-700"
              >
                <FolderPlus className="h-3 w-3" /> New Folder
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Click Context Menu */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 min-w-[160px] rounded-lg border border-slate-700 bg-slate-900 py-1 text-xs text-slate-200 shadow-2xl backdrop-blur-md"
        >
          {contextMenu.node ? (
            <>
              <div className="px-3 py-1 font-semibold text-[10px] text-slate-400 border-b border-slate-800 truncate">
                {contextMenu.node.name}
              </div>
              <button
                onClick={() => {
                  const targetDir =
                    contextMenu.node.type === 'directory'
                      ? contextMenu.node.path
                      : getParentDir(contextMenu.node.path);
                  handleStartCreate(targetDir, 'file');
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-cyan-500/10 hover:text-cyan-400 text-left"
              >
                <FilePlus className="h-3.5 w-3.5" />
                <span>New File</span>
              </button>
              <button
                onClick={() => {
                  const targetDir =
                    contextMenu.node.type === 'directory'
                      ? contextMenu.node.path
                      : getParentDir(contextMenu.node.path);
                  handleStartCreate(targetDir, 'directory');
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-cyan-500/10 hover:text-cyan-400 text-left"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                <span>New Folder</span>
              </button>
              <div className="my-1 border-t border-slate-800" />
              <button
                onClick={async () => {
                  const node = contextMenu.node;
                  setContextMenu(null);
                  if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
                    try {
                      await deleteEntry(node.path);
                      dispatch(closeTabsUnderPath(node.path));
                      toast.success(`Deleted ${node.name}`);
                      fetchTree();
                    } catch (err) {
                      toast.error(`Failed to delete ${node.name}`);
                    }
                  }
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-red-400 hover:bg-red-500/10 text-left"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  handleStartCreate('', 'file');
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-cyan-500/10 hover:text-cyan-400 text-left"
              >
                <FilePlus className="h-3.5 w-3.5" />
                <span>New File</span>
              </button>
              <button
                onClick={() => {
                  handleStartCreate('', 'directory');
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-cyan-500/10 hover:text-cyan-400 text-left"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                <span>New Folder</span>
              </button>
              <div className="my-1 border-t border-slate-800" />
              <button
                onClick={() => {
                  fetchTree();
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-slate-800 text-left"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
