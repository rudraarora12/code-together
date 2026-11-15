import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Play, 
  Square,
  RotateCw,
  UserPlus, 
  LogOut, 
  Copy, 
  Check, 
  MessageSquare, 
  Terminal, 
  Users, 
  Loader2, 
  Sparkles, 
  Code2,
  Download,
  Globe,
  Settings,
  FolderGit2
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { showToast } from './Toast';

export default function RoomHeader({ onOpenInvite, onOpenSettings }) {
  const { 
    roomId, 
    roomName,
    projectTypeName,
    badgeColor,
    files,
    isOwner,
    runStatus,
    runProject, 
    stopProject,
    restartProject,
    downloadZip,
    collaborators, 
    connectionStatus,
    activeTypingUser,
    isChatOpen,
    setIsChatOpen,
    isTerminalOpen,
    setIsTerminalOpen,
    isPreviewOpen,
    setIsPreviewOpen,
    previewUrl
  } = useRoom();

  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(false);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedId(true);
    showToast(`Room ID copied: ${roomId}`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleLeaveRoom = () => {
    if (window.confirm('Leave this collaboration room and return to Dashboard?')) {
      navigate('/dashboard');
    }
  };

  return (
    <header className="h-13 py-2 bg-[#0e101c] border-b border-gray-800/80 px-4 flex items-center justify-between select-none z-20 shrink-0">
      {/* Left: Brand, Project Name, Type Badge, Room ID */}
      <div className="flex items-center space-x-3">
        <Link to="/dashboard" className="flex items-center space-x-2 group" title="Return to Dashboard">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[1px] group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#121524] rounded-[7px] flex items-center justify-center">
              <Code2 className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
        </Link>

        <div className="h-4 w-[1px] bg-gray-800" />

        {/* Project Name & Framework Badge */}
        <div className="flex items-center space-x-2 min-w-0">
          <div className="flex items-center space-x-1.5 font-bold text-xs text-white truncate max-w-[200px]">
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{roomName}</span>
          </div>

          <span 
            className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold border shadow-sm shrink-0"
            style={{ 
              backgroundColor: `${badgeColor}15`, 
              color: badgeColor,
              borderColor: `${badgeColor}35`
            }}
          >
            {projectTypeName}
          </span>
        </div>

        {/* Room ID pill with copy */}
        <button
          onClick={copyRoomId}
          title="Click to copy Room ID"
          className="hidden sm:flex items-center space-x-1 px-2 py-0.5 rounded bg-gray-900/80 border border-gray-800 text-[11px] font-mono text-gray-400 hover:text-cyan-300 hover:border-gray-700 transition-colors shrink-0"
        >
          <span>ID: {roomId}</span>
          {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-500" />}
        </button>

        {/* Live Yjs Sync Status */}
        <div className="hidden lg:flex items-center space-x-1.5 text-[11px] font-mono shrink-0">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Synced (CRDT)</span>
          </span>
        </div>

        {/* Real-time Typing Indicator */}
        {activeTypingUser && (
          <div className="hidden md:flex items-center space-x-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
            <span>{activeTypingUser} is typing...</span>
          </div>
        )}
      </div>

      {/* Right Controls: Collaborators, Invite, Run Project, Preview, Sidebars */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Collaborators Stack */}
        <div 
          onClick={onOpenInvite}
          className="flex items-center -space-x-1.5 cursor-pointer hover:opacity-90 transition-opacity"
          title={`${collaborators.length} collaborators online. Click to invite.`}
        >
          {collaborators.slice(0, 4).map((c, i) => (
            <img
              key={c.id || i}
              src={c.avatar}
              alt={c.name}
              className="w-6 h-6 rounded-full object-cover ring-2 ring-[#0e101c]"
            />
          ))}
          {collaborators.length > 4 && (
            <div className="w-6 h-6 rounded-full bg-gray-800 ring-2 ring-[#0e101c] flex items-center justify-center text-[10px] text-gray-300 font-bold">
              +{collaborators.length - 4}
            </div>
          )}
        </div>

        {/* PROMINENT "Invite Teammates" Button */}
        <button
          onClick={onOpenInvite}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all hover:scale-105"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite Teammates</span>
        </button>

        {/* Dedicated RUN / STOP PROJECT Button */}
        {runStatus !== 'running' && runStatus !== 'building' ? (
          <button
            onClick={() => runProject()}
            title="Run the entire project in an isolated sandbox"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition-all hover:scale-105"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Project</span>
          </button>
        ) : (
          <div className="flex items-center space-x-1">
            <button
              onClick={stopProject}
              title="Stop running project"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-900/30 transition-all hover:scale-105"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
            <button
              onClick={() => restartProject()}
              title="Restart running project"
              className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Live Web Preview Toggle */}
        <button
          onClick={() => setIsPreviewOpen(!isPreviewOpen)}
          title="Toggle Web Application Preview"
          className={`relative flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            isPreviewOpen
              ? 'bg-indigo-600/30 border-indigo-500/50 text-cyan-300'
              : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Preview</span>
          {previewUrl && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse absolute -top-0.5 -right-0.5" />
          )}
        </button>

        {/* Download Project ZIP Button */}
        <button
          onClick={downloadZip}
          title="Download Complete Project as ZIP Archive"
          className="p-1.5 rounded-lg border bg-gray-900 border-gray-800 text-gray-400 hover:text-cyan-300 hover:bg-gray-800 transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Toggle Terminal Panel */}
        <button
          onClick={() => setIsTerminalOpen(!isTerminalOpen)}
          title="Toggle Shared Terminal & Output"
          className={`p-1.5 rounded-lg border transition-colors ${
            isTerminalOpen 
              ? 'bg-gray-800 border-indigo-500/50 text-cyan-300' 
              : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" />
        </button>

        {/* Toggle Chat & Collaborator Sidebar */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          title="Toggle Teammates & Chat Sidebar"
          className={`p-1.5 rounded-lg border transition-colors ${
            isChatOpen 
              ? 'bg-gray-800 border-indigo-500/50 text-cyan-300' 
              : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="Workspace Settings"
          className="p-1.5 rounded-lg border bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Leave Room Button */}
        <button
          onClick={handleLeaveRoom}
          title="Leave Room"
          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors ml-0.5"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
