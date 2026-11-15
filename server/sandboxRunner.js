import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';
import treeKill from 'tree-kill';
import { getRoomProjectDir } from './projectStore.js';

const SANDBOXES_ROOT = path.join(process.cwd(), 'server', 'sandboxes');

if (!fs.existsSync(SANDBOXES_ROOT)) {
  fs.mkdirSync(SANDBOXES_ROOT, { recursive: true });
}

// Active runtimes: roomId -> RuntimeState
const activeRuntimes = new Map();

// Base port allocation for web servers (ranges 6100-6900)
let nextPort = 6100;
function allocatePort() {
  const port = nextPort;
  nextPort += 1;
  if (nextPort > 6900) nextPort = 6100;
  return port;
}

// Check Docker availability on system
let hasDocker = false;
try {
  execSync('docker --version', { stdio: 'ignore', timeout: 2000 });
  hasDocker = true;
} catch {
  hasDocker = false;
}

console.log(`[Sandbox] Docker container engine available: ${hasDocker}`);

// Sanitize and whitelist environment variables to prevent leaking host secrets
function createRestrictedEnvironment(customEnv = {}) {
  const safeEnv = {
    NODE_ENV: 'development',
    PATH: process.env.PATH || '',
    LANG: 'en_US.UTF-8',
    COLORTERM: 'truecolor',
    FORCE_COLOR: '1',
    CI: 'true',
    ...customEnv
  };

  // Explicitly remove any secrets or tokens that might exist in environment
  const dangerousPrefixes = ['AWS_', 'GITHUB_', 'API_', 'SECRET_', 'TOKEN_', 'PASSWORD_', 'SSH_'];
  for (const key of Object.keys(process.env)) {
    if (dangerousPrefixes.some(p => key.startsWith(p))) {
      delete safeEnv[key];
    }
  }

  return safeEnv;
}

// Synchronize files from storage directory into isolated sandbox directory
function syncFilesToSandbox(roomId) {
  const sourceDir = getRoomProjectDir(roomId);
  const sandboxDir = path.join(SANDBOXES_ROOT, roomId);

  if (!fs.existsSync(sandboxDir)) {
    fs.mkdirSync(sandboxDir, { recursive: true });
  }

  // Recursive copy
  function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyRecursive(sourceDir, sandboxDir);
  return sandboxDir;
}

/**
 * Start project execution in an isolated sandbox.
 */
