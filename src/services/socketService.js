import { io } from 'socket.io-client';
import { getSocketUrl } from './config';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  /**
   * Connect to a backend Socket.IO server
   */
  connect(url = getSocketUrl()) {
    if (this.socket) return this.socket;

    try {
      this.socket = io(url, {
        autoConnect: false,
        reconnectionAttempts: 3,
        timeout: 5000
      });

      this.socket.on('connect', () => {
        this.connected = true;
        this.notify('connection_change', { connected: true, socketId: this.socket.id });
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
        this.notify('connection_change', { connected: false });
      });

      this.socket.on('connect_error', (error) => {
        console.warn('Socket server not detected at', url, '- will run with peer-to-peer / local preview mode.');
        this.connected = false;
        this.notify('connection_change', { connected: false, error: error.message });
      });

      this.socket.connect();
    } catch (e) {
      console.warn('Failed to initialize socket client:', e);
    }

    return this.socket;
  }

  joinRoom(roomId, user) {
    if (this.socket && this.connected) {
      this.socket.emit('room:join', { roomId, user });
    }
  }

  leaveRoom(roomId, user) {
    if (this.socket && this.connected) {
      this.socket.emit('room:leave', { roomId, user });
    }
  }

  sendChatMessage(roomId, message) {
    if (this.socket && this.connected) {
      this.socket.emit('chat:message', { roomId, message });
    }
  }

  sendCursorMove(roomId, cursorData) {
    if (this.socket && this.connected) {
      this.socket.emit('cursor:move', { roomId, ...cursorData });
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  notify(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

export const socketService = new SocketService();
