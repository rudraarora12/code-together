import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { createCollaborationSession, COLLABORATOR_COLORS } from '../services/collaboration';
import { buildFileTree } from '../services/projectUpload';
import { detectLanguageFromFilename } from '../utils/languageDetector';
import { showToast } from '../components/Toast';
import { getBackendUrl } from '../services/config';

const RoomContext = createContext(null);

export function RoomProvider({ roomId = 'room-default', children }) {
  const { user } = useAuth();

  // 1. Room Metadata
  const [roomName, setRoomName] = useState('Collaborative Project');
  const [projectType, setProjectType] = useState('generic');
  const [projectTypeName, setProjectTypeName] = useState('Standard Project');
  const [primaryLanguage, setPrimaryLanguage] = useState('javascript');
  const [badgeColor, setBadgeColor] = useState('#89b4fa');
  const [isOwner, setIsOwner] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'synced'

  // 2. Project Files & File Explorer
  const [files, setFiles] = useState([]);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);

  // 3. Collaborators & Awareness
  const [collaborators, setCollaborators] = useState([
    {
      id: user?.id || 'me',
      name: `${user?.name || 'You'} (You)`,
      avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      color: '#89b4fa',
      role: 'Room Owner',
      isOwner: true,
      activeFileId: null,
      status: 'online'
    }
  ]);
  const [remoteCursors, setRemoteCursors] = useState([]);

  // 4. Team Chat
  const [messages, setMessages] = useState([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [activeTypingUser, setActiveTypingUser] = useState(null);

  // 5. Shared Execution & Terminal
  const [runStatus, setRunStatus] = useState('stopped'); // 'stopped' | 'building' | 'running' | 'error'
  const [runLogs, setRunLogs] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isWeb, setIsWeb] = useState(false);
  const [runCommand, setRunCommand] = useState('');
  const [previewKey, setPreviewKey] = useState(0);

  // 6. UI Panels
  const [activeSidebarTab, setActiveSidebarTab] = useState('explorer'); // 'explorer' | 'search' | 'chat' | 'collaborators'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [terminalTab, setTerminalTab] = useState('output'); // 'output' | 'terminal'
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 7. Editor Settings
  const [simulateActivity, setSimulateActivity] = useState(false);
  const [editorSettings, setEditorSettings] = useState({
    fontSize: 14,
    tabSize: 2,
    minimap: true,
    wordWrap: 'on',
    lineNumbers: 'on',
    theme: 'vs-dark'
  });

  // Session reference
  const sessionRef = useRef(null);
  const [sessionReady, setSessionReady] = useState(false);

  // Derive active file object
  const activeFile = useMemo(() => {
    return files.find(f => f.id === activeFileId || f.path === activeFileId) || null;
  }, [files, activeFileId]);

  // Derive hierarchical file tree
  const fileTree = useMemo(() => {
    return buildFileTree(files);
  }, [files]);

  // Derive folder list
  const folders = useMemo(() => {
    const set = new Set();
    files.forEach(f => {
      const parts = f.path.split('/');
      if (parts.length > 1) {
        set.add(parts.slice(0, parts.length - 1).join('/'));
      }
    });
    return Array.from(set).sort();
  }, [files]);

  // Map fileId to active collaborators viewing/editing that file
  const activeFilePresence = useMemo(() => {
    const map = new Map();
    collaborators.forEach(collab => {
      if (collab.activeFileId) {
        if (!map.has(collab.activeFileId)) {
          map.set(collab.activeFileId, []);
        }
        map.get(collab.activeFileId).push(collab);
      }
    });
    return map;
  }, [collaborators]);

  // -------------------------------------------------------------
  // Load Room Data from Backend Server
  // -------------------------------------------------------------
  const fetchRoomData = useCallback(async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/rooms/${roomId}`);
      if (!res.ok) throw new Error('Room not found');
      const data = await res.json();

      setRoomName(data.name || 'Collaborative Project');
      setProjectType(data.projectType || 'generic');
      setProjectTypeName(data.projectTypeName || 'Standard Project');
      setPrimaryLanguage(data.primaryLanguage || 'javascript');
      setBadgeColor(data.badgeColor || '#89b4fa');
      setIsWeb(!!data.isWeb);
      setRunCommand(data.runCommand || '');
      setIsOwner(data.owner?.id === user?.id || false);

      if (data.files && Array.isArray(data.files)) {
        setFiles(data.files);

        // Pick initial active file
        if (!activeFileId && data.files.length > 0) {
          const defaultPath = data.defaultFile || data.files[0].path;
          setActiveFileId(defaultPath);
          setOpenTabs([defaultPath]);
        }
      }

      if (data.runStatus) {
        setRunStatus(data.runStatus.status || 'stopped');
        if (data.runStatus.previewUrl) setPreviewUrl(data.runStatus.previewUrl);
        if (data.runStatus.logs) setRunLogs(data.runStatus.logs);
      }

      setConnectionStatus('connected');
    } catch (err) {
      console.warn('[RoomContext] Could not fetch room from server, using local fallback:', err.message);
    }
  }, [roomId, user?.id, activeFileId]);

  useEffect(() => {
    fetchRoomData();
  }, [roomId]);

  // -------------------------------------------------------------
  // Initialize Real-Time Collaboration Session
  // -------------------------------------------------------------
  useEffect(() => {
    const session = createCollaborationSession(roomId, user, {
      isOwner,
      initialFileId: activeFileId,
      onParticipantsUpdate: (participants) => {
        setCollaborators(participants.map(p => ({
          ...p,
          name: p.id === user?.id ? `${p.name} (You)` : p.name,
          role: p.isOwner ? 'Room Owner' : 'Collaborator',
          status: 'online'
        })));
      },
      onPeerJoined: (peer) => {
        if (peer && peer.name && peer.id !== user?.id) {
          showToast(`${peer.name} joined the room!`, 'info');
        }
      },
      onPeerLeft: (peer) => {
        if (peer && peer.name) {
          showToast(`${peer.name} left the room`, 'info');
        }
      },
      onFileTreeUpdate: (treeData) => {
        if (treeData && treeData.files) {
          setFiles(treeData.files);
          if (treeData.action === 'rename' && treeData.oldPath === activeFileId) {
            setActiveFileId(treeData.newPath);
            setOpenTabs(prev => prev.map(t => t === treeData.oldPath ? treeData.newPath : t));
          }
          if (treeData.action === 'delete' && treeData.path === activeFileId) {
            closeTab(treeData.path);
          }
          showToast(`File structure updated: ${treeData.action}`, 'info');
        }
      },
      onProjectOutput: (logEntry) => {
        setRunLogs(prev => {
          const next = [...prev, logEntry];
          if (next.length > 2000) next.shift();
          return next;
        });
      },
      onProjectStatus: (statusMeta) => {
        if (statusMeta && statusMeta.status) {
          setRunStatus(statusMeta.status);
          if (statusMeta.previewUrl) {
            setPreviewUrl(statusMeta.previewUrl);
            setIsPreviewOpen(true);
            showToast(`Web server live at ${statusMeta.previewUrl}`, 'success');
          }
        }
      },
      onChatMessage: (msg) => {
        setMessages(prev => [...prev, msg]);
        if (!isChatOpen) {
          setUnreadChatCount(prev => prev + 1);
        }
      },
      onChatHistory: (history) => {
        setMessages(history);
      },
      onTypingStart: (data) => {
        if (data.user?.name) setActiveTypingUser(data.user.name);
      },
      onTypingStop: () => {
        setActiveTypingUser(null);
      }
    });

    sessionRef.current = session;
    setSessionReady(true);

    const unsubCursors = session.onCursorsChange((cursors) => {
      setRemoteCursors(cursors);
    });

    return () => {
      unsubCursors();
      session.destroy();
      sessionRef.current = null;
    };
  }, [roomId, user?.id]);

  // When activeFileId changes, notify collaboration session
  useEffect(() => {
    if (sessionRef.current && activeFileId) {
      sessionRef.current.switchActiveFile(activeFileId);
    }
  }, [activeFileId]);

  // -------------------------------------------------------------
  // Tabs & File Navigation
  // -------------------------------------------------------------
  const openFile = useCallback((fileId) => {
    if (!fileId) return;
    setActiveFileId(fileId);
    setOpenTabs(prev => {
      if (!prev.includes(fileId)) {
        return [...prev, fileId];
      }
      return prev;
    });
  }, []);

  const closeTab = useCallback((fileId) => {
    setOpenTabs(prev => {
      const filtered = prev.filter(id => id !== fileId);
      if (activeFileId === fileId) {
        if (filtered.length > 0) {
          const idx = prev.indexOf(fileId);
          const nextTab = filtered[Math.min(idx, filtered.length - 1)];
          setActiveFileId(nextTab);
        } else {
          setActiveFileId(null);
        }
      }
      return filtered;
    });
  }, [activeFileId]);

  // -------------------------------------------------------------
  // File CRUD Operations
  // -------------------------------------------------------------
  const createFile = useCallback(async (filePath, initialContent = '') => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/rooms/${roomId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content: initialContent })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create file');
      }
      const data = await res.json();
      setFiles(data.files);
      openFile(filePath);
      showToast(`Created file: ${filePath}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [roomId, openFile]);

  const createFolder = useCallback(async (folderPath) => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/rooms/${roomId}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create folder');
      }
      const data = await res.json();
      setFiles(data.files);
      showToast(`Created folder: ${folderPath}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [roomId]);

  const renameFile = useCallback(async (oldPath, newPath) => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/rooms/${roomId}/files/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath, newPath })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to rename');
      }
      const data = await res.json();
      setFiles(data.files);
      if (activeFileId === oldPath) {
        setActiveFileId(newPath);
      }
      setOpenTabs(prev => prev.map(t => t === oldPath ? newPath : t));
      showToast(`Renamed to ${newPath}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [roomId, activeFileId]);

  const deleteFile = useCallback(async (filePath) => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/rooms/${roomId}/files?path=${encodeURIComponent(filePath)}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
      }
      const data = await res.json();
      setFiles(data.files);
      closeTab(filePath);
      showToast(`Deleted ${filePath}`, 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [roomId, closeTab]);

  const downloadZip = useCallback(() => {
    const downloadUrl = `${getBackendUrl()}/api/rooms/${roomId}/download`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${roomName.replace(/\s+/g, '_')}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Preparing full project ZIP download...', 'info');
  }, [roomId, roomName]);

  // -------------------------------------------------------------
  // Shared Project Execution & Terminal
  // -------------------------------------------------------------
  const runProject = useCallback(async (customCmd = null) => {
    const cmd = customCmd || runCommand;
    setIsTerminalOpen(true);
    setTerminalTab('output');
    setRunStatus('building');

    try {
      const res = await fetch(`${getBackendUrl()}/api/rooms/${roomId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run project');
      showToast('Project execution started in isolated sandbox', 'success');
    } catch (err) {
      setRunStatus('error');
      showToast(`Execution error: ${err.message}`, 'error');
    }
  }, [roomId, runCommand]);

  const stopProject = useCallback(async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/rooms/${roomId}/stop`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to stop project');
      setRunStatus('stopped');
      showToast('Project stopped', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [roomId]);

  const restartProject = useCallback(async (customCmd = null) => {
    const cmd = customCmd || runCommand;
    setIsTerminalOpen(true);
    setTerminalTab('output');
    setRunStatus('building');

    try {
      const res = await fetch(`${getBackendUrl()}/api/rooms/${roomId}/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to restart project');
      showToast('Project restarted', 'success');
    } catch (err) {
      setRunStatus('error');
      showToast(`Restart error: ${err.message}`, 'error');
    }
  }, [roomId, runCommand]);

  const clearTerminal = useCallback(() => {
    setRunLogs([]);
  }, []);

  const refreshPreview = useCallback(() => {
    setPreviewKey(prev => prev + 1);
    showToast('Refreshed application preview');
  }, []);

  // -------------------------------------------------------------
  // Chat & Messaging
  // -------------------------------------------------------------
  const sendMessage = useCallback((text) => {
    if (sessionRef.current) {
      sessionRef.current.sendChatMessage(text);
    }
  }, []);

  const updateEditorSettings = useCallback((newSettings) => {
    setEditorSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Simulated activity for solo testing
  useEffect(() => {
    if (!simulateActivity) return;
    const simCollab = {
      id: 'sim-elena',
      name: 'Elena Rostova (AI Partner)',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      color: '#cba6f7',
      role: 'Collaborator',
      isOwner: false,
      activeFileId: activeFileId,
      status: 'online'
    };
    setCollaborators(prev => [...prev.filter(p => p.id !== 'sim-elena'), simCollab]);

    return () => {
      setCollaborators(prev => prev.filter(p => p.id !== 'sim-elena'));
    };
  }, [simulateActivity, activeFileId]);

  return (
    <RoomContext.Provider
      value={{
        roomId,
        roomName,
        setRoomName,
        projectType,
        projectTypeName,
        primaryLanguage,
        badgeColor,
        isOwner,
        connectionStatus,
        files,
        folders,
        fileTree,
        openTabs,
        activeFileId,
        activeFile,
        openFile,
        closeTab,
        createFile,
        createFolder,
        renameFile,
        deleteFile,
        downloadZip,
        collaborators,
        activeFilePresence,
        remoteCursors,
        sessionRef,
        sessionReady,
        messages,
        sendMessage,
        unreadChatCount,
        setUnreadChatCount,
        activeTypingUser,
        runStatus,
        runLogs,
        previewUrl,
        isWeb,
        runCommand,
        setRunCommand,
        runProject,
        stopProject,
        restartProject,
        clearTerminal,
        previewKey,
        refreshPreview,
        activeSidebarTab,
        setActiveSidebarTab,
        isSidebarOpen,
        setIsSidebarOpen,
        isChatOpen,
        setIsChatOpen,
        isTerminalOpen,
        setIsTerminalOpen,
        terminalTab,
        setTerminalTab,
        isPreviewOpen,
        setIsPreviewOpen,
        editorSettings,
        updateEditorSettings,
        simulateActivity,
        setSimulateActivity
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
}
