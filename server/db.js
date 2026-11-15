import mongoose from 'mongoose';

/**
 * MongoDB Atlas Database Service for CodeTogether
 * Manages persistent storage for rooms, users, files, and chat messages.
 * Falls back gracefully to local disk store if MONGODB_URI is not set.
 */

let isConnected = false;
let dbClient = null;

// 1. User Schema
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  role: { type: String, default: 'Developer' },
  avatar: { type: String },
  color: { type: String, default: '#89b4fa' },
  bio: { type: String, default: '' },
  passwordHash: { type: String }
}, { timestamps: true });

// 2. Room Metadata Schema
const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  projectType: { type: String, default: 'generic' },
  projectTypeName: { type: String, default: 'Standard Project' },
  primaryLanguage: { type: String, default: 'javascript' },
  badgeColor: { type: String, default: '#89b4fa' },
  isWeb: { type: Boolean, default: false },
  runCommand: { type: String, default: '' },
  owner: {
    id: { type: String, required: true },
    name: { type: String, default: 'Developer' },
    email: { type: String },
    avatar: { type: String }
  },
  collaborators: [{
    id: String,
    name: String,
    avatar: String,
    role: String,
    color: String
  }],
  settings: {
    maxFiles: { type: Number, default: 500 },
    maxSizeMb: { type: Number, default: 50 }
  }
}, { timestamps: true });

// 3. Project File Schema
const projectFileSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  path: { type: String, required: true },
  name: { type: String, required: true },
  content: { type: String, default: '' },
  size: { type: Number, default: 0 },
  isDirectory: { type: Boolean, default: false }
}, { timestamps: true });

// Compound index to guarantee uniqueness per file in each room
projectFileSchema.index({ roomId: 1, path: 1 }, { unique: true });

// 4. Chat Message Schema
const chatMessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  id: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  avatar: { type: String },
  color: { type: String, default: '#89b4fa' },
  text: { type: String, required: true },
  timestamp: { type: String, required: true }
}, { timestamps: true });

// Compile models
export const User = mongoose.model('User', userSchema);
export const Room = mongoose.model('Room', roomSchema);
export const ProjectFile = mongoose.model('ProjectFile', projectFileSchema);
export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

/**
 * Connect to MongoDB Atlas
 */
export async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) {
    console.log('[Database] No MONGODB_URI configured. Operating in High-Performance Local Disk Mode.');
    return { connected: false, mode: 'local_disk' };
  }

  try {
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    };

    mongoose.connection.on('connected', () => {
      isConnected = true;
      console.log('[Database] Successfully connected to MongoDB Atlas.');
    });

    mongoose.connection.on('error', (err) => {
      isConnected = false;
      console.warn('[Database] MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.log('[Database] Disconnected from MongoDB.');
    });

    dbClient = await mongoose.connect(uri, options);
    isConnected = true;
    return { connected: true, mode: 'mongodb_atlas', host: mongoose.connection.host };
  } catch (err) {
    isConnected = false;
    console.warn(`[Database] Could not connect to MongoDB Atlas (${err.message}). Falling back to local disk persistence.`);
    return { connected: false, mode: 'local_disk', error: err.message };
  }
}

export function isDatabaseConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export function getDatabaseStatus() {
  const stateMap = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = stateMap[mongoose.connection.readyState] || 'unknown';
  return {
    connected: isDatabaseConnected(),
    state,
    host: isConnected ? mongoose.connection.host : null,
    dbName: isConnected ? mongoose.connection.name : null,
    mode: isConnected ? 'mongodb_atlas' : 'local_disk'
  };
}

/**
 * Disconnect database gracefully
 */
export async function closeDatabase() {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
  }
}
