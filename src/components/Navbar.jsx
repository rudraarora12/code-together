import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Code2, 
  Plus, 
  Users, 
  Terminal, 
  LogOut, 
  User, 
  Settings, 
  ChevronDown, 
  Sparkles,
  Radio,
  ExternalLink
} from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';

export default function Navbar({ currentRoom = null, onNewRoom = null }) {
  const { user, logout, quickLoginAs } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSwitchUser, setShowSwitchUser] = useState(false);

  const isEditorPage = location.pathname.startsWith('/room/');

  const handleNewRoomClick = () => {
    if (onNewRoom) {
      onNewRoom();
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <nav className="h-14 border-b border-gray-800 bg-[#0f111a]/95 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Left items */}
      <div className="flex items-center space-x-6">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#121524] rounded-[7px] flex items-center justify-center">
              <Code2 className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            CodeTogether
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              v1.0
            </span>
          </span>
        </Link>

        {/* Global links */}
        <div className="hidden md:flex items-center space-x-1 text-sm font-medium text-gray-400">
          <Link
            to="/dashboard"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              location.pathname === '/dashboard'
                ? 'text-white bg-gray-800/60'
                : 'hover:text-gray-200 hover:bg-gray-800/30'
            }`}
          >
            Dashboard
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-md hover:text-gray-200 hover:bg-gray-800/30 transition-colors flex items-center gap-1.5"
          >
            Docs
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </div>

      {/* Center Room Status (if on editor page) */}
      {isEditorPage && currentRoom && (
        <div className="hidden lg:flex items-center space-x-3 bg-gray-900/80 border border-gray-800 px-3 py-1 rounded-full text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sync Active
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-300 font-medium truncate max-w-[200px]">
            {currentRoom.name}
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400 font-mono text-[11px] uppercase bg-gray-800 px-1.5 py-0.5 rounded">
            {currentRoom.language}
          </span>
        </div>
      )}

      {/* Right User & Actions */}
      <div className="flex items-center space-x-3">
        {user ? (
          <>
            <button
              onClick={handleNewRoomClick}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all hover:shadow-indigo-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Room</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 p-1 pl-2 pr-2.5 rounded-lg border border-gray-800 hover:border-gray-700 bg-gray-900/60 hover:bg-gray-800/60 transition-all text-xs"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-cyan-500/40"
                />
                <span className="font-medium text-gray-200 max-w-[100px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-xl bg-[#141724] border border-gray-800 shadow-2xl py-2 z-50 animate-fade-in"
                  onMouseLeave={() => {
                    setIsDropdownOpen(false);
                    setShowSwitchUser(false);
                  }}
                >
                  <div className="px-4 py-2.5 border-b border-gray-800/80">
                    <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      <span className="text-[10px] text-cyan-300 font-mono">{user.role}</span>
                    </div>
                  </div>

                  <div className="p-1 space-y-0.5 text-xs text-gray-300">
                    <Link
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-800/70 hover:text-white transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      <span>User Profile & History</span>
                    </Link>

                    <Link
                      to="/dashboard"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-800/70 hover:text-white transition-colors"
                    >
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Coding Dashboard</span>
                    </Link>

                    {/* Quick Demo Switcher */}
                    <div className="pt-1 border-t border-gray-800/60 mt-1">
                      <button
                        onClick={() => setShowSwitchUser(!showSwitchUser)}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] text-gray-400 hover:text-cyan-300 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          Switch Collaborator Demo
                        </span>
                        <ChevronDown className={`w-3 h-3 transform transition-transform ${showSwitchUser ? 'rotate-180' : ''}`} />
                      </button>

                      {showSwitchUser && (
                        <div className="mt-1 px-1 space-y-1">
                          {DEMO_USERS.map((demo) => (
                            <button
                              key={demo.id}
                              onClick={() => {
                                quickLoginAs(demo);
                                setIsDropdownOpen(false);
                                setShowSwitchUser(false);
                              }}
                              className={`w-full text-left px-2 py-1.5 rounded flex items-center space-x-2 text-xs transition-colors ${
                                user.id === demo.id ? 'bg-indigo-900/40 text-cyan-200' : 'hover:bg-gray-800/60 text-gray-300'
                              }`}
                            >
                              <img src={demo.avatar} alt={demo.name} className="w-5 h-5 rounded-full object-cover" />
                              <div className="truncate">
                                <p className="font-medium truncate">{demo.name}</p>
                                <p className="text-[10px] text-gray-500">{demo.role}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-1 border-t border-gray-800/60 mt-1">
                      <button
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false);
                          navigate('/login');
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center space-x-2 text-xs">
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/60 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
