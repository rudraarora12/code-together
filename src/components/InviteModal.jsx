import React, { useState } from 'react';
import Modal from './Modal';
import { Copy, Check, Users, Link2, Sparkles, UserPlus } from 'lucide-react';
import { showToast } from './Toast';

export default function InviteModal({ isOpen, onClose, roomId, roomName, collaborators }) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${window.location.origin}/room/${roomId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    showToast('Invitation link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Teammates to Code" maxWidth="max-w-md">
      <div className="space-y-4 text-xs">
        {/* Room Header Info */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-3 flex items-center justify-between">
          <div className="truncate pr-2">
            <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Active Workspace</span>
            <h4 className="text-sm font-semibold text-white truncate">{roomName}</h4>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg shrink-0">
            <Users className="w-3.5 h-3.5" />
            <span className="font-semibold">{collaborators.length} Connected</span>
          </div>
        </div>

        <p className="text-gray-400 text-xs leading-relaxed">
          Share this link with your teammates. All collaborators in this room will access the complete project file tree, edit different files or the same file with live colored cursors, and run the project using one shared isolated runtime.
        </p>

        {/* Shareable Link Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-cyan-400" />
            Room Invitation URL
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              onClick={(e) => e.target.select()}
              className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 truncate focus:outline-none focus:border-indigo-500 select-all"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-xl font-semibold text-xs flex items-center space-x-1.5 transition-all shadow-md shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Quick Room ID reference */}
        <div className="p-3 bg-gray-950/60 border border-dashed border-gray-800 rounded-xl flex items-center justify-between text-[11px] text-gray-400 font-mono">
          <span>Room ID: <strong className="text-white">{roomId}</strong></span>
          <span className="text-[10px] text-cyan-400">Yjs CRDT Real-Time Sync</span>
        </div>

        {/* Live connected users preview */}
        <div className="pt-2 border-t border-gray-800/80">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
            Teammates in this room ({collaborators.length})
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {collaborators.map((c, i) => (
              <div
                key={c.id || i}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-900/40 border border-gray-800/60"
              >
                <div className="flex items-center space-x-2">
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-5 h-5 rounded-full object-cover ring-1"
                    style={{ ringColor: c.color }}
                  />
                  <span className="font-medium text-white">{c.name}</span>
                </div>
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${c.color}20`, color: c.color }}
                >
                  {c.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