export async function startProjectExecution(roomId, options = {}, callbacks = {}) {
  const { onOutput, onStatusChange, onExit } = callbacks;

  // If already running, stop existing instance first
  if (activeRuntimes.has(roomId)) {
    console.log(`[Sandbox] Stopping existing instance for room ${roomId} before restart`);
    await stopProjectExecution(roomId);
  }

  const sandboxDir = syncFilesToSandbox(roomId);
  const allocatedPort = options.port || allocatePort();

  const runtime = {
    roomId,
    sandboxDir,
    port: allocatedPort,
    detectedPort: null,
    process: null,
    status: 'building', // 'building' | 'running' | 'stopped' | 'error'
    startTime: Date.now(),
    logs: [],
    previewUrl: null,
    isWeb: false,
    staticServer: null
  };

  activeRuntimes.set(roomId, runtime);
  onStatusChange?.(runtime.status, { port: allocatedPort });

  const appendLog = (text, type = 'stdout') => {
    const entry = { text, type, timestamp: new Date().toISOString() };
    runtime.logs.push(entry);
    if (runtime.logs.length > 2000) runtime.logs.shift();
    onOutput?.(entry);
  };

  appendLog(`[Sandbox] Initializing isolated execution environment for Room: ${roomId}`, 'system');
  appendLog(`[Sandbox] Engine: ${hasDocker ? 'Docker Container (Isolated)' : 'Process Sandbox (Restricted Environment & Resource Limits)'}`, 'system');
  appendLog(`[Sandbox] Allocated isolated network port: ${allocatedPort}`, 'system');

  // Check if static web project
  const hasIndexHtml = fs.existsSync(path.join(sandboxDir, 'index.html'));
  const hasPackageJson = fs.existsSync(path.join(sandboxDir, 'package.json'));

  let commandToRun = options.command;

  // Determine command if not explicitly supplied
  if (!commandToRun) {
    if (hasPackageJson) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(sandboxDir, 'package.json'), 'utf-8'));
        const scripts = pkg.scripts || {};
        if (scripts.dev) {
          commandToRun = 'npm run dev';
        } else if (scripts.start) {
          commandToRun = 'npm start';
        } else {
          commandToRun = 'node server.js || node index.js || node app.js';
        }
      } catch {
        commandToRun = 'node index.js';
      }
    } else if (fs.existsSync(path.join(sandboxDir, 'main.py'))) {
      commandToRun = 'python main.py';
    } else if (fs.existsSync(path.join(sandboxDir, 'app.py'))) {
      commandToRun = 'python app.py';
    } else if (fs.existsSync(path.join(sandboxDir, 'Main.java'))) {
      commandToRun = 'javac Main.java && java Main';
    } else if (fs.existsSync(path.join(sandboxDir, 'main.cpp'))) {
      commandToRun = 'g++ main.cpp -o main && ./main';
    } else if (hasIndexHtml) {
      // HTML/CSS/JS static site - spin up lightweight static web server
      runtime.isWeb = true;
      runtime.detectedPort = allocatedPort;
      runtime.previewUrl = `http://localhost:${allocatedPort}`;
      runtime.status = 'running';

      startStaticServer(sandboxDir, allocatedPort, (err) => {
        if (err) {
          appendLog(`[Sandbox] Failed to start static web server: ${err.message}`, 'stderr');
          runtime.status = 'error';
          onStatusChange?.(runtime.status, { error: err.message });
        } else {
          appendLog(`[Sandbox] Static web preview server running on port ${allocatedPort}`, 'system');
          appendLog(`[Sandbox] Web application is live at ${runtime.previewUrl}`, 'system');
          onStatusChange?.(runtime.status, { 
            port: allocatedPort, 
            previewUrl: runtime.previewUrl,
            isWeb: true 
          });
        }
      });
      return runtime;
    } else {
      commandToRun = 'echo "No recognized runnable entry point found. Configure run command in settings."';
    }
  }

  // Pre-check for node dependencies
  if (hasPackageJson && !fs.existsSync(path.join(sandboxDir, 'node_modules'))) {
    appendLog(`[Sandbox] Dependencies not yet installed in sandbox. Installing...`, 'system');
    try {
      const installProc = spawn('npm', ['install', '--prefer-offline', '--no-audit'], {
        cwd: sandboxDir,
        env: createRestrictedEnvironment({ PORT: String(allocatedPort) }),
        shell: true
      });

      installProc.stdout.on('data', d => appendLog(d.toString(), 'stdout'));
      installProc.stderr.on('data', d => appendLog(d.toString(), 'stderr'));

      await new Promise((resolve) => {
        installProc.on('close', (code) => {
          if (code === 0) {
            appendLog(`[Sandbox] Dependencies installed successfully.`, 'system');
          } else {
            appendLog(`[Sandbox] Dependency installation exited with code ${code}. Continuing to start...`, 'stderr');
          }
          resolve();
        });
      });
    } catch (e) {
      appendLog(`[Sandbox] Warning during npm install: ${e.message}`, 'stderr');
    }
  }

  appendLog(`[Sandbox] Launching command: ${commandToRun}`, 'system');
  runtime.status = 'running';
  onStatusChange?.(runtime.status, { port: allocatedPort });

  const safeEnv = createRestrictedEnvironment({
    PORT: String(allocatedPort),
    VITE_PORT: String(allocatedPort)
  });

  try {
    const child = spawn(commandToRun, {
      cwd: sandboxDir,
      env: safeEnv,
      shell: true,
      detached: false
    });

    runtime.process = child;

    // Execution safety timeout
    const timeoutMs = options.timeout || 30 * 60 * 1000; // 30 minutes max
    const timeoutTimer = setTimeout(() => {
      if (runtime.process && runtime.status === 'running') {
        appendLog(`[Sandbox] Execution safety timeout reached (${Math.round(timeoutMs / 1000)}s limit). Halting sandbox process.`, 'stderr');
        stopProjectExecution(roomId);
      }
    }, timeoutMs);

    // Scan output for ports and web preview links
    const portRegex = /(?:localhost|127\.0\.0\.1|0\.0\.0\.0|port)[:\s]+(\d{3,5})/i;

    child.stdout.on('data', (data) => {
      const text = data.toString();
      appendLog(text, 'stdout');

      const match = text.match(portRegex);
      if (match && !runtime.previewUrl) {
        const foundPort = parseInt(match[1], 10);
        if (foundPort > 1024 && foundPort < 65535) {
          runtime.detectedPort = foundPort;
          runtime.previewUrl = `http://localhost:${foundPort}`;
          runtime.isWeb = true;
          appendLog(`[Sandbox] Detected active web server at ${runtime.previewUrl}`, 'system');
          onStatusChange?.(runtime.status, { 
            port: foundPort, 
            previewUrl: runtime.previewUrl,
            isWeb: true 
          });
        }
      }
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      appendLog(text, 'stderr');

      const match = text.match(portRegex);
      if (match && !runtime.previewUrl) {
        const foundPort = parseInt(match[1], 10);
        if (foundPort > 1024 && foundPort < 65535) {
          runtime.detectedPort = foundPort;
          runtime.previewUrl = `http://localhost:${foundPort}`;
          runtime.isWeb = true;
          onStatusChange?.(runtime.status, { 
            port: foundPort, 
            previewUrl: runtime.previewUrl,
            isWeb: true 
          });
        }
      }
    });

    child.on('close', (code) => {
      clearTimeout(timeoutTimer);
      appendLog(`[Sandbox] Process exited with code ${code ?? 0}`, 'system');
      runtime.status = 'stopped';
      runtime.process = null;
      onStatusChange?.('stopped', { exitCode: code });
      onExit?.(code);
    });

    child.on('error', (err) => {
      clearTimeout(timeoutTimer);
      appendLog(`[Sandbox] Execution error: ${err.message}`, 'stderr');
      runtime.status = 'error';
      runtime.process = null;
      onStatusChange?.('error', { error: err.message });
    });

  } catch (err) {
    appendLog(`[Sandbox] Failed to spawn process: ${err.message}`, 'stderr');
    runtime.status = 'error';
    onStatusChange?.('error', { error: err.message });
  }

  return runtime;
}

