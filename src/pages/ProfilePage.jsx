import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Briefcase, 
  Code2, 
  Clock, 
  Shield, 
  Calendar, 
  Edit3, 
  Check, 
  ArrowRight,
  Terminal,
  Sparkles
} from 'lucide-react';
import { showToast } from '../components/Toast';

const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80'
];

export default function ProfilePage() {
  const { user, updateProfile, recentRooms } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState(user?.role || '');
  const [bio, setBio] = useState(user?.bio || 'Building collaborative real-time software systems.');
  const [avatar, setAvatar] = useState(user?.avatar || AVATARS[0]);

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile({ name, role, bio, avatar });
    setIsEditing(false);
    showToast('Profile updated successfully');
  };

  return (
    <div className="min-h-screen bg-[#0b0d17] text-gray-200 flex flex-col selection:bg-indigo-600/30 selection:text-cyan-200">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Profile Card Header */}
        <div className="relative p-6 sm:p-8 rounded-2xl bg-[#121422] border border-gray-800 shadow-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <div className="relative">
                <img
                  src={user?.avatar || avatar}
                  alt={user?.name}
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-cyan-500/40 shadow-xl"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[#121422]" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">{user?.name}</h1>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-cyan-400 border border-indigo-500/20">
                    Pro Dev
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-medium">{user?.role}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl text-xs font-semibold text-white flex items-center space-x-2 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>
          </div>

          <p className="mt-6 text-xs text-gray-300 max-w-2xl leading-relaxed bg-gray-950/40 p-3 rounded-xl border border-gray-800/60">
            {user?.bio || bio}
          </p>
        </div>

        {/* Edit Profile Form Modal/Accordion */}
        {isEditing && (
          <form onSubmit={handleSave} className="p-6 rounded-2xl bg-[#141728] border border-indigo-500/40 shadow-xl space-y-4 text-xs animate-fade-in">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Update Developer Profile
            </h3>

            {/* Avatar selector */}
            <div>
              <label className="block text-gray-300 font-medium mb-1.5">Select Avatar</label>
              <div className="flex space-x-3">
                {AVATARS.map((imgUrl, i) => (
                  <img
                    key={i}
                    src={imgUrl}
                    alt={`Avatar ${i}`}
                    onClick={() => setAvatar(imgUrl)}
                    className={`w-9 h-9 rounded-full object-cover cursor-pointer transition-all ${
                      avatar === imgUrl ? 'ring-2 ring-cyan-400 scale-110' : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Primary Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-1">Developer Bio</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-800 rounded-lg text-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/30"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* Developer Activity Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#121422] border border-gray-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base font-bold text-white">{recentRooms.length} Rooms</p>
              <p className="text-[11px] text-gray-400">Collaborative Workspaces</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#121422] border border-gray-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base font-bold text-white">4 Runtimes</p>
              <p className="text-[11px] text-gray-400">JS, Python, C++, Java</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#121422] border border-gray-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base font-bold text-white">Active Session</p>
              <p className="text-[11px] text-gray-400">Yjs WebRTC Provider Live</p>
            </div>
          </div>
        </div>

        {/* Room History Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Visited Coding Rooms</h2>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Open Dashboard &rarr;
            </button>
          </div>

          <div className="space-y-2">
            {recentRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => navigate(`/room/${room.id}?lang=${room.language}`)}
                className="p-4 rounded-xl bg-[#121422] border border-gray-800 hover:border-gray-700 flex items-center justify-between cursor-pointer transition-all hover:bg-[#141728]"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-cyan-400 font-mono text-xs uppercase font-bold">
                    {room.language.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{room.name}</h4>
                    <p className="text-[11px] text-gray-400">ID: {room.id} &bull; {room.lastActive}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs text-gray-400">
                  <span>{room.collaboratorsCount || 1} Collaborators</span>
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
