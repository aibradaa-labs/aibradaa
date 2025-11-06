#!/usr/bin/env node

/**
 * Test Runner Script
 * Runs all tests with proper configuration
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const args = process.argv.slice(2);

// Test configuration
const testConfig = {
  env: {
    ...process.env,
    NODE_ENV: 'test',
    NODE_OPTIONS: '--experimental-test-coverage'
  }
};

// Run node test runner
const testProcess = spawn('node', [
  '--test',
  '--test-reporter=spec',
  ...args,
  'tests/**/*.test.mjs'
], {
  cwd: ROOT_DIR,
  stdio: 'inherit',
  ...testConfig
});

testProcess.on('exit', (code) => {
  process.exit(code);
});