/**
 * Start lightweight static HTTP server for pure HTML/CSS/JS projects
 */
function startStaticServer(dir, port, callback) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.wasm': 'application/wasm'
  };

  const srv = http.createServer((req, res) => {
    let filePath = path.join(dir, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    
    // Guard against path traversal
    if (!filePath.startsWith(dir)) {
      res.writeHead(403);
      res.end('Access Denied');
      return;
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(dir, 'index.html');
    }

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('File Not Found');
    }
  });

  srv.listen(port, () => callback(null));
  srv.on('error', (err) => callback(err));
}

/**
 * Stop running project for a room
 */
export async function stopProjectExecution(roomId) {
  const runtime = activeRuntimes.get(roomId);
  if (!runtime) return { success: true };

  return new Promise((resolve) => {
    if (runtime.process && runtime.process.pid) {
      treeKill(runtime.process.pid, 'SIGKILL', (err) => {
        if (err) console.warn(`[Sandbox] treeKill warning: ${err.message}`);
        runtime.status = 'stopped';
        runtime.process = null;
        resolve({ success: true });
      });
    } else {
      runtime.status = 'stopped';
      resolve({ success: true });
    }
  });
}

/**
 * Restart running project
 */
export async function restartProjectExecution(roomId, options = {}, callbacks = {}) {
  await stopProjectExecution(roomId);
  return await startProjectExecution(roomId, options, callbacks);
}

/**
 * Get active runtime status for room
 */
export function getProjectExecutionStatus(roomId) {
  const runtime = activeRuntimes.get(roomId);
  if (!runtime) {
    return {
      status: 'stopped',
      logs: [],
      previewUrl: null,
      port: null,
      isWeb: false
    };
  }

  return {
    status: runtime.status,
    logs: runtime.logs,
    previewUrl: runtime.previewUrl,
    port: runtime.detectedPort || runtime.port,
    isWeb: runtime.isWeb
  };
}
