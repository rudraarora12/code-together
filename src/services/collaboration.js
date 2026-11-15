import * as Y from 'yjs';
import { io } from 'socket.io-client';
import { getBackendUrl } from './config';

export const COLLABORATOR_COLORS = [
  { hex: '#89b4fa', name: 'Sapphire Blue', bg: 'bg-[#89b4fa]/20', border: 'border-[#89b4fa]' },
  { hex: '#cba6f7', name: 'Mauve Purple', bg: 'bg-[#cba6f7]/20', border: 'border-[#cba6f7]' },
  { hex: '#a6e3a1', name: 'Emerald Green', bg: 'bg-[#a6e3a1]/20', border: 'border-[#a6e3a1]' },
  { hex: '#f9e2af', name: 'Amber Yellow', bg: 'bg-[#f9e2af]/20', border: 'border-[#f9e2af]' },
  { hex: '#f38ba8', name: 'Coral Rose', bg: 'bg-[#f38ba8]/20', border: 'border-[#f38ba8]' },
  { hex: '#89dceb', name: 'Sky Cyan', bg: 'bg-[#89dceb]/20', border: 'border-[#89dceb]' },
  { hex: '#fab387', name: 'Peach Orange', bg: 'bg-[#fab387]/20', border: 'border-[#fab387]' }
];

export function getRandomColor(seed = 0) {
  return COLLABORATOR_COLORS[Math.abs(seed) % COLLABORATOR_COLORS.length];
}

/**
 * Initializes multi-file real-time collaboration session using Yjs and Socket.IO.
 */
