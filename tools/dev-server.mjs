#!/usr/bin/env node

/**
 * AI Bradaa - Development Server
 *
 * Serves static files with live reload capabilities
 */

import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { watch } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const app = express();
const PORT = process.env.DEV_PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.static(join(ROOT, 'public')));

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Live reload script injection
const liveReloadScript = `
<script>
  // Simple live reload
  let lastCheck = Date.now();
  setInterval(async () => {
    try {
      const response = await fetch('/dev/check');
      const data = await response.json();
      if (data.lastModified > lastCheck) {
        console.log('[Dev] Changes detected, reloading...');
        location.reload();
      }
      lastCheck = Date.now();
    } catch (e) {
      console.error('[Dev] Live reload error:', e);
    }
  }, 1000);
</script>
`;

// Track last modification time
let lastModified = Date.now();

// File watcher
const watchDirs = ['public', 'app', 'api'];
watchDirs.forEach(dir => {
  const fullPath = join(ROOT, dir);
  watch(fullPath, { recursive: true }, (eventType, filename) => {
    if (filename && !filename.includes('node_modules')) {
      console.log(`[Dev] File changed: ${dir}/${filename}`);
      lastModified = Date.now();
    }
  });
});

// Dev endpoint for live reload
app.get('/dev/check', (req, res) => {
  res.json({ lastModified });
});

// Serve HTML with live reload script
app.get('*.html', async (req, res, next) => {
  try {
    const filePath = join(ROOT, 'public', req.path);
    let html = await fs.readFile(filePath, 'utf-8');

    // Inject live reload script before </body>
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${liveReloadScript}</body>`);
    }

    res.type('html').send(html);
  } catch (error) {
    next();
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(ROOT, 'public', 'app.html'));
});

// Start server
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                   🚀 AI Bradaa Dev Server                 ║
╚═══════════════════════════════════════════════════════════╝

  Local:    http://localhost:${PORT}
  Network:  http://${getLocalIP()}:${PORT}

  📁 Serving: ${ROOT}/public
  🔄 Live reload: enabled
  🎯 Watching: ${watchDirs.join(', ')}

  Press Ctrl+C to stop
`);
});

// Get local IP
async function getLocalIP() {
  const { networkInterfaces } = await import('os');
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[Dev] Shutting down gracefully...');
  server.close(() => {
    console.log('[Dev] Server closed');
    process.exit(0);
  });
});
