#!/usr/bin/env node

/**
 * AI Bradaa - Production Build Script
 *
 * Builds optimized production assets
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

console.log(`
╔═══════════════════════════════════════════════════════════╗
║              🏗️  AI Bradaa Production Build               ║
╚═══════════════════════════════════════════════════════════╝
`);

async function build() {
  try {
    // 1. Clean dist directory
    console.log('📦 Cleaning dist directory...');
    if (existsSync(DIST)) {
      await fs.rm(DIST, { recursive: true, force: true });
    }
    await fs.mkdir(DIST, { recursive: true });

    // 2. Copy public directory
    console.log('📁 Copying public files...');
    await copyDir(join(ROOT, 'public'), join(DIST, 'public'));

    // 3. Copy app directory
    console.log('📱 Copying app files...');
    await copyDir(join(ROOT, 'app'), join(DIST, 'app'));

    // 4. Copy API directory
    console.log('🔌 Copying API files...');
    await copyDir(join(ROOT, 'api'), join(DIST, 'api'));

    // 5. Copy AI POD
    console.log('🤖 Copying AI POD files...');
    await copyDir(join(ROOT, 'ai_pod'), join(DIST, 'ai_pod'));

    // 6. Copy data
    console.log('💾 Copying data files...');
    await copyDir(join(ROOT, 'data'), join(DIST, 'data'));

    // 7. Copy configs
    console.log('⚙️  Copying config files...');
    await copyDir(join(ROOT, 'configs'), join(DIST, 'configs'));

    // 8. Copy package files
    console.log('📦 Copying package files...');
    await fs.copyFile(
      join(ROOT, 'package.json'),
      join(DIST, 'package.json')
    );

    // 9. Create production .env template
    console.log('🔐 Creating .env template...');
    const envExample = await fs.readFile(
      join(ROOT, 'configs', 'env.example'),
      'utf-8'
    );
    await fs.writeFile(join(DIST, '.env.example'), envExample);

    // 10. Minify CSS (basic - remove comments and extra whitespace)
    console.log('🎨 Optimizing CSS...');
    await optimizeCSS(join(DIST, 'public', 'styles'));

    // 11. Create build info
    console.log('📝 Creating build info...');
    const buildInfo = {
      version: '1.0.0',
      buildDate: new Date().toISOString(),
      nodeVersion: process.version,
      environment: 'production'
    };
    await fs.writeFile(
      join(DIST, 'build-info.json'),
      JSON.stringify(buildInfo, null, 2)
    );

    // 12. Generate file manifest
    console.log('📋 Generating file manifest...');
    const manifest = await generateManifest(DIST);
    await fs.writeFile(
      join(DIST, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                ✅ Build Complete!                         ║
╚═══════════════════════════════════════════════════════════╝

  📂 Output: ${DIST}
  📦 Files: ${manifest.fileCount}
  💾 Size: ${formatBytes(manifest.totalSize)}
  ⏱️  Time: ${Date.now() - startTime}ms

  Next steps:
  1. cd dist
  2. npm install --production
  3. Set environment variables
  4. npm start

`);
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Helper: Copy directory recursively
async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

// Helper: Optimize CSS files
async function optimizeCSS(dir) {
  if (!existsSync(dir)) return;

  const files = await fs.readdir(dir);
  for (const file of files) {
    if (file.endsWith('.css')) {
      const filePath = join(dir, file);
      let css = await fs.readFile(filePath, 'utf-8');

      // Remove comments
      css = css.replace(/\/\*[\s\S]*?\*\//g, '');

      // Remove extra whitespace
      css = css.replace(/\s+/g, ' ');
      css = css.replace(/\s*{\s*/g, '{');
      css = css.replace(/\s*}\s*/g, '}');
      css = css.replace(/\s*:\s*/g, ':');
      css = css.replace(/\s*;\s*/g, ';');

      await fs.writeFile(filePath, css.trim());
    }
  }
}

// Helper: Generate file manifest
async function generateManifest(dir, baseDir = dir) {
  let fileCount = 0;
  let totalSize = 0;
  const files = [];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        const relativePath = fullPath.replace(baseDir + '/', '');

        files.push({
          path: relativePath,
          size: stats.size
        });

        fileCount++;
        totalSize += stats.size;
      }
    }
  }

  await walk(dir);

  return {
    fileCount,
    totalSize,
    files: files.sort((a, b) => a.path.localeCompare(b.path))
  };
}

// Helper: Format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

const startTime = Date.now();
build();
