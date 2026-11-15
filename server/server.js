import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import * as Y from 'yjs';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

import {
  connectDatabase,
  getDatabaseStatus,
  isDatabaseConnected,
  closeDatabase,
  Room as RoomModel,
  ProjectFile as ProjectFileModel,
  ChatMessage as ChatMessageModel
} from './db.js';

import {
  storeProjectFiles,
  getFlatFileList,
  readProjectFile,
  writeProjectFile,
  createProjectFile,
  createProjectFolder,
  renameProjectEntry,
  deleteProjectEntry,
  generateProjectZip,
  detectProjectType,
  detectLanguage,
  sanitizeRelativePath
} from './projectStore.js';

import {
  startProjectExecution,
  stopProjectExecution,
  restartProjectExecution,
  getProjectExecutionStatus
} from './sandboxRunner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Allowed origins for CORS (Vercel production domains, local dev, public tunnels)
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(s => s.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'];

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return true;
  if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin)) return true;
  if (/^https:\/\/[a-zA-Z0-9_-]+\.loca\.lt$/.test(origin)) return true;
  return false;
}

const corsOptions = {
  origin: (origin, callback) => {
    callback(null, isOriginAllowed(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  },
  maxHttpBufferSize: 1e8 // 100MB
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Required for Monaco editor web workers & application preview
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const STORAGE_DIR = path.join(__dirname, 'storage');
const ROOMS_FILE = path.join(STORAGE_DIR, 'rooms.json');

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// In-memory Room Metadata Store
let roomsStore = new Map();

try {
  if (fs.existsSync(ROOMS_FILE)) {
    const raw = fs.readFileSync(ROOMS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    Object.entries(parsed).forEach(([id, room]) => {
      roomsStore.set(id, room);
    });
    console.log(`[Storage] Loaded ${roomsStore.size} persisted rooms from disk.`);
  }
} catch (e) {
  console.warn('[Storage] Could not load rooms.json, initializing fresh store:', e.message);
}

function saveRoomsToDisk() {
  try {
    const obj = Object.fromEntries(roomsStore);
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Storage] Error saving rooms to disk:', e.message);
  }
}

// Connect to MongoDB Atlas (if MONGODB_URI is provided in environment)
connectDatabase().then(async (result) => {
  if (result && result.connected) {
    try {
      const dbRooms = await RoomModel.find({}).lean();
      dbRooms.forEach(r => {
        if (!roomsStore.has(r.roomId)) {
          roomsStore.set(r.roomId, { ...r, id: r.roomId });
        }
      });
      console.log(`[Database] Synced ${dbRooms.length} rooms from MongoDB Atlas.`);
    } catch (err) {
      console.warn('[Database] Sync warning:', err.message);
    }
  }
});

async function persistRoomToDatabase(roomId, roomData, files = []) {
  if (!isDatabaseConnected()) return;
  try {
    await RoomModel.findOneAndUpdate(
      { roomId },
      { ...roomData, roomId },
      { upsert: true, new: true }
    );
    if (files.length > 0) {
      const ops = files.map(f => ({
        updateOne: {
          filter: { roomId, path: f.path || f.name },
          update: { 
            $set: { 
              roomId, 
              path: f.path || f.name, 
              name: f.name || path.basename(f.path || f.name),
              content: typeof f.content === 'string' ? f.content : '',
              size: f.size || (typeof f.content === 'string' ? f.content.length : 0),
              isDirectory: !!f.isDirectory
            } 
          },
          upsert: true
        }
      }));
      await ProjectFileModel.bulkWrite(ops);
    }
    console.log(`[Database] Persisted room ${roomId} and ${files.length} files to MongoDB Atlas.`);
  } catch (err) {
    console.warn(`[Database] Error persisting room ${roomId} to MongoDB:`, err.message);
  }
}

// Multi-file Y.Docs per file: key = `${roomId}::${fileId}`
const fileDocs = new Map();

// Room metadata Y.Docs / Maps (chat, meta)
const roomMetaDocs = new Map();

function getOrCreateFileDoc(roomId, fileId, initialContent = null) {
  const key = `${roomId}::${fileId}`;
  if (!fileDocs.has(key)) {
    const doc = new Y.Doc();
    const yText = doc.getText('monaco');

    // If initial content provided or read from disk
    if (initialContent !== null) {
      yText.insert(0, initialContent);
    } else {
      try {
        const diskContent = readProjectFile(roomId, fileId);
        yText.insert(0, diskContent);
      } catch {
        // file doesn't exist yet or is empty
      }
    }
    fileDocs.set(key, doc);
  }
  return fileDocs.get(key);
}

// Debounced auto-save per file to persist collaborative edits to disk
const fileSaveDebouncers = new Map();

function scheduleFileAutoSave(roomId, fileId) {
  const key = `${roomId}::${fileId}`;
  if (fileSaveDebouncers.has(key)) {
    clearTimeout(fileSaveDebouncers.get(key));
  }

  const timer = setTimeout(() => {
    fileSaveDebouncers.delete(key);
    const doc = fileDocs.get(key);
    if (doc) {
      try {
        const text = doc.getText('monaco').toString();
        writeProjectFile(roomId, fileId, text);
        console.log(`[AutoSave] Saved file ${fileId} in room ${roomId} (${text.length} chars)`);
      } catch (err) {
        console.warn(`[AutoSave] Warning saving file ${fileId}:`, err.message);
      }
    }
  }, 1500);

  fileSaveDebouncers.set(key, timer);
}

// Connected Room Participants: roomId -> Map<socketId, { user, activeFileId, joinedAt }>
const roomParticipants = new Map();

// Chat message history per room: roomId -> Array<ChatMessage>
const roomChatHistory = new Map();

// -------------------------------------------------------------
// REST APIs
// -------------------------------------------------------------

// 1. Health check & Diagnostics endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    database: getDatabaseStatus(),
    activeRooms: roomsStore.size,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Network discovery for hackathon teammate invitations
app.get('/api/network-info', (req, res) => {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push({ interface: name, address: net.address });
      }
    }
  }
  res.json({
    localIp: ips[0]?.address || 'localhost',
    allIps: ips,
    backendPort: PORT,
    clientPort: 5173
  });
});

