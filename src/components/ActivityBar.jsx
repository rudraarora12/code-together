import React from 'react';
import { 
  Files, 
  Search, 
  MessageSquare, 
  Users, 
  Settings, 
  Play, 
  Square,
  ChevronLeft, 
  ChevronRight,
  Terminal,
  Share2,
  Globe
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';

export default function ActivityBar({ onOpenInvite, onOpenSettings }) {
  const { 
    activeSidebarTab, 
    setActiveSidebarTab, 
    isSidebarOpen, 
    setIsSidebarOpen,
    unreadChatCount,
    setUnreadChatCount,
    collaborators,
    isTerminalOpen,
    setIsTerminalOpen,
    runStatus,
    runProject,
    stopProject,
    isPreviewOpen,
    setIsPreviewOpen,
    previewUrl
  } = useRoom();

  const handleTabClick = (tabKey) => {
    if (activeSidebarTab === tabKey && isSidebarOpen) {
      setIsSidebarOpen(false);
    } else {
      setActiveSidebarTab(tabKey);
      setIsSidebarOpen(true);
      if (tabKey === 'chat') {
        setUnreadChatCount(0);
      }
    }
  };

  const navItems = [
    { key: 'explorer', label: 'Project Explorer', icon: Files },
    { key: 'search', label: 'Search in Files', icon: Search },
    { 
      key: 'collaborators', 
      label: 'Teammates', 
      icon: Users,
      badge: collaborators.length,
      badgeColor: 'bg-emerald-600'
    },
    { 
      key: 'chat', 
      label: 'Team Chat', 
      icon: MessageSquare,
      badge: unreadChatCount > 0 ? unreadChatCount : null,
      badgeColor: 'bg-indigo-500'
    }
  ];

  const isRunning = runStatus === 'running' || runStatus === 'building';

  return (
    <aside className="w-12 bg-[#0c0e17] border-r border-gray-800/80 flex flex-col items-center py-2 select-none z-20 shrink-0">
      {/* Top Main Navigation Items */}
      <div className="flex-1 flex flex-col items-center space-y-1 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isSidebarOpen && activeSidebarTab === item.key;
          return (
            <button
              key={item.key}
              title={item.label}
              onClick={() => handleTabClick(item.key)}
              className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? 'text-cyan-400 bg-gray-800/80 shadow-inner'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-cyan-400 rounded-r"></div>
              )}
              <Icon className="w-5 h-5" />
              {item.badge && (
                <span className={`absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full ${item.badgeColor} text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-[#0c0e17]`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Quick Share Invite button */}
        <button
          onClick={onOpenInvite}
          title="Share Invite Link"
          className="w-10 h-10 rounded-lg flex items-center justify-center text-cyan-400 hover:text-white hover:bg-cyan-500/10 transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Web Preview toggle shortcut */}
        <button
          onClick={() => setIsPreviewOpen(!isPreviewOpen)}
          title="Toggle Application Preview"
          className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isPreviewOpen ? 'text-cyan-300 bg-indigo-600/30' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
          }`}
        >
          <Globe className="w-4 h-4" />
          {previewUrl && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse absolute top-2 right-2" />
          )}
        </button>
      </div>

      {/* Bottom Actions: Run / Stop, Terminal, Settings */}
      <div className="flex flex-col items-center space-y-1 w-full pt-2 border-t border-gray-800/60">
        {/* Run / Stop Button */}
        {!isRunning ? (
          <button
            onClick={() => runProject()}
            title="Run Project (Ctrl + Enter)"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
          >
            <Play className="w-4 h-4 fill-emerald-400/20" />
          </button>
        ) : (
          <button
            onClick={stopProject}
            title="Stop Project"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <Square className="w-4 h-4 fill-rose-400/20" />
          </button>
        )}

        {/* Terminal Toggle */}
        <button
          onClick={() => setIsTerminalOpen(!isTerminalOpen)}
          title="Toggle Terminal Panel (Ctrl + `)"
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            isTerminalOpen ? 'text-indigo-400 bg-gray-800/60' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
          }`}
        >
          <Terminal className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="Workspace Settings"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-800/40 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Sidebar Toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? 'Collapse Left Sidebar' : 'Expand Left Sidebar'}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-800/40 transition-colors"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
