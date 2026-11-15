import JSZip from 'jszip';

export const DEFAULT_IGNORED_DIRS = [
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
  'coverage',
  '.turbo'
];

export const SENSITIVE_PATTERNS = [
  /^\.env(\..+)?$/i,
  /^id_rsa$/i,
  /^id_ed25519$/i,
  /credentials\.json$/i
];

export const BINARY_EXTENSIONS = new Set([
  'exe', 'dll', 'so', 'bin', 'zip', 'tar', 'gz', '7z', 'rar',
  'pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico',
  'mp3', 'mp4', 'mov', 'wav', 'wasm', 'class', 'o', 'obj', 'db',
  'sqlite', 'pyc', 'iso', 'woff', 'woff2', 'ttf', 'eot'
]);

/**
 * Clean and normalize a relative path, rejecting any path traversal attempts.
 */
export function sanitizePath(rawPath) {
  if (!rawPath) return '';
  const normalized = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = normalized.split('/');
  const safeParts = [];

  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      throw new Error(`Security validation failed: Path traversal detected in entry "${rawPath}"`);
    }
    safeParts.push(part);
  }

  return safeParts.join('/');
}

/**
 * Checks whether a path should be ignored according to ignore patterns.
 */
export function isIgnoredPath(pathStr, ignoredPatterns = DEFAULT_IGNORED_DIRS) {
  const segments = pathStr.split('/');
  return segments.some(segment => ignoredPatterns.includes(segment));
}

/**
 * Checks if a filename matches sensitive file patterns (e.g. .env).
 */
export function isSensitiveFile(fileName) {
  return SENSITIVE_PATTERNS.some(pat => pat.test(fileName));
}

/**
 * Detects project type and execution presets based on file listing.
 */
export function detectProjectTypeFromFiles(fileList) {
  const pathSet = new Set(fileList.map(f => (f.path || f.name).toLowerCase()));

  // React + Vite
  if (
    pathSet.has('vite.config.js') ||
    pathSet.has('vite.config.ts') ||
    pathSet.has('vite.config.mjs')
  ) {
    return {
      type: 'react-vite',
      name: 'React + Vite',
      badgeColor: '#61dafb',
      runCommand: 'npm run dev',
      defaultPort: 5173,
      isWeb: true,
      description: 'Modern frontend project with instant Vite HMR'
    };
  }

  // Node.js + Express
  if (pathSet.has('package.json')) {
    return {
      type: 'nodejs',
      name: 'Node.js / Express',
      badgeColor: '#68a063',
      runCommand: 'npm start',
      defaultPort: 3000,
      isWeb: true,
      description: 'Fullstack or backend Node.js server'
    };
  }

  // Python
  if (
    pathSet.has('requirements.txt') ||
    pathSet.has('main.py') ||
    pathSet.has('app.py') ||
    fileList.some(f => f.path.endsWith('.py'))
  ) {
    const isApp = pathSet.has('app.py');
    return {
      type: 'python',
      name: 'Python Application',
      badgeColor: '#3572a5',
      runCommand: isApp ? 'python app.py' : 'python main.py',
      defaultPort: 5000,
      isWeb: isApp,
      description: 'Python script or Flask/FastAPI web service'
    };
  }

  // Java
  if (pathSet.has('pom.xml') || fileList.some(f => f.path.endsWith('.java'))) {
    return {
      type: 'java',
      name: 'Java Project',
      badgeColor: '#b07219',
      runCommand: 'javac Main.java && java Main',
      defaultPort: 8080,
      isWeb: false,
      description: 'Java application workspace'
    };
  }

  // C++
  if (
    pathSet.has('cmakelists.txt') ||
    pathSet.has('makefile') ||
    fileList.some(f => f.path.endsWith('.cpp') || f.path.endsWith('.c'))
  ) {
    return {
      type: 'cpp',
      name: 'C / C++ Project',
      badgeColor: '#f34b7d',
      runCommand: 'g++ main.cpp -o main && ./main',
      defaultPort: 0,
      isWeb: false,
      description: 'Compiled C/C++ program'
    };
  }

  // HTML / CSS / JS Static
  if (pathSet.has('index.html')) {
    return {
      type: 'web-static',
      name: 'HTML5 Static Web',
      badgeColor: '#e34c26',
      runCommand: 'serve',
      defaultPort: 8080,
      isWeb: true,
      description: 'Static website with HTML, CSS and JavaScript'
    };
  }

  return {
    type: 'generic',
    name: 'Standard Workspace',
    badgeColor: '#89b4fa',
    runCommand: '',
    defaultPort: 3000,
    isWeb: false,
    description: 'Generic programming project workspace'
  };
}

/**
 * Builds a nested file tree structure for previewing.
 */