// 2. Upload an Entire Project Folder -> Create One Collaborative Room
app.post('/api/rooms/project', (req, res) => {
  try {
    const { 
      projectName, 
      files = [], 
      user, 
      roomId: requestedId,
      runConfig
    } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'At least one project file is required.' });
    }

    if (files.length > 1000) {
      return res.status(400).json({ error: 'Exceeded maximum limit of 1000 project files.' });
    }

    const roomId = requestedId || `proj-${Math.random().toString(36).substring(2, 8)}`;
    const finalProjectName = (projectName || 'Shared Project').trim();

    // Detect framework & project type
    const filePaths = files.map(f => f.path || f.name);
    const detected = detectProjectType(filePaths);

    // Store files to disk
    storeProjectFiles(roomId, files);

    // Find default entry file for initial tab
    const flatFiles = getFlatFileList(roomId);
    let defaultEntryFile = flatFiles.find(f => 
      f.name === 'App.jsx' || 
      f.name === 'main.jsx' || 
      f.name === 'index.js' || 
      f.name === 'server.js' || 
      f.name === 'main.py' || 
      f.name === 'app.py' || 
      f.name === 'index.html'
    );
    if (!defaultEntryFile && flatFiles.length > 0) {
      defaultEntryFile = flatFiles[0];
    }

    const room = {
      id: roomId,
      name: finalProjectName,
      projectType: detected.type,
      projectTypeName: detected.name,
      primaryLanguage: detected.language,
      badgeColor: detected.color,
      isWeb: detected.isWeb,
      runCommand: runConfig?.command || detected.runCommand,
      defaultPort: runConfig?.port || detected.defaultPort,
      defaultFile: defaultEntryFile ? defaultEntryFile.path : null,
      totalFiles: flatFiles.length,
      owner: {
        id: user?.id || 'owner-creator',
        name: user?.name || 'Project Lead',
        avatar: user?.avatar
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    roomsStore.set(roomId, room);
    saveRoomsToDisk();
    persistRoomToDatabase(roomId, room, flatFiles);

    // Pre-initialize Y.Docs for uploaded files
    files.forEach(f => {
      const safePath = sanitizeRelativePath(f.path || f.name);
      if (safePath && typeof f.content === 'string') {
        getOrCreateFileDoc(roomId, safePath, f.content);
      }
    });

    console.log(`[Project Created] Room: ${roomId} ("${room.name}"), ${flatFiles.length} files, Type: ${room.projectTypeName}`);

    res.status(201).json({
      success: true,
      roomId,
      room,
      files: flatFiles,
      invitationUrl: `/room/${roomId}`
    });
  } catch (err) {
    console.error('[CreateProject Error]', err);
    res.status(500).json({ error: `Failed to create project room: ${err.message}` });
  }
});

