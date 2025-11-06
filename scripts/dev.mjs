#!/usr/bin/env node

/**
 * Development Server Script
 * Starts the dev server with hot reload
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

console.log('🚀 Starting AI Bradaa development server...\n');

// Start API server
const apiServer = spawn('node', ['--watch', 'api/server.mjs'], {
  cwd: ROOT_DIR,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: process.env.PORT || 3000
  }
});

apiServer.on('exit', (code) => {
  console.log(`\nServer exited with code ${code}`);
  process.exit(code);
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down development server...');
  apiServer.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  apiServer.kill('SIGTERM');
  process.exit(0);
});
