import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const STORAGE_ROOT = path.join(process.cwd(), 'server', 'storage', 'rooms');

if (!fs.existsSync(STORAGE_ROOT)) {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true });
}

export const EXCLUDE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '__pycache__',
  '.venv',
  'vendor',
  '.idea',
  '.vscode',
  'coverage'
]);

export const SENSITIVE_FILES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.env.test',
  'id_rsa',
  'id_ed25519',
  'credentials.json'
]);

// Sanitize relative path to prevent path traversal
export function sanitizeRelativePath(relPath) {
  if (!relPath) return '';
  const normalized = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const segments = normalized.split('/');
  const safeSegments = [];
  for (const seg of segments) {
    if (!seg || seg === '.') continue;
    if (seg === '..') {
      throw new Error(`Path traversal detected: ${relPath}`);
    }
    safeSegments.push(seg);
  }
  return safeSegments.join('/');
}

// Get the directory where project files are stored for a room
export function getRoomProjectDir(roomId) {
  const roomDir = path.join(STORAGE_ROOT, roomId, 'files');
  if (!fs.existsSync(roomDir)) {
    fs.mkdirSync(roomDir, { recursive: true });
  }
  return roomDir;
}

// Detect language from filename
export function detectLanguage(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'c':
    case 'h':
    case 'hpp':
      return 'cpp';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'yml':
    case 'yaml':
      return 'yaml';
    case 'xml':
      return 'xml';
    case 'sql':
      return 'sql';
    case 'sh':
    case 'bash':
      return 'shell';
    case 'dockerfile':
      return 'dockerfile';
    default:
      return 'plaintext';
  }
}

// Detect project type from list of file paths
export function detectProjectType(filePaths) {
  const paths = new Set(filePaths.map(p => p.toLowerCase()));

  // React + Vite
  if (
    paths.has('vite.config.js') ||
    paths.has('vite.config.ts') ||
    paths.has('vite.config.mjs')
  ) {
    return {
      type: 'react-vite',
      name: 'React + Vite',
      language: 'javascript',
      color: '#61dafb',
      runCommand: 'npm run dev',
      defaultPort: 5173,
      isWeb: true
    };
  }

  // Node.js + Express / generic Node
  if (paths.has('package.json')) {
    return {
      type: 'nodejs',
      name: 'Node.js Application',
      language: 'javascript',
      color: '#68a063',
      runCommand: 'npm start',
      defaultPort: 3000,
      isWeb: true
    };
  }

  // Python
  if (
    paths.has('requirements.txt') ||
    paths.has('main.py') ||
    paths.has('app.py') ||
    Array.from(paths).some(p => p.endsWith('.py'))
  ) {
    const entry = paths.has('app.py') ? 'app.py' : 'main.py';
    return {
      type: 'python',
      name: 'Python Project',
      language: 'python',
      color: '#3572a5',
      runCommand: `python ${entry}`,
      defaultPort: 5000,
      isWeb: paths.has('app.py')
    };
  }

  // Java
  if (paths.has('pom.xml') || Array.from(paths).some(p => p.endsWith('.java'))) {
    return {
      type: 'java',
      name: 'Java Project',
      language: 'java',
      color: '#b07219',
      runCommand: 'javac Main.java && java Main',
      defaultPort: 8080,
      isWeb: false
    };
  }

  // C++
  if (
    paths.has('cmakelists.txt') ||
    paths.has('makefile') ||
    Array.from(paths).some(p => p.endsWith('.cpp') || p.endsWith('.c'))
  ) {
    return {
      type: 'cpp',
      name: 'C/C++ Project',
      language: 'cpp',
      color: '#f34b7d',
      runCommand: 'g++ main.cpp -o main && ./main',
      defaultPort: 0,
      isWeb: false
    };
  }

  // HTML/CSS/JS
  if (paths.has('index.html')) {
    return {
      type: 'web-static',
      name: 'HTML5 Web Application',
      language: 'html',
      color: '#e34c26',
      runCommand: 'serve',
      defaultPort: 8080,
      isWeb: true
    };
  }

  return {
    type: 'generic',
    name: 'Standard Project',
    language: 'plaintext',
    color: '#89b4fa',
    runCommand: '',
    defaultPort: 3000,
    isWeb: false
  };
}

