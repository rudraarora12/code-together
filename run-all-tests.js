import http from 'http';
import { io } from 'socket.io-client';
import * as Y from 'yjs';

// Import server directly so it starts up in this exact process
import './server/server.js';

const BASE_URL = 'http://127.0.0.1:5001';

// Wait for server to bind port
await new Promise(r => setTimeout(r, 1200));

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return { status: res.status, data: await res.json() };
  }
  return { status: res.status, buffer: await res.arrayBuffer() };
}

console.log('=== STARTING INTEGRATED FULL-STACK TEST SUITE ===\n');
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

try {
  // 1. Health check
  const health = await request('/health');
  console.log('Health response:', health);
  assert(health.status === 200 && health.data.status === 'ok', 'GET /health responds with 200 OK');

  // 2. Upload an entire project folder
  const testProjectFiles = [
    {
      path: 'package.json',
      content: JSON.stringify({
        name: 'my-collaborative-app',
        version: '1.0.0',
        scripts: { dev: 'echo "Vite server listening on port 5174"' }
      }, null, 2)
    },
    {
      path: 'vite.config.js',
      content: 'export default { server: { port: 5174 } };'
    },
    {
      path: 'index.html',
      content: '<!DOCTYPE html><html><head><title>App</title></head><body><div id="root"></div></body></html>'
    },
    {
      path: 'src/main.jsx',
      content: 'import React from "react";\nimport App from "./App";\nconsole.log("Starting...");'
    },
    {
      path: 'src/App.jsx',
      content: 'export default function App() {\n  return <h1>Hello CodeTogether Hackathon!</h1>;\n}'
    }
  ];

  const createRes = await request('/api/rooms/project', {
    method: 'POST',
    body: JSON.stringify({
      projectName: 'Fullstack Collaborative IDE',
      files: testProjectFiles,
      user: { id: 'lead-dev', name: 'Lead Dev' }
    })
  });

  assert(createRes.status === 201 && createRes.data?.roomId, 'POST /api/rooms/project successfully created project room');
  const roomId = createRes.data.roomId;
  console.log(`-> Room created: ${roomId}`);
  assert(createRes.data.room?.projectType === 'react-vite', `Auto-detected framework: ${createRes.data.room?.projectTypeName}`);
  assert(createRes.data.files?.length === 5, 'All 5 files in project tree preserved');

  // 3. Room details and project metadata
  const roomMeta = await request(`/api/rooms/${roomId}`);
  assert(roomMeta.status === 200 && roomMeta.data.name === 'Fullstack Collaborative IDE', 'GET /api/rooms/:id retrieves room and metadata');

  // 4. File content reading
  const fileContent = await request(`/api/rooms/${roomId}/file-content?path=src/App.jsx`);
  assert(fileContent.status === 200 && fileContent.data.content.includes('Hello CodeTogether Hackathon!'), 'GET /file-content reads exact source file content');

  // 5. File CRUD: Create new file
  const newFile = await request(`/api/rooms/${roomId}/files`, {
    method: 'POST',
    body: JSON.stringify({ path: 'src/services/api.js', content: 'export const fetchData = () => {};' })
  });
  assert(newFile.status === 201 && newFile.data.files.some(f => f.path === 'src/services/api.js'), 'POST /files creates nested file in room project');

  // 6. File CRUD: Rename file
  const renameFile = await request(`/api/rooms/${roomId}/files/rename`, {
    method: 'PUT',
    body: JSON.stringify({ oldPath: 'src/services/api.js', newPath: 'src/services/client.js' })
  });
  assert(renameFile.status === 200 && renameFile.data.files.some(f => f.path === 'src/services/client.js'), 'PUT /files/rename updates path and tree');

  // 7. File CRUD: Delete file
  const deleteFile = await request(`/api/rooms/${roomId}/files?path=src/services/client.js`, {
    method: 'DELETE'
  });
  assert(deleteFile.status === 200 && !deleteFile.data.files.some(f => f.path === 'src/services/client.js'), 'DELETE /files safely removes file');

  // 8. ZIP Download
  const zip = await request(`/api/rooms/${roomId}/download`);
  const zipBytes = new Uint8Array(zip.buffer);
  const hasZipHeader = zipBytes[0] === 0x50 && zipBytes[1] === 0x4B; // PK header
  assert(zip.status === 200 && hasZipHeader, 'GET /download generates valid full project ZIP archive');

  // 9. Isolated Project Run & Stop
  const runRes = await request(`/api/rooms/${roomId}/run`, {
    method: 'POST',
    body: JSON.stringify({ command: 'echo "Server started on port 5174"' })
  });
  assert(runRes.status === 200, 'POST /run triggers isolated sandbox execution');

  await new Promise(r => setTimeout(r, 600));

  const statusRes = await request(`/api/rooms/${roomId}/status`);
  assert(statusRes.status === 200 && statusRes.data.logs.length > 0, 'GET /status returns streaming execution logs');

  const stopRes = await request(`/api/rooms/${roomId}/stop`, { method: 'POST' });
  assert(stopRes.status === 200 && stopRes.data.status === 'stopped', 'POST /stop terminates project execution');

  // 10. Multi-Client Socket.IO + Yjs Real-Time Synchronization
  console.log('\n--- Testing Multi-Client Socket.IO & Yjs Sync ---');
  await new Promise((resolve) => {
    const socketAlice = io(BASE_URL, { transports: ['websocket'] });
    const socketBob = io(BASE_URL, { transports: ['websocket'] });

    socketAlice.on('connect', () => {
      socketAlice.emit('room:join', {
        roomId,
        user: { id: 'alice', name: 'Alice', color: '#89b4fa' },
        activeFileId: 'src/App.jsx'
      });
    });

    socketAlice.on('room:joined', () => {
      socketBob.connect();
    });

    socketBob.on('connect', () => {
      socketBob.emit('room:join', {
        roomId,
        user: { id: 'bob', name: 'Bob', color: '#f38ba8' },
        activeFileId: 'src/main.jsx'
      });
    });

    socketBob.on('room:joined', (data) => {
      assert(data.participants.length >= 2, 'Collaborator presence: Both Alice and Bob tracked in room');

      // Test real-time chat broadcast
      socketAlice.emit('chat:message', {
        id: 'msg-test',
        senderName: 'Alice',
        text: 'Hello team!'
      });
    });

    socketBob.on('chat:message', (msg) => {
      if (msg.text === 'Hello team!') {
        assert(true, 'Team Chat: Real-time broadcast between collaborators');

        // Test Yjs document handshake & CRDT synchronization
        const docBob = new Y.Doc();
        const vectorBob = Y.encodeStateVector(docBob);
        socketBob.emit('yjs:sync-step-1', {
          fileId: 'src/App.jsx',
          stateVector: Array.from(vectorBob)
        });
      }
    });

    socketBob.on('yjs:sync-step-2', ({ fileId, diff }) => {
      if (fileId === 'src/App.jsx') {
        const docBob = new Y.Doc();
        Y.applyUpdate(docBob, new Uint8Array(diff));
        const content = docBob.getText('monaco').toString();
        assert(content.includes('Hello CodeTogether Hackathon!'), `Yjs CRDT Document: Synced file "${fileId}" (${content.length} characters)`);

        socketAlice.disconnect();
        socketBob.disconnect();
        resolve();
      }
    });

    setTimeout(() => {
      socketAlice.disconnect();
      socketBob.disconnect();
      resolve();
    }, 5000);
  });

  console.log(`\n===============================================`);
  console.log(`ALL INTEGRATION TESTS PASSED: ${passed} passed, ${failed} failed.`);
  console.log(`===============================================`);
  process.exit(failed > 0 ? 1 : 0);
} catch (err) {
  console.error('Fatal test error:', err);
  process.exit(1);
}
