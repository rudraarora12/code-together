import React from 'react';
import { X, Plus, FileCode, FileCode2, FileText } from 'lucide-react';
import { useRoom } from '../context/RoomContext';

export default function EditorTabs({ onNewFileClick }) {
  const { 
    files, 
    openTabs, 
    activeFileId, 
    openFile, 
    closeTab,
    activeFilePresence 
  } = useRoom();

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'js' || ext === 'jsx') return <FileCode2 className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
    if (ext === 'ts' || ext === 'tsx') return <FileCode2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    if (ext === 'py') return <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    if (ext === 'cpp' || ext === 'c') return <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
    if (ext === 'java') return <FileCode className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    if (ext === 'json') return <FileCode2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    if (ext === 'html') return <FileCode className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
    if (ext === 'css') return <FileCode className="w-3.5 h-3.5 text-pink-400 shrink-0" />;
    if (ext === 'md') return <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    return <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />;
  };

  const openedFiles = openTabs
    .map(path => {
      const found = files.find(f => f.path === path || f.id === path);
      if (found) return found;
      const name = path.split('/').pop();
      return { id: path, path, name };
    })
    .filter(Boolean);

  return (
    <div className="h-9 bg-[#10121e] border-b border-gray-800/80 flex items-center justify-between select-none overflow-x-auto text-xs shrink-0">
      <div className="flex items-center h-full space-x-[1px] min-w-0">
        {openedFiles.map(file => {
          const isActive = file.path === activeFileId;
          const peersOnFile = activeFilePresence.get(file.path) || [];

          return (
            <div
              key={file.path}
              onClick={() => openFile(file.path)}
              className={`group h-full flex items-center space-x-2 px-3 cursor-pointer border-r border-gray-800/60 transition-colors ${
                isActive
                  ? 'bg-[#151726] text-cyan-200 border-t-2 border-t-cyan-400 font-medium'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#161828]'
              }`}
            >
              {getFileIcon(file.name)}
              <span className="truncate max-w-[140px] text-xs">{file.name}</span>

              {/* Collaborators presence pill on this tab */}
              {peersOnFile.length > 0 && (
                <div className="flex -space-x-1 shrink-0">
                  {peersOnFile.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      title={`${p.name} is in this file`}
                      className="w-3 h-3 rounded-full border border-gray-900 flex items-center justify-center text-[7px] font-bold text-gray-950"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(file.path);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-700/60 text-gray-400 hover:text-white transition-opacity ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Quick new file tab */}
        <button
          onClick={onNewFileClick}
          title="New File"
          className="h-full px-2.5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#161828] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
