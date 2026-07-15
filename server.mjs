import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PARENT = path.resolve(__dirname, '..');
const PORT = 9997;

const MIME = {
  '.html':'text/html; charset=utf-8',
  '.css':'text/css',
  '.js':'text/javascript',
  '.mjs':'text/javascript',
  '.json':'application/json',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.svg':'image/svg+xml',
  '.ico':'image/x-icon',
  '.md':'text/markdown',
  '.csv':'text/csv',
};

// Direct mapping: URL prefix → local directory
const SYS_DIRS = {
  'adventure-system': 'adventure-system',
  'health-system': 'health-system',
  'task-system': 'task-system',
  'koc-exchange': 'koc-exchange',
  'interview-armory': 'interview-armory',
  'bali-trip': 'bali-trip',
  'outputs': 'outputs',
};

function tryFile(resolvedPath) {
  try {
    const stat = fs.statSync(resolvedPath);
    if (stat.isDirectory()) {
      const idx = path.join(resolvedPath, 'index.html');
      if (fs.existsSync(idx)) return idx;
      return null;
    }
    return resolvedPath;
  } catch(e) {
    return null;
  }
}

const server = http.createServer((req, res) => {
  try {
    // Decode URL
    const rawPath = decodeURIComponent(req.url.split('?')[0]);
    
    let filePath = null;
    
    if (rawPath === '/' || rawPath === '') {
      filePath = path.join(__dirname, 'index.html');
    } else {
      // Remove leading /
      const parts = rawPath.slice(1).split('/').filter(Boolean);
      const first = parts[0];
      
      if (SYS_DIRS[first]) {
        const baseDir = path.join(PARENT, SYS_DIRS[first]);
        const relPath = parts.slice(1).join('/') || 'index.html';
        filePath = tryFile(path.join(baseDir, relPath));
      } else {
        // Fallback: try main-hub directory
        filePath = tryFile(path.join(__dirname, rawPath));
        if (!filePath) filePath = tryFile(path.join(PARENT, 'outputs', rawPath));
      }
    }
    
    if (filePath) {
      const c = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(c);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404: ' + rawPath);
    }
  } catch(e) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 莎莎主站 http://localhost:${PORT}`);
});

process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});
