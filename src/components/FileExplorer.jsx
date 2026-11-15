import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileCode2, 
  FilePlus, 
  FolderPlus, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  ChevronDown,
  Check,
  X,
  FileText,
  Download,
  Upload,
  Search,
  RefreshCw
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { showToast } from './Toast';

export default function FileExplorer() {
  const { 
    files, 
    fileTree, 
    activeFileId, 
    openFile, 
    createFile, 
    createFolder, 
    renameFile, 
    deleteFile, 
    downloadZip,
    activeFilePresence
  } = useRoom();

  const [expandedFolders, setExpandedFolders] = useState({ src: true, components: true, pages: true });
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState('');
  const [editingPath, setEditingPath] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [activeMenuPath, setActiveMenuPath] = useState(null);
  const [deleteConfirmPath, setDeleteConfirmPath] = useState(null);

  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => ({ ...prev, [folderPath]: !prev[folderPath] }));
  };

  const handleCreateFileSubmit = (e) => {
    e.preventDefault();
    if (!newFilePath.trim()) {
      setIsCreatingFile(false);
      return;
    }
    createFile(newFilePath.trim());
    setNewFilePath('');
    setIsCreatingFile(false);
  };

  const handleCreateFolderSubmit = (e) => {
    e.preventDefault();
    if (!newFolderPath.trim()) {
      setIsCreatingFolder(false);
      return;
    }
    createFolder(newFolderPath.trim());
    setExpandedFolders(prev => ({ ...prev, [newFolderPath.trim()]: true }));
    setNewFolderPath('');
    setIsCreatingFolder(false);
  };

  const handleRenameSubmit = (oldPath) => {
    if (!editingName.trim()) {
      setEditingPath(null);
      return;
    }
    const parts = oldPath.split('/');
    parts[parts.length - 1] = editingName.trim();
    const newPath = parts.join('/');
    
    renameFile(oldPath, newPath);
    setEditingPath(null);
    setEditingName('');
  };

  const confirmDelete = (filePath) => {
    deleteFile(filePath);
    setDeleteConfirmPath(null);
    setActiveMenuPath(null);
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'js' || ext === 'jsx') return <FileCode2 className="w-4 h-4 text-yellow-400 shrink-0" />;
    if (ext === 'ts' || ext === 'tsx') return <FileCode2 className="w-4 h-4 text-blue-400 shrink-0" />;
    if (ext === 'py') return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
    if (ext === 'cpp' || ext === 'c') return <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />;
    if (ext === 'java') return <FileCode className="w-4 h-4 text-rose-400 shrink-0" />;
    if (ext === 'json') return <FileCode2 className="w-4 h-4 text-emerald-400 shrink-0" />;
    if (ext === 'html') return <FileCode className="w-4 h-4 text-orange-400 shrink-0" />;
    if (ext === 'css') return <FileCode className="w-4 h-4 text-pink-400 shrink-0" />;
    if (ext === 'md') return <FileText className="w-4 h-4 text-purple-400 shrink-0" />;
    return <FileText className="w-4 h-4 text-gray-400 shrink-0" />;
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node, depth = 0) => {
    if (node.isDir) {
      const isExpanded = !!expandedFolders[node.path];

      return (
        <div key={node.path} className="space-y-0.5">
          <div
            onClick={() => toggleFolder(node.path)}
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
            className="group flex items-center justify-between pr-2 py-1 rounded cursor-pointer hover:bg-gray-800/60 text-gray-300 hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-1.5 min-w-0">
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              )}
              <span className="truncate font-medium text-xs">{node.name}</span>
            </div>

            <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNewFilePath(`${node.path}/`);
                  setIsCreatingFile(true);
                  setExpandedFolders(prev => ({ ...prev, [node.path]: true }));
                }}
                title="New file in this folder"
                className="p-0.5 hover:text-cyan-300"
              >
                <FilePlus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // File Node
    const isActive = activeFileId === node.path;
    const isEditing = editingPath === node.path;
    const peersOnFile = activeFilePresence.get(node.path) || [];

    // Filter by search
    if (searchFilter && !node.name.toLowerCase().includes(searchFilter.toLowerCase())) {
      return null;
    }

    return (
      <div
        key={node.path}
        style={{ paddingLeft: `${depth * 14 + 14}px` }}
        onClick={() => openFile(node.path)}
        className={`group relative flex items-center justify-between pr-2 py-1 rounded cursor-pointer transition-colors ${
          isActive 
            ? 'bg-indigo-600/20 text-cyan-300 font-medium border-l-2 border-cyan-400' 
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
        }`}
      >
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {getFileIcon(node.name)}

          {isEditing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRenameSubmit(node.path);
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-1 flex-1"
            >
              <input
                type="text"
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="bg-gray-900 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white outline-none w-full"
                onBlur={() => handleRenameSubmit(node.path)}
              />
            </form>
          ) : (
            <span className="truncate text-xs">{node.name}</span>
          )}
        </div>

        {/* Presence Pills: Teammates currently in this file */}
        <div className="flex items-center space-x-1 shrink-0">
          {peersOnFile.length > 0 && (
            <div className="flex -space-x-1">
              {peersOnFile.map((p, idx) => (
                <div
                  key={p.id || idx}
                  title={`${p.name} is editing this file`}
                  className="w-3.5 h-3.5 rounded-full border border-gray-900 flex items-center justify-center text-[8px] font-bold text-gray-950"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          )}

          {/* Context actions */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingPath(node.path);
                setEditingName(node.name);
              }}
              title="Rename File"
              className="p-1 hover:text-white hover:bg-gray-700/50 rounded"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmPath(node.path);
              }}
              title="Delete File"
              className="p-1 hover:text-rose-400 hover:bg-gray-700/50 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#11131f] select-none text-xs border-r border-gray-800/80">
      {/* Explorer Top Header & Action Controls */}
      <div className="px-3 py-2 border-b border-gray-800/80 flex items-center justify-between shrink-0">
        <span className="font-bold text-gray-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          Project Explorer
          <span className="text-[10px] font-mono text-gray-500 font-normal">
            ({files.length})
          </span>
        </span>

        <div className="flex items-center space-x-1 text-gray-400">
          <button
            onClick={() => {
              setIsCreatingFile(true);
              setIsCreatingFolder(false);
              setNewFilePath('');
            }}
            title="New File"
            className="p-1 rounded hover:text-white hover:bg-gray-800 transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setIsCreatingFolder(true);
              setIsCreatingFile(false);
              setNewFolderPath('');
            }}
            title="New Folder"
            className="p-1 rounded hover:text-white hover:bg-gray-800 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={downloadZip}
            title="Download Complete Project as ZIP"
            className="p-1 rounded hover:text-cyan-400 hover:bg-gray-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Filter Input */}
      <div className="px-2 pt-2 shrink-0">
        <div className="relative">
          <Search className="w-3 h-3 text-gray-500 absolute left-2 top-2" />
          <input
            type="text"
            placeholder="Filter files..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-[#181a2b] border border-gray-800/80 rounded pl-7 pr-2 py-1 text-[11px] text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500/50"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2 top-2 text-gray-500 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main File Tree Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {/* New Folder Input Form */}
        {isCreatingFolder && (
          <form onSubmit={handleCreateFolderSubmit} className="flex items-center space-x-1 px-2 py-1 bg-gray-900 rounded border border-indigo-500/50 mb-1">
            <Folder className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={newFolderPath}
              onChange={(e) => setNewFolderPath(e.target.value)}
              placeholder="folder-name"
              className="flex-1 bg-transparent text-white text-xs outline-none"
              onBlur={() => !newFolderPath && setIsCreatingFolder(false)}
            />
            <button type="submit" className="text-emerald-400 hover:text-emerald-300">
              <Check className="w-3 h-3" />
            </button>
            <button type="button" onClick={() => setIsCreatingFolder(false)} className="text-rose-400 hover:text-rose-300">
              <X className="w-3 h-3" />
            </button>
          </form>
        )}

        {/* New File Input Form */}
        {isCreatingFile && (
          <form onSubmit={handleCreateFileSubmit} className="flex items-center space-x-1 px-2 py-1 bg-gray-900 rounded border border-indigo-500/50 mb-1">
            <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
              placeholder="src/filename.js"
              className="flex-1 bg-transparent text-white text-xs outline-none"
              onBlur={() => !newFilePath && setIsCreatingFile(false)}
            />
            <button type="submit" className="text-emerald-400 hover:text-emerald-300">
              <Check className="w-3 h-3" />
            </button>
            <button type="button" onClick={() => setIsCreatingFile(false)} className="text-rose-400 hover:text-rose-300">
              <X className="w-3 h-3" />
            </button>
          </form>
        )}

        {/* Hierarchical Tree */}
        {fileTree.map(node => renderTreeNode(node, 0))}

        {fileTree.length === 0 && !isCreatingFile && !isCreatingFolder && (
          <div className="py-8 text-center text-gray-500 text-xs">
            No files in project. Click + above to create one.
          </div>
        )}
      </div>

      {/* Bottom Footer Info */}
      <div className="p-2 border-t border-gray-800/80 bg-[#0e101a] flex items-center justify-between text-[11px] text-gray-500 shrink-0">
        <span>{files.length} project files</span>
        <button
          onClick={downloadZip}
          className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
        >
          <Download className="w-3 h-3" />
          <span>ZIP</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmPath && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161828] border border-gray-800 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <Trash2 className="w-5 h-5" />
              <h4 className="font-semibold text-white text-sm">Delete File</h4>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to delete <span className="font-mono text-cyan-300 bg-gray-900 px-1 py-0.5 rounded">{deleteConfirmPath}</span>? This will permanently remove it for all teammates in this room.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteConfirmPath(null)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteConfirmPath)}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-lg shadow-rose-600/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