// Single file upload fallback for backward compatibility
app.post('/api/rooms', (req, res) => {
  const { file, user, roomId: requestedId } = req.body;
  if (!file || !file.name) {
    return res.status(400).json({ error: 'Valid file name is required.' });
  }

  const roomId = requestedId || `proj-${Math.random().toString(36).substring(2, 8)}`;
  const files = [{
    path: file.name,
    name: file.name,
    content: file.content || `// ${file.name}\n`
  }];

  const detected = detectProjectType([file.name]);
  storeProjectFiles(roomId, files);

  const room = {
    id: roomId,
    name: `${file.name} Project`,
    projectType: detected.type,
    projectTypeName: detected.name,
    primaryLanguage: file.language || detected.language,
    badgeColor: detected.color,
    isWeb: detected.isWeb,
    runCommand: detected.runCommand,
    defaultFile: file.name,
    totalFiles: 1,
    owner: {
      id: user?.id || 'owner-creator',
      name: user?.name || 'Project Lead',
      avatar: user?.avatar
    },
    createdAt: new Date().toISOString()
  };

  roomsStore.set(roomId, room);
  saveRoomsToDisk();
  getOrCreateFileDoc(roomId, file.name, file.content);

  res.status(201).json({
    success: true,
    roomId,
    room,
    files: getFlatFileList(roomId),
    invitationUrl: `/room/${roomId}`
  });
});

// 3. Get Room Details, Project Tree, and Collaborators
app.get('/api/rooms/:roomId', async (req, res) => {
  const { roomId } = req.params;
  let room = roomsStore.get(roomId);

  if (!room && isDatabaseConnected()) {
    try {
      const dbRoom = await RoomModel.findOne({ roomId }).lean();
      if (dbRoom) {
        room = { ...dbRoom, id: dbRoom.roomId };
        roomsStore.set(roomId, room);
        // Restore files from MongoDB if not currently on disk
        const dbFiles = await ProjectFileModel.find({ roomId }).lean();
        if (dbFiles.length > 0) {
          storeProjectFiles(roomId, dbFiles);
        }
      }
    } catch (e) {
      console.warn(`[Database] Error restoring room ${roomId}:`, e.message);
    }
  }

  if (!room) {
    return res.status(404).json({ error: 'Room not found or expired.' });
  }

  const files = getFlatFileList(roomId);
  const participants = Array.from(roomParticipants.get(roomId)?.values() || []);
  const runStatus = getProjectExecutionStatus(roomId);

  res.json({
    ...room,
    files,
    collaborators: participants,
    collaboratorsCount: participants.length,
    runStatus
  });
});