// Write uploaded project files to room directory
export function storeProjectFiles(roomId, files) {
  const baseDir = getRoomProjectDir(roomId);

  files.forEach(file => {
    const safePath = sanitizeRelativePath(file.path || file.name);
    if (!safePath) return;

    // Check for sensitive files
    const fileName = path.basename(safePath);
    if (SENSITIVE_FILES.has(fileName) && !file.allowSensitive) {
      console.warn(`[ProjectStore] Skipping sensitive file: ${safePath}`);
      return;
    }

    const fullPath = path.join(baseDir, safePath);
    const parentDir = path.dirname(fullPath);

    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(fullPath, file.content ?? '', 'utf-8');
  });

  console.log(`[ProjectStore] Saved ${files.length} files to room ${roomId}`);
}

// Recursively scan room project directory and return flat list of files
export function getFlatFileList(roomId) {
  const baseDir = getRoomProjectDir(roomId);
  const result = [];

  function scan(currentDir, relativePrefix = '') {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;

      const relPath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        scan(fullPath, relPath);
      } else {
        const stats = fs.statSync(fullPath);
        result.push({
          id: relPath,
          path: relPath,
          name: entry.name,
          size: stats.size,
          updatedAt: stats.mtime.toISOString(),
          language: detectLanguage(entry.name)
        });
      }
    }
  }

  scan(baseDir);
  return result;
}

// Read file content
export function readProjectFile(roomId, filePath) {
  const safePath = sanitizeRelativePath(filePath);
  const fullPath = path.join(getRoomProjectDir(roomId), safePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

// Write/update file content
export function writeProjectFile(roomId, filePath, content) {
  const safePath = sanitizeRelativePath(filePath);
  const fullPath = path.join(getRoomProjectDir(roomId), safePath);
  const parentDir = path.dirname(fullPath);

  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content, 'utf-8');
  return { path: safePath, size: Buffer.byteLength(content, 'utf-8') };
}

// Create new file
export function createProjectFile(roomId, filePath, initialContent = '') {
  return writeProjectFile(roomId, filePath, initialContent);
}

// Create new folder
export function createProjectFolder(roomId, folderPath) {
  const safePath = sanitizeRelativePath(folderPath);
  const fullPath = path.join(getRoomProjectDir(roomId), safePath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return { path: safePath };
}

// Rename file or folder
export function renameProjectEntry(roomId, oldPath, newPath) {
  const safeOld = sanitizeRelativePath(oldPath);
  const safeNew = sanitizeRelativePath(newPath);

  const fullOld = path.join(getRoomProjectDir(roomId), safeOld);
  const fullNew = path.join(getRoomProjectDir(roomId), safeNew);

  if (!fs.existsSync(fullOld)) {
    throw new Error(`Source not found: ${oldPath}`);
  }

  const parentDir = path.dirname(fullNew);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  fs.renameSync(fullOld, fullNew);
  return { oldPath: safeOld, newPath: safeNew };
}

// Delete file or folder
export function deleteProjectEntry(roomId, targetPath) {
  const safePath = sanitizeRelativePath(targetPath);
  const fullPath = path.join(getRoomProjectDir(roomId), safePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Target not found: ${targetPath}`);
  }

  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    fs.rmSync(fullPath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(fullPath);
  }

  return { path: safePath, isDirectory: stat.isDirectory() };
}

// Generate ZIP buffer for downloading complete project
export async function generateProjectZip(roomId, projectName = 'project') {
  const baseDir = getRoomProjectDir(roomId);
  const zip = new JSZip();

  function addDirToZip(currentDir, zipFolder) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        const subZip = zipFolder.folder(entry.name);
        addDirToZip(fullPath, subZip);
      } else {
        const content = fs.readFileSync(fullPath);
        zipFolder.file(entry.name, content);
      }
    }
  }

  addDirToZip(baseDir, zip);
  return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
