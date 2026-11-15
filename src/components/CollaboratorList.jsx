import React from 'react';
import { Users, UserPlus, Crown, Shield, Circle, Mic, MicOff } from 'lucide-react';
import { useRoom } from '../context/RoomContext';

export default function CollaboratorList({ onOpenInvite }) {
  const { collaborators, roomName } = useRoom();

  return (
    <div className="h-full flex flex-col bg-[#11131f] select-none text-xs">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-gray-200 tracking-wide text-xs">Participants</span>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
          {collaborators.length} Online
        </span>
      </div>

      {/* Collaborator Roster */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold px-1">
          Active Collaborators
        </div>

        {collaborators.map((c) => {
          const isOwner = c.role?.toLowerCase().includes('owner');

          return (
            <div
              key={c.id}
              className="p-2.5 rounded-xl bg-gray-900/40 border border-gray-800/80 hover:border-gray-700/80 transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center space-x-2.5">
                {/* Avatar with status badge */}
                <div className="relative">
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-8 h-8 rounded-full object-cover ring-2"
                    style={{ ringColor: c.color }}
                  />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#11131f]"
                    style={{ backgroundColor: c.color }}
                  />
                </div>

                {/* Details */}
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-medium text-white text-xs truncate max-w-[110px]">
                      {c.name}
                    </span>
                    {isOwner && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                  </div>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <span
                      className="text-[9px] font-mono px-1 rounded"
                      style={{ 
                        backgroundColor: `${c.color}20`,
                        color: c.color
                      }}
                    >
                      {c.role}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      Line {c.cursor?.line || 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cursor Color Indicator Tag */}
              <div
                className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: c.color }}
                title={`Assigned cursor color: ${c.color}`}
              />
            </div>
          );
        })}
      </div>

      {/* Invite Button Footer */}
      <div className="p-3 border-t border-gray-800 bg-[#0d0f19]">
        <button
          onClick={onOpenInvite}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-colors shadow-md shadow-indigo-600/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Team Members</span>
        </button>
      </div>
    </div>
  );
}