// 4. File CRUD APIs
// List all files in project
app.get('/api/rooms/:roomId/files', (req, res) => {
  const { roomId } = req.params;
  try {
    const files = getFlatFileList(roomId);
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read file content
app.get('/api/rooms/:roomId/file-content', (req, res) => {
  const { roomId } = req.params;
  const filePath = req.query.path;

  if (!filePath) {
    return res.status(400).json({ error: 'File path parameter is required.' });
  }

  try {
    const key = `${roomId}::${filePath}`;
    // If Y.Doc exists in memory, return live buffer
    if (fileDocs.has(key)) {
      const content = fileDocs.get(key).getText('monaco').toString();
      return res.json({ path: filePath, content });
    }

    const content = readProjectFile(roomId, filePath);
    res.json({ path: filePath, content });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Create new file
app.post('/api/rooms/:roomId/files', (req, res) => {
  const { roomId } = req.params;
  const { path: filePath, content = '' } = req.body;

  if (!filePath) {
    return res.status(400).json({ error: 'File path is required.' });
  }

  try {
    createProjectFile(roomId, filePath, content);
    getOrCreateFileDoc(roomId, filePath, content);

    const files = getFlatFileList(roomId);
    // Broadcast file tree update to all peers in room
    io.to(roomId).emit('files:tree-updated', { files, action: 'create', path: filePath });

    res.status(201).json({ success: true, path: filePath, files });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create new folder
app.post('/api/rooms/:roomId/folders', (req, res) => {
  const { roomId } = req.params;
  const { path: folderPath } = req.body;

  if (!folderPath) {
    return res.status(400).json({ error: 'Folder path is required.' });
  }

  try {
    createProjectFolder(roomId, folderPath);
    const files = getFlatFileList(roomId);
    io.to(roomId).emit('files:tree-updated', { files, action: 'create-folder', path: folderPath });
    res.status(201).json({ success: true, path: folderPath, files });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Rename file or folder
app.put('/api/rooms/:roomId/files/rename', (req, res) => {
  const { roomId } = req.params;
  const { oldPath, newPath } = req.body;

  if (!oldPath || !newPath) {
    return res.status(400).json({ error: 'Both oldPath and newPath are required.' });
  }

  try {
    renameProjectEntry(roomId, oldPath, newPath);

    // Transfer Y.Doc state to new key if it exists
    const oldKey = `${roomId}::${oldPath}`;
    const newKey = `${roomId}::${newPath}`;
    if (fileDocs.has(oldKey)) {
      fileDocs.set(newKey, fileDocs.get(oldKey));
      fileDocs.delete(oldKey);
    }

    const files = getFlatFileList(roomId);
    io.to(roomId).emit('files:tree-updated', { files, action: 'rename', oldPath, newPath });

    res.json({ success: true, oldPath, newPath, files });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete file or folder
app.delete('/api/rooms/:roomId/files', (req, res) => {
  const { roomId } = req.params;
  const filePath = req.query.path;

  if (!filePath) {
    return res.status(400).json({ error: 'Path query is required.' });
  }

  try {
    deleteProjectEntry(roomId, filePath);
    const key = `${roomId}::${filePath}`;
    fileDocs.delete(key);

    const files = getFlatFileList(roomId);
    io.to(roomId).emit('files:tree-updated', { files, action: 'delete', path: filePath });

    res.json({ success: true, path: filePath, files });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Download complete project as ZIP
app.get('/api/rooms/:roomId/download', async (req, res) => {
  const { roomId } = req.params;
  const room = roomsStore.get(roomId);

  try {
    // Flush any pending file saves before zipping
    for (const [key, doc] of fileDocs.entries()) {
      if (key.startsWith(`${roomId}::`)) {
        const fileId = key.substring(`${roomId}::`.length);
        const text = doc.getText('monaco').toString();
        try { writeProjectFile(roomId, fileId, text); } catch {}
      }
    }

    const zipBuffer = await generateProjectZip(roomId, room?.name || 'codetogether-project');
    const safeProjectName = (room?.name || 'codetogether-project').replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeProjectName}.zip"`);
    res.send(zipBuffer);
  } catch (err) {
    res.status(500).json({ error: `Failed to create ZIP: ${err.message}` });
  }
});

// 6. Run / Stop / Restart Project
app.post('/api/rooms/:roomId/run', async (req, res) => {
  const { roomId } = req.params;
  const { command, port } = req.body || {};

  try {
    // Flush any unsaved active files to disk first
    for (const [key, doc] of fileDocs.entries()) {
      if (key.startsWith(`${roomId}::`)) {
        const fileId = key.substring(`${roomId}::`.length);
        const text = doc.getText('monaco').toString();
        try { writeProjectFile(roomId, fileId, text); } catch {}
      }
    }

    await startProjectExecution(
      roomId, 
      { command, port },
      {
        onOutput: (logEntry) => {
          io.to(roomId).emit('project:output', logEntry);
        },
        onStatusChange: (status, meta) => {
          io.to(roomId).emit('project:status', { status, ...meta });
        },
        onExit: (code) => {
          io.to(roomId).emit('project:status', { status: 'stopped', exitCode: code });
        }
      }
    );

    const currentStatus = getProjectExecutionStatus(roomId);
    res.json({ success: true, ...currentStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rooms/:roomId/stop', async (req, res) => {
  const { roomId } = req.params;
  try {
    await stopProjectExecution(roomId);
    io.to(roomId).emit('project:status', { status: 'stopped' });
    io.to(roomId).emit('project:output', { 
      text: '[Sandbox] Project execution halted by user.', 
      type: 'system', 
      timestamp: new Date().toISOString() 
    });
    res.json({ success: true, status: 'stopped' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rooms/:roomId/restart', async (req, res) => {
  const { roomId } = req.params;
  const { command, port } = req.body || {};

  try {
    await restartProjectExecution(
      roomId,
      { command, port },
      {
        onOutput: (logEntry) => {
          io.to(roomId).emit('project:output', logEntry);
        },
        onStatusChange: (status, meta) => {
          io.to(roomId).emit('project:status', { status, ...meta });
        }
      }
    );

    const currentStatus = getProjectExecutionStatus(roomId);
    res.json({ success: true, ...currentStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rooms/:roomId/status', (req, res) => {
  const { roomId } = req.params;
  res.json(getProjectExecutionStatus(roomId));
});

// -------------------------------------------------------------
// Real-Time Socket.IO Collaboration
// -------------------------------------------------------------

io.on('connection', (socket) => {
  let currentRoomId = null;
  let currentUser = null;
  let currentFileId = null;

  // 1. Client joins project room
  socket.on('room:join', async ({ roomId, user, activeFileId }) => {
    currentRoomId = roomId;
    currentUser = {
      id: user?.id || socket.id,
      name: user?.name || 'Teammate',
      avatar: user?.avatar,
      color: user?.color || '#89b4fa',
      isOwner: user?.isOwner ?? false,
      activeFileId: activeFileId || null,
      socketId: socket.id
    };
    currentFileId = activeFileId || null;

    socket.join(roomId);

    if (!roomParticipants.has(roomId)) {
      roomParticipants.set(roomId, new Map());
    }
    roomParticipants.get(roomId).set(socket.id, currentUser);

    if (!roomChatHistory.has(roomId)) {
      if (isDatabaseConnected()) {
        try {
          const dbMsgs = await ChatMessageModel.find({ roomId }).sort({ createdAt: 1 }).limit(100).lean();
          roomChatHistory.set(roomId, dbMsgs);
        } catch (_) {
          roomChatHistory.set(roomId, []);
        }
      } else {
        roomChatHistory.set(roomId, []);
      }
    }

    const participants = Array.from(roomParticipants.get(roomId).values());
    const runStatus = getProjectExecutionStatus(roomId);
    const chatHistory = roomChatHistory.get(roomId) || [];

    // Send full room state to the newly joined client
    socket.emit('room:joined', {
      roomId,
      participants,
      runStatus,
      chatHistory
    });

    // Notify other peers in room
    socket.to(roomId).emit('room:peer-joined', {
      user: currentUser,
      participants
    });

    console.log(`[Socket] ${currentUser.name} (${socket.id}) joined project room ${roomId} (active: ${currentFileId})`);
  });

  // 2. Active file change awareness (so teammates see who is editing which file)
  socket.on('file:active', ({ fileId }) => {
    currentFileId = fileId;
    if (currentRoomId && roomParticipants.has(currentRoomId)) {
      const userRecord = roomParticipants.get(currentRoomId).get(socket.id);
      if (userRecord) {
        userRecord.activeFileId = fileId;
      }
      const participants = Array.from(roomParticipants.get(currentRoomId).values());
      io.to(currentRoomId).emit('room:participants-updated', { participants });
    }
  });

  // 3. Multi-File Yjs Handshake & Real-Time CRDT Sync
  socket.on('yjs:sync-step-1', ({ fileId, stateVector }) => {
    if (!currentRoomId || !fileId) return;
    const doc = getOrCreateFileDoc(currentRoomId, fileId);

    try {
      const serverVector = new Uint8Array(stateVector);
      const diff = Y.encodeStateAsUpdate(doc, serverVector);
      socket.emit('yjs:sync-step-2', {
        fileId,
        diff: Array.from(diff)
      });
    } catch (e) {
      console.error(`[Yjs] Error generating sync-step-2 for ${fileId}:`, e.message);
    }
  });

  socket.on('yjs:sync-step-2', ({ fileId, diff }) => {
    if (!currentRoomId || !fileId || !diff) return;
    const doc = getOrCreateFileDoc(currentRoomId, fileId);

    try {
      if (diff.length > 0) {
        Y.applyUpdate(doc, new Uint8Array(diff));
        socket.to(currentRoomId).emit('yjs:update', {
          fileId,
          update: diff
        });
        scheduleFileAutoSave(currentRoomId, fileId);
      }
    } catch (e) {
      console.error(`[Yjs] Error applying sync-step-2 for ${fileId}:`, e.message);
    }
  });

  socket.on('yjs:update', ({ fileId, update }) => {
    if (!currentRoomId || !fileId || !update) return;
    const doc = getOrCreateFileDoc(currentRoomId, fileId);

    try {
      Y.applyUpdate(doc, new Uint8Array(update));
      // Broadcast update to all other collaborators in the room
      socket.to(currentRoomId).emit('yjs:update', {
        fileId,
        update
      });
      scheduleFileAutoSave(currentRoomId, fileId);
    } catch (e) {
      console.error(`[Yjs] Error applying update for ${fileId}:`, e.message);
    }
  });

  // 4. Remote Cursors and Selections per File
  socket.on('cursor:move', (data) => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('cursor:update', {
      socketId: socket.id,
      user: currentUser,
      ...data
    });
  });

  // 5. Real-time Team Chat
  socket.on('chat:message', (message) => {
    if (!currentRoomId || !message) return;
    if (!roomChatHistory.has(currentRoomId)) {
      roomChatHistory.set(currentRoomId, []);
    }
    const history = roomChatHistory.get(currentRoomId);
    history.push(message);
    if (history.length > 200) history.shift();

    io.to(currentRoomId).emit('chat:message', message);

    if (isDatabaseConnected()) {
      ChatMessageModel.create({
        roomId: currentRoomId,
        id: message.id || `msg-${Date.now()}`,
        senderId: message.senderId || currentUser?.id || 'anon',
        senderName: message.senderName || currentUser?.name || 'Developer',
        avatar: message.avatar || currentUser?.avatar,
        color: message.color || currentUser?.color,
        text: message.text || '',
        timestamp: message.timestamp || new Date().toLocaleTimeString()
      }).catch(err => console.warn('[MongoDB] Chat save warning:', err.message));
    }
  });

  // 6. Live Typing Indicator
  socket.on('typing:start', (data) => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('typing:start', {
      ...data,
      user: currentUser
    });
  });

  socket.on('typing:stop', (data) => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit('typing:stop', {
      ...data,
      user: currentUser
    });
  });

  // 7. Client Disconnect
  socket.on('disconnect', () => {
    if (currentRoomId) {
      socket.to(currentRoomId).emit('cursor:remove', { 
        socketId: socket.id, 
        user: currentUser,
        fileId: currentFileId 
      });

      if (roomParticipants.has(currentRoomId)) {
        roomParticipants.get(currentRoomId).delete(socket.id);
        const remaining = Array.from(roomParticipants.get(currentRoomId).values());

        socket.to(currentRoomId).emit('room:peer-left', {
          socketId: socket.id,
          user: currentUser,
          participants: remaining
        });
      }
    }
  });
});

const PORT = process.env.PORT || 5001;

function freePortIfOccupied(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
      const lines = output.split('\n');
      const pids = new Set();
      for (const line of lines) {
        if (/LISTENING|Listen/i.test(line)) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && parseInt(pid, 10) !== process.pid) {
            pids.add(pid);
          }
        }
      }
      for (const pid of pids) {
        try {
          console.log(`[Auto-Recovery] Terminating stale process (PID ${pid}) on port ${port}...`);
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        } catch (_) {}
      }
      return pids.size > 0;
    } else {
      execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
      return true;
    }
  } catch (_) {
    return false;
  }
}

let retryCount = 0;

function startListening() {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`CodeTogether Full Project Collaboration Engine`);
    console.log(`Server listening on port ${PORT}`);
    console.log(`Storage root: ${STORAGE_DIR}`);
    console.log(`===============================================`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    if (retryCount === 0) {
      retryCount++;
      console.log(`[Auto-Recovery] Port ${PORT} is occupied. Automatically clearing stale process...`);
      freePortIfOccupied(PORT);
      setTimeout(() => {
        try { server.close(); } catch (_) {}
        console.log(`[Auto-Recovery] Retrying bind on port ${PORT}...`);
        startListening();
      }, 700);
    } else {
      console.log(`[Notice] Port ${PORT} already in use. Ensure prior instance is stopped.`);
    }
  } else {
    console.error('[Server Error]', err);
  }
});

// Production error handler middleware (prevents leaking internal stack traces)
app.use((err, req, res, next) => {
  console.error('[Unhandled Express Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'An unexpected internal error occurred.' 
      : (err.message || 'Internal server error')
  });
});

async function gracefulShutdown(signal) {
  console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('[Server] HTTP and Socket server closed cleanly.');
    try {
      await closeDatabase();
      console.log('[Server] Database connections closed.');
    } catch (_) {}
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[Server] Forced shutdown due to lingering connections.');
    process.exit(1);
  }, 8000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startListening();

export { app, server, io };
