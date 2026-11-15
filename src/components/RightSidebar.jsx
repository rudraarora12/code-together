import React, { useState } from 'react';
import { 
  MessageSquare, 
  Users, 
  UserPlus, 
  ChevronRight, 
  X, 
  Crown,
  Send,
  Sparkles,
  FileCode
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';

export default function RightSidebar({ onOpenInvite }) {
  const { 
    collaborators, 
    messages, 
    sendMessage, 
    isChatOpen, 
    setIsChatOpen,
    activeSidebarTab,
    setActiveSidebarTab,
    openFile
  } = useRoom();

  const { user } = useAuth();
  const [chatInput, setChatInput] = useState('');

  if (!isChatOpen) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput('');
  };

  const handleQuickEmoji = (emoji) => {
    sendMessage(emoji);
  };

  return (
    <aside className="w-72 bg-[#10121f] border-l border-gray-800/80 flex flex-col h-full select-none z-10 shrink-0">
      {/* Top Tab Bar */}
      <div className="h-10 bg-[#121424] border-b border-gray-800/80 px-2 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveSidebarTab('chat')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium transition-colors ${
              activeSidebarTab === 'chat'
                ? 'bg-gray-800 text-cyan-300 shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
            {messages.length > 0 && (
              <span className="text-[9px] bg-indigo-500 text-white rounded-full px-1.5 py-0.2 font-bold">
                {messages.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSidebarTab('collaborators')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium transition-colors ${
              activeSidebarTab === 'collaborators'
                ? 'bg-gray-800 text-cyan-300 shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Teammates</span>
            <span className="text-[9px] bg-emerald-600 text-white rounded-full px-1.5 py-0.2 font-bold">
              {collaborators.length}
            </span>
          </button>
        </div>

        {/* Close/Collapse button */}
        <button
          onClick={() => setIsChatOpen(false)}
          title="Collapse Sidebar"
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tab 1: Live Chat */}
      {activeSidebarTab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs select-text">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 py-8 text-center space-y-2">
                <MessageSquare className="w-6 h-6 opacity-30 text-cyan-400" />
                <p className="text-xs">No messages yet.</p>
                <p className="text-[11px] text-gray-600">Send a message to your teammates.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user?.id || msg.senderName?.includes('(You)');
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-2 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    {msg.avatar ? (
                      <img
                        src={msg.avatar}
                        alt={msg.senderName}
                        className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5">
                        {(msg.senderName || 'T').charAt(0)}
                      </div>
                    )}

                    <div className={`max-w-[85%] space-y-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center space-x-1.5 text-[9px] text-gray-400">
                        <span className="font-semibold text-gray-300">{msg.senderName}</span>
                        <span className="text-gray-600 font-mono">{msg.timestamp}</span>
                      </div>
                      <div
                        className={`px-2.5 py-1.5 rounded-xl text-xs break-words shadow-sm ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick emoji reaction row */}
          <div className="px-2 py-1 border-t border-gray-800/60 flex items-center justify-around bg-gray-950/40 text-xs shrink-0">
            {['👍', '🚀', '🔥', '💡', '🎉'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleQuickEmoji(emoji)}
                className="hover:scale-125 transition-transform p-0.5"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Chat message input */}
          <form onSubmit={handleSend} className="p-2.5 border-t border-gray-800 bg-[#0d0f19] shrink-0">
            <div className="flex items-center space-x-1.5 bg-gray-950 border border-gray-800 rounded-xl px-2.5 py-1.5 focus-within:border-cyan-500 transition-colors">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message teammates..."
                className="flex-1 bg-transparent text-white text-xs outline-none"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="text-cyan-400 hover:text-cyan-300 disabled:opacity-40 transition-opacity"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Connected Teammates */}
      {activeSidebarTab === 'collaborators' && (
        <div className="flex-1 flex flex-col p-3 space-y-3 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Connected ({collaborators.length})
            </span>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/40">
              ● Live Yjs Sync
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {collaborators.map((c, i) => (
              <div
                key={c.id || i}
                className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 flex flex-col space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="relative">
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-7 h-7 rounded-full object-cover ring-2"
                        style={{ ringColor: c.color }}
                      />
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-[#10121f]"
                        style={{ backgroundColor: c.color }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                          {c.name}
                        </span>
                        {c.isOwner && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                      </div>
                      <span
                        className="text-[9px] font-mono px-1 rounded inline-block"
                        style={{ backgroundColor: `${c.color}20`, color: c.color }}
                      >
                        {c.role}
                      </span>
                    </div>
                  </div>

                  {/* Cursor color dot */}
                  <div
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: c.color }}
                    title={`Assigned cursor color: ${c.color}`}
                  />
                </div>

                {/* Active file information */}
                {c.activeFileId ? (
                  <div 
                    onClick={() => openFile(c.activeFileId)}
                    className="flex items-center space-x-1.5 text-[10px] text-cyan-300 bg-gray-950/60 px-2 py-1 rounded border border-gray-800 cursor-pointer hover:border-cyan-500/50 transition-colors"
                    title={`Click to jump to ${c.activeFileId}`}
                  >
                    <FileCode className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">Editing: {c.activeFileId}</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-500 italic pl-1">
                    Viewing workspace
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Invite button */}
          <button
            onClick={onOpenInvite}
            className="w-full py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/25 transition-all shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite More Teammates</span>
          </button>
        </div>
      )}
    </aside>
  );
}
