import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  LogIn, 
  Search, 
  Terminal, 
  Users, 
  Clock, 
  Code2, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  UploadCloud,
  FolderGit2,
  FolderOpen
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import UploadRoomModal from '../components/UploadRoomModal';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';

export default function DashboardPage() {
  const { user, recentRooms, recordRoomVisit, removeRecentRoom } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLangFilter, setSelectedLangFilter] = useState('all');

  // "Start Collaborating" Project Upload Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Join Room Modal state
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinRoomInput, setJoinRoomInput] = useState('');

  // Handle joining room via ID or Link
  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!joinRoomInput.trim()) return;

    let targetId = joinRoomInput.trim();
    // Parse link if user pasted full URL (e.g. http://localhost:5173/room/abc123)
    if (targetId.includes('/room/')) {
      const parts = targetId.split('/room/');
      targetId = parts[1].split('?')[0];
    }

    recordRoomVisit({
      id: targetId,
      name: `${targetId} Project`,
      language: 'javascript',
      isOwner: false,
      collaboratorsCount: 2,
      collaborators: [{ name: user?.name || 'You', avatar: user?.avatar }],
      filesCount: 1
    });

    showToast(`Joining room ${targetId}...`);
    setIsJoinOpen(false);
    navigate(`/room/${targetId}`);
  };

  // Filtered rooms
  const filteredRooms = recentRooms.filter((room) => {
    const matchesSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang = selectedLangFilter === 'all' || room.language === selectedLangFilter;
    return matchesSearch && matchesLang;
  });

  return (
    <div className="min-h-screen bg-[#0b0d17] text-gray-200 flex flex-col selection:bg-indigo-600/30 selection:text-cyan-200">
      <Navbar onNewRoom={() => setIsUploadModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hackathon Welcome Banner */}
        <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#121528] via-[#161a33] to-[#121424] border border-gray-800 shadow-2xl overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 z-10 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-[11px] font-mono text-cyan-300">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Full Project Collaboration IDE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Collaborate on Complete Projects
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Upload your complete project folder or ZIP archive, invite teammates with a single link, edit all files concurrently with live colored cursors, and run the project together in an isolated sandbox.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10">
            {/* Primary Action: Upload Project Folder & Create Room */}
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 flex items-center space-x-2 transition-all hover:scale-105"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Project Folder / ZIP</span>
            </button>

            <button
              onClick={() => setIsJoinOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-700/80 text-white font-semibold text-xs flex items-center space-x-2 transition-all"
            >
              <LogIn className="w-4 h-4 text-cyan-400" />
              <span>Join with Room Link / ID</span>
            </button>
          </div>
        </div>

        {/* Collaboration Capabilities Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#121422] border border-gray-800/80 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{recentRooms.length}</p>
              <p className="text-[11px] text-gray-400">Active Workspaces</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#121422] border border-gray-800/80 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">Yjs CRDT</p>
              <p className="text-[11px] text-gray-400">Multi-File Sync</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#121422] border border-gray-800/80 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">Isolated Sandbox</p>
              <p className="text-[11px] text-gray-400">Shared Runtime</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#121422] border border-gray-800/80 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">Zero-Conflict</p>
              <p className="text-[11px] text-gray-400">Auto Persistence</p>
            </div>
          </div>
        </div>

        {/* Recent Rooms Header & Filter Bar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Your Project Workspaces</h2>
              <p className="text-xs text-gray-400">Open existing rooms or upload a new project folder</p>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search project rooms..."
                  className="pl-8 pr-3 py-1.5 bg-[#121422] border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
                />
              </div>

              <select
                value={selectedLangFilter}
                onChange={(e) => setSelectedLangFilter(e.target.value)}
                className="bg-[#121422] border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Stacks</option>
                <option value="react-vite">React + Vite</option>
                <option value="javascript">Node.js</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>
          </div>

          {/* Rooms Grid */}
          {filteredRooms.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-gray-800 rounded-2xl bg-[#121422]/40 space-y-3">
              <FolderOpen className="w-10 h-10 text-cyan-400 mx-auto" />
              <p className="text-sm text-gray-300 font-medium">No project workspaces found</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Upload your complete project folder or ZIP (React, Node, Python, C++, Java, etc.) to start collaborating.
              </p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors inline-flex items-center space-x-1.5"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Project Folder</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => navigate(`/room/${room.id}`)}
                  className="group relative p-5 rounded-2xl bg-[#121424] border border-gray-800/80 hover:border-indigo-500/50 hover:bg-[#15182c] transition-all cursor-pointer shadow-lg space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-cyan-400">
                        <FolderGit2 className="w-5 h-5" />
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentRoom(room.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-all"
                        title="Remove from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {room.name}
                      </h3>
                      <p className="text-[11px] font-mono text-gray-500 truncate mt-0.5">
                        Room ID: {room.id}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-800/60 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-[11px] text-gray-400">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{room.collaboratorsCount || 1} online</span>
                    </div>

                    <span className="flex items-center space-x-1 text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform text-xs">
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Upload Project Folder Modal */}
      <UploadRoomModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* Join Room Modal */}
      <Modal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        title="Join Collaborative Workspace"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleJoinRoom} className="space-y-4 text-xs">
          <p className="text-gray-400 leading-relaxed">
            Enter the Room ID or paste the full invitation link sent by your teammate.
          </p>

          <div className="space-y-1.5">
            <label className="font-semibold text-gray-300">Room ID or Link</label>
            <input
              type="text"
              required
              autoFocus
              value={joinRoomInput}
              onChange={(e) => setJoinRoomInput(e.target.value)}
              placeholder="e.g. proj-abc123 or http://localhost:5173/room/proj-abc123"
              className="w-full bg-[#181a2b] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsJoinOpen(false)}
              className="px-3.5 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold shadow-md shadow-indigo-600/25 transition-transform hover:scale-105"
            >
              Join Project Room
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
