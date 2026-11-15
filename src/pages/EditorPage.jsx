import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { RoomProvider, useRoom } from '../context/RoomContext';
import RoomHeader from '../components/RoomHeader';
import ActivityBar from '../components/ActivityBar';
import FileExplorer from '../components/FileExplorer';
import SearchPanel from '../components/SearchPanel';
import EditorTabs from '../components/EditorTabs';
import CodeEditor from '../components/CodeEditor';
import RightSidebar from '../components/RightSidebar';
import TerminalPanel from '../components/TerminalPanel';
import PreviewPanel from '../components/PreviewPanel';
import InviteModal from '../components/InviteModal';
import SettingsModal from '../components/SettingsModal';

function FullProjectEditorWorkspace() {
  const { 
    roomId, 
    roomName, 
    collaborators, 
    isChatOpen,
    isSidebarOpen,
    activeSidebarTab,
    createFile,
    isPreviewOpen
  } = useRoom();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleNewFile = () => {
    const fileName = prompt('Enter new file name (e.g. src/index.js):');
    if (fileName && fileName.trim()) {
      createFile(fileName.trim());
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen w-screen overflow-hidden bg-[#0d0f19]">
      {/* 1. Top Toolbar */}
      <RoomHeader
        onOpenInvite={() => setIsInviteOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 2. Main Collaborative IDE Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Leftmost Activity Bar */}
        <ActivityBar
          onOpenInvite={() => setIsInviteOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Collapsible Left Sidebar (Explorer / Search) */}
        {isSidebarOpen && (
          <div className="w-64 max-w-[280px] h-full flex flex-col min-w-0 shrink-0">
            {activeSidebarTab === 'search' ? (
              <SearchPanel />
            ) : (
              <FileExplorer />
            )}
          </div>
        )}

        {/* Center Monaco Editor & Execution Drawers */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#151726]">
          {/* Multiple File Tabs Bar */}
          <EditorTabs onNewFileClick={handleNewFile} />

          {/* Editor and Optional Live Web Preview Stage */}
          <div className="flex-1 flex min-h-0 relative overflow-hidden">
            {/* Monaco Code Editor */}
            <div className="flex-1 h-full min-w-0 relative">
              <CodeEditor />
            </div>

            {/* Split Web Application Preview Panel */}
            <PreviewPanel />
          </div>

          {/* Bottom Shared Execution Terminal Drawer */}
          <TerminalPanel />
        </div>

        {/* 3. Right Sidebar: Collaborators & Team Chat */}
        {isChatOpen && (
          <RightSidebar onOpenInvite={() => setIsInviteOpen(true)} />
        )}
      </div>

      {/* Prominent Invite Teammates Dialog */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        roomId={roomId}
        roomName={roomName}
        collaborators={collaborators}
      />

      {/* Workspace Settings Dialog */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default function EditorPage() {
  const { roomId } = useParams();

  return (
    <RoomProvider roomId={roomId || 'proj-default'}>
      <FullProjectEditorWorkspace />
    </RoomProvider>
  );
}