export function createCollaborationSession(roomId, user, options = {}) {
  const backendUrl = options.backendUrl || getBackendUrl();
  const userColor = user?.color || getRandomColor(Math.floor(Math.random() * COLLABORATOR_COLORS.length)).hex;

  // Multi-doc map: fileId -> { ydoc, yText, isSynced }
  const fileDocs = new Map();

  // Socket cursor map: socketId -> cursorData
  const socketCursors = new Map();
  const cursorListeners = new Set();

  let currentActiveFileId = options.initialFileId || null;

  // Connect Socket.IO
  const socket = io(backendUrl, {
    transports: ['websocket', 'polling'],
    timeout: 5000,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000
  });

  const notifyCursorListeners = () => {
    const list = Array.from(socketCursors.values()).filter(c => c.fileId === currentActiveFileId);
    cursorListeners.forEach(cb => cb(list));
  };

  const updateSocketCursorStyles = (cursorData) => {
    const { socketId, user: cursorUser } = cursorData;
    if (!cursorUser) return;
    const color = cursorUser.color || '#89b4fa';
    const styleId = `socket-cursor-style-${socketId}`;
    let styleTag = document.getElementById(styleId);

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
      .remote-socket-cursor-${socketId} {
        position: absolute;
        border-left: 2px solid ${color} !important;
        height: 100%;
        box-sizing: border-box;
      }
      .remote-socket-cursor-${socketId}::before {
        content: '${cursorUser.name || 'Teammate'}';
        position: absolute;
        top: -18px;
        left: -2px;
        background-color: ${color};
        color: #0f111a;
        font-size: 10px;
        font-family: 'Fira Code', monospace;
        font-weight: 700;
        padding: 1px 4px;
        border-radius: 3px;
        white-space: nowrap;
        pointer-events: none;
        z-index: 100;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      }
      .remote-socket-cursor-${socketId}::after {
        position: absolute;
        content: ' ';
        border: 3px solid ${color};
        border-radius: 4px;
        left: -4px;
        top: -5px;
      }
      .remote-socket-selection-${socketId} {
        background-color: ${color}33 !important;
      }
    `;
  };

  /**
   * Get or initialize Y.Doc for a specific file in the project.
   */
  function getFileDoc(fileId, initialContent = null) {
    if (!fileId) return null;

    if (!fileDocs.has(fileId)) {
      const ydoc = new Y.Doc();
      const yText = ydoc.getText('monaco');

      if (initialContent !== null && yText.length === 0) {
        yText.insert(0, initialContent);
      }

      // Propagate local edits for this file over socket
      ydoc.on('update', (update, origin) => {
        if (origin !== socket && socket.connected) {
          socket.emit('yjs:update', {
            fileId,
            update: Array.from(update)
          });
        }
      });

      fileDocs.set(fileId, { ydoc, yText, isSynced: false });

      // Request initial synchronization from server for this file
      if (socket.connected) {
        const stateVector = Y.encodeStateVector(ydoc);
        socket.emit('yjs:sync-step-1', {
          fileId,
          stateVector: Array.from(stateVector)
        });
      }
    }

    return fileDocs.get(fileId);
  }

  // Socket Connection Handlers
  socket.on('connect', () => {
    console.log('[Collaboration] Connected to backend collaboration server at', backendUrl);
    socket.emit('room:join', {
      roomId,
      user: {
        id: user?.id || `usr-${Date.now()}`,
        name: user?.name || 'Teammate',
        avatar: user?.avatar,
        color: userColor,
        isOwner: options.isOwner ?? false
      },
      activeFileId: currentActiveFileId
    });

    // Request sync for all currently open file docs
    fileDocs.forEach((docEntry, fileId) => {
      const stateVector = Y.encodeStateVector(docEntry.ydoc);
      socket.emit('yjs:sync-step-1', {
        fileId,
        stateVector: Array.from(stateVector)
      });
    });
  });

  // Handle Yjs step-1 handshake from server
  socket.on('yjs:sync-step-1', ({ fileId, stateVector }) => {
    const docEntry = fileDocs.get(fileId);
    if (!docEntry) return;

    try {
      const diff = Y.encodeStateAsUpdate(docEntry.ydoc, new Uint8Array(stateVector));
      socket.emit('yjs:sync-step-2', {
        fileId,
        diff: Array.from(diff)
      });

      const clientVector = Y.encodeStateVector(docEntry.ydoc);
      socket.emit('yjs:sync-step-1', {
        fileId,
        stateVector: Array.from(clientVector)
      });
    } catch (e) {
      console.warn(`[Collaboration] Error handling sync-step-1 for ${fileId}:`, e);
    }
  });

  // Handle Yjs step-2 diff from server
  socket.on('yjs:sync-step-2', ({ fileId, diff }) => {
    const docEntry = fileDocs.get(fileId);
    if (!docEntry || !diff) return;

    try {
      if (diff.length > 0) {
        Y.applyUpdate(docEntry.ydoc, new Uint8Array(diff), socket);
      }
      docEntry.isSynced = true;
      console.log(`[Collaboration] File ${fileId} synchronized with server.`);
    } catch (e) {
      console.warn(`[Collaboration] Error applying sync-step-2 for ${fileId}:`, e);
    }
  });

  // Live real-time update for a file
  socket.on('yjs:update', ({ fileId, update }) => {
    const docEntry = fileDocs.get(fileId);
    if (!docEntry || !update) return;

    try {
      Y.applyUpdate(docEntry.ydoc, new Uint8Array(update), socket);
    } catch (e) {
      console.warn(`[Collaboration] Socket update error for ${fileId}:`, e);
    }
  });

  // Participant updates
  socket.on('room:joined', (data) => {
    options.onRoomJoined?.(data);
    options.onParticipantsUpdate?.(data.participants || []);
    if (data.runStatus) options.onProjectStatus?.(data.runStatus);
    if (data.chatHistory) options.onChatHistory?.(data.chatHistory);
  });

  socket.on('room:peer-joined', (data) => {
    options.onPeerJoined?.(data.user);
    options.onParticipantsUpdate?.(data.participants || []);
  });

  socket.on('room:peer-left', (data) => {
    options.onPeerLeft?.(data.user);
    options.onParticipantsUpdate?.(data.participants || []);
    if (data.socketId) {
      socketCursors.delete(data.socketId);
      notifyCursorListeners();
    }
  });

  socket.on('room:participants-updated', (data) => {
    options.onParticipantsUpdate?.(data.participants || []);
  });

  // Cursor updates
  socket.on('cursor:update', (data) => {
    socketCursors.set(data.socketId, data);
    updateSocketCursorStyles(data);
    notifyCursorListeners();
  });

  socket.on('cursor:remove', (data) => {
    socketCursors.delete(data.socketId);
    const styleTag = document.getElementById(`socket-cursor-style-${data.socketId}`);
    if (styleTag) styleTag.remove();
    notifyCursorListeners();
  });

  // Project file tree sync
  socket.on('files:tree-updated', (data) => {
    options.onFileTreeUpdate?.(data);
  });

  // Shared project execution streaming
  socket.on('project:output', (logEntry) => {
    options.onProjectOutput?.(logEntry);
  });

  socket.on('project:status', (statusMeta) => {
    options.onProjectStatus?.(statusMeta);
  });

  // Chat
  socket.on('chat:message', (msg) => {
    options.onChatMessage?.(msg);
  });

  // Typing
  socket.on('typing:start', (data) => {
    options.onTypingStart?.(data);
  });

  socket.on('typing:stop', (data) => {
    options.onTypingStop?.(data);
  });

  // Switch active file awareness
  function switchActiveFile(fileId) {
    currentActiveFileId = fileId;
    if (socket.connected) {
      socket.emit('file:active', { fileId });
    }
    notifyCursorListeners();
  }

  // Send cursor update
  function sendCursorMove(position, selection) {
    if (!socket.connected || !currentActiveFileId) return;
    socket.emit('cursor:move', {
      fileId: currentActiveFileId,
      position,
      selection
    });
  }

  // Send chat message
  function sendChatMessage(text) {
    if (!socket.connected || !text?.trim()) return;
    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: user?.id || 'me',
      senderName: user?.name || 'You',
      avatar: user?.avatar,
      color: userColor,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    socket.emit('chat:message', msg);
  }

  function onCursorsChange(callback) {
    cursorListeners.add(callback);
    return () => cursorListeners.delete(callback);
  }

  function destroy() {
    socket.disconnect();
    fileDocs.clear();
    cursorListeners.clear();
    socketCursors.clear();
  }

  return {
    socket,
    getFileDoc,
    switchActiveFile,
    sendCursorMove,
    sendChatMessage,
    onCursorsChange,
    destroy
  };
}