export function buildFileTree(files) {
  const root = { name: 'root', isDir: true, children: {} };

  files.forEach(file => {
    const parts = file.path.split('/');
    let curr = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        curr.children[part] = {
          name: part,
          path: file.path,
          size: file.size,
          isDir: false
        };
      } else {
        if (!curr.children[part]) {
          curr.children[part] = {
            name: part,
            path: parts.slice(0, i + 1).join('/'),
            isDir: true,
            children: {}
          };
        }
        curr = curr.children[part];
      }
    }
  });

  function toArray(node) {
    if (!node.children) return [];
    return Object.values(node.children)
      .map(child => ({
        ...child,
        children: child.isDir ? toArray(child) : undefined
      }))
      .sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });
  }

  return toArray(root);
}

/**
 * Parses files from folder picker input (<input webkitdirectory />).
 */
export async function processFolderUpload(fileList, options = {}) {
  const ignoredPatterns = options.ignoredPatterns || DEFAULT_IGNORED_DIRS;
  const allowSecrets = options.allowSecrets ?? false;

  const validFiles = [];
  const sensitiveFilesExcluded = [];
  let totalBytes = 0;
  let rootFolderName = '';

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const rawPath = file.webkitRelativePath || file.name;
    const safePath = sanitizePath(rawPath);

    if (!safePath) continue;

    const parts = safePath.split('/');
    if (!rootFolderName && parts.length > 1) {
      rootFolderName = parts[0];
    }

    // Strip top-level folder name so paths are relative to project root
    const projectRelativePath = parts.length > 1 ? parts.slice(1).join('/') : parts[0];

    // Check if ignored
    if (isIgnoredPath(projectRelativePath, ignoredPatterns)) {
      continue;
    }

    const fileName = parts[parts.length - 1];
    if (isSensitiveFile(fileName) && !allowSecrets) {
      sensitiveFilesExcluded.push(projectRelativePath);
      continue;
    }

    const ext = fileName.split('.').pop()?.toLowerCase();
    if (BINARY_EXTENSIONS.has(ext)) {
      // Skip large binary files
      continue;
    }

    // Read content
    const text = await file.text();
    totalBytes += text.length;

    validFiles.push({
      path: projectRelativePath,
      name: fileName,
      size: text.length,
      content: text
    });

    if (options.onProgress) {
      options.onProgress((i + 1) / fileList.length * 100);
    }
  }

  return {
    projectName: rootFolderName || 'Uploaded Project',
    files: validFiles,
    totalFiles: validFiles.length,
    totalBytes,
    sensitiveFilesExcluded
  };
}

/**
 * Parses files from a ZIP archive.
 */
export async function processZipUpload(zipFile, options = {}) {
  const ignoredPatterns = options.ignoredPatterns || DEFAULT_IGNORED_DIRS;
  const allowSecrets = options.allowSecrets ?? false;

  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipFile);

  const entries = Object.keys(loadedZip.files);
  const validFiles = [];
  const sensitiveFilesExcluded = [];
  let totalBytes = 0;

  // Determine if zip has a single root wrapper directory
  const rootDirs = new Set();
  entries.forEach(name => {
    const parts = name.split('/').filter(Boolean);
    if (parts.length > 1) rootDirs.add(parts[0]);
  });
  const hasSingleRoot = rootDirs.size === 1 && entries.every(e => e.startsWith(Array.from(rootDirs)[0] + '/'));
  const stripPrefix = hasSingleRoot ? Array.from(rootDirs)[0] + '/' : '';

  let processedCount = 0;
  for (const entryPath of entries) {
    processedCount++;
    const entry = loadedZip.files[entryPath];

    if (entry.dir) continue;

    const safePath = sanitizePath(entryPath);
    if (!safePath) continue;

    const projectRelativePath = stripPrefix && safePath.startsWith(stripPrefix)
      ? safePath.slice(stripPrefix.length)
      : safePath;

    if (!projectRelativePath) continue;

    // Check if ignored
    if (isIgnoredPath(projectRelativePath, ignoredPatterns)) {
      continue;
    }

    const fileName = projectRelativePath.split('/').pop();
    if (isSensitiveFile(fileName) && !allowSecrets) {
      sensitiveFilesExcluded.push(projectRelativePath);
      continue;
    }

    const ext = fileName.split('.').pop()?.toLowerCase();
    if (BINARY_EXTENSIONS.has(ext)) {
      continue;
    }

    const content = await entry.async('string');
    totalBytes += content.length;

    validFiles.push({
      path: projectRelativePath,
      name: fileName,
      size: content.length,
      content
    });

    if (options.onProgress) {
      options.onProgress((processedCount / entries.length) * 100);
    }
  }

  const baseName = zipFile.name.replace(/\.zip$/i, '');
  return {
    projectName: baseName || 'Uploaded Project',
    files: validFiles,
    totalFiles: validFiles.length,
    totalBytes,
    sensitiveFilesExcluded
  };
}
