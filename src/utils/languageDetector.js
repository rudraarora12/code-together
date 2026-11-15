/**
 * Language detection and file validation utility
 */

export const EXTENSION_MAP = {
  // Python
  py: { language: 'python', name: 'Python', color: '#387eb8' },
  pyw: { language: 'python', name: 'Python', color: '#387eb8' },
  
  // JavaScript & TypeScript
  js: { language: 'javascript', name: 'JavaScript', color: '#f7df1e' },
  mjs: { language: 'javascript', name: 'JavaScript (ESM)', color: '#f7df1e' },
  cjs: { language: 'javascript', name: 'JavaScript (CommonJS)', color: '#f7df1e' },
  jsx: { language: 'javascript', name: 'React JSX', color: '#61dafb' },
  ts: { language: 'typescript', name: 'TypeScript', color: '#3178c6' },
  tsx: { language: 'typescript', name: 'React TSX', color: '#3178c6' },

  // C / C++ / C#
  cpp: { language: 'cpp', name: 'C++', color: '#659ad2' },
  cc: { language: 'cpp', name: 'C++', color: '#659ad2' },
  cxx: { language: 'cpp', name: 'C++', color: '#659ad2' },
  c: { language: 'c', name: 'C', color: '#555555' },
  h: { language: 'cpp', name: 'C/C++ Header', color: '#659ad2' },
  hpp: { language: 'cpp', name: 'C++ Header', color: '#659ad2' },
  cs: { language: 'csharp', name: 'C#', color: '#178600' },

  // Systems / Backend
  java: { language: 'java', name: 'Java', color: '#ea2d2e' },
  go: { language: 'go', name: 'Go', color: '#00add8' },
  rs: { language: 'rust', name: 'Rust', color: '#dea584' },
  php: { language: 'php', name: 'PHP', color: '#4f5d95' },
  rb: { language: 'ruby', name: 'Ruby', color: '#701516' },
  kt: { language: 'kotlin', name: 'Kotlin', color: '#a97bff' },
  swift: { language: 'swift', name: 'Swift', color: '#ffac45' },

  // Web & Styles
  html: { language: 'html', name: 'HTML', color: '#e34c26' },
  htm: { language: 'html', name: 'HTML', color: '#e34c26' },
  css: { language: 'css', name: 'CSS', color: '#563d7c' },
  scss: { language: 'scss', name: 'SCSS', color: '#c6538c' },
  sass: { language: 'scss', name: 'Sass', color: '#c6538c' },
  less: { language: 'less', name: 'Less', color: '#1d365d' },

  // Config & Data
  json: { language: 'json', name: 'JSON', color: '#cbcb41' },
  xml: { language: 'xml', name: 'XML', color: '#0060ac' },
  svg: { language: 'xml', name: 'SVG (XML)', color: '#ff9900' },
  yaml: { language: 'yaml', name: 'YAML', color: '#cb171e' },
  yml: { language: 'yaml', name: 'YAML', color: '#cb171e' },
  sql: { language: 'sql', name: 'SQL', color: '#e38c00' },
  sh: { language: 'shell', name: 'Shell Script', color: '#89e051' },
  bash: { language: 'shell', name: 'Bash Script', color: '#89e051' },
  zsh: { language: 'shell', name: 'Zsh Script', color: '#89e051' },

  // Documentation & Text
  md: { language: 'markdown', name: 'Markdown', color: '#083fa1' },
  markdown: { language: 'markdown', name: 'Markdown', color: '#083fa1' },
  txt: { language: 'plaintext', name: 'Plain Text', color: '#888888' },
  env: { language: 'shell', name: 'Environment Config', color: '#68778d' }
};

export const BINARY_EXTENSIONS = new Set([
  'exe', 'dll', 'so', 'dylib', 'bin', 'iso',
  'zip', 'tar', 'gz', '7z', 'rar', 'bz2',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'ico', 'tiff', 'psd',
  'mp3', 'mp4', 'mov', 'avi', 'mkv', 'wav', 'flac', 'ogg',
  'wasm', 'class', 'o', 'obj', 'pyc', 'pyo', 'pyd',
  'db', 'sqlite', 'sqlite3'
]);

export function detectLanguageFromFilename(fileName) {
  if (!fileName || typeof fileName !== 'string') {
    return { language: 'plaintext', name: 'Plain Text', color: '#888888', extension: 'txt' };
  }

  const parts = fileName.split('.');
  if (parts.length <= 1) {
    return { language: 'plaintext', name: 'Plain Text', color: '#888888', extension: '' };
  }

  const ext = parts.pop().toLowerCase();

  if (EXTENSION_MAP[ext]) {
    return {
      ...EXTENSION_MAP[ext],
      extension: ext
    };
  }

  return {
    language: 'plaintext',
    name: ext.toUpperCase() || 'Text',
    color: '#888888',
    extension: ext
  };
}

export function isBinaryFile(file) {
  if (!file) return false;

  const fileName = file.name || '';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (BINARY_EXTENSIONS.has(ext)) {
    return true;
  }

  if (file.type && (
    file.type.startsWith('image/') ||
    file.type.startsWith('audio/') ||
    file.type.startsWith('video/') ||
    file.type.startsWith('application/zip') ||
    file.type.startsWith('application/x-zip') ||
    file.type.startsWith('application/pdf') ||
    file.type.startsWith('application/x-executable')
  )) {
    return true;
  }

  return false;
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
