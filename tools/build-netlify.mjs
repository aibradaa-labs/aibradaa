#!/usr/bin/env node

/**
 * AI Bradaa - Netlify Production Build Script
 *
 * Optimized for Netlify serverless deployment
 * Functions are auto-deployed from netlify/functions/ directory
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

console.log(`
╔═══════════════════════════════════════════════════════════╗
║         🏗️  AI Bradaa Netlify Production Build           ║
╚═══════════════════════════════════════════════════════════╝
`);

async function build() {
  const startTime = Date.now();

  try {
    // 1. Clean dist directory
    console.log('📦 Cleaning dist directory...');
    if (existsSync(DIST)) {
      await fs.rm(DIST, { recursive: true, force: true });
    }
    await fs.mkdir(DIST, { recursive: true });

    // 2. Copy public directory (static assets)
    console.log('📁 Copying public files...');
    await copyDir(join(ROOT, 'public'), join(DIST, 'public'));

    // 3. Copy app directory (PWA)
    console.log('📱 Copying PWA app files...');
    if (existsSync(join(ROOT, 'app'))) {
      await copyDir(join(ROOT, 'app'), join(DIST, 'app'));
    }

    // 4. Copy AI POD (personas and configurations)
    console.log('🤖 Copying AI POD files...');
    if (existsSync(join(ROOT, 'ai_pod'))) {
      await copyDir(join(ROOT, 'ai_pod'), join(DIST, 'ai_pod'));
    }

    // 5. Copy data (laptop database, etc.)
    console.log('💾 Copying data files...');
    if (existsSync(join(ROOT, 'data'))) {
      await copyDir(join(ROOT, 'data'), join(DIST, 'data'));
    }

    // 6. Copy configs (YAML configurations)
    console.log('⚙️  Copying config files...');
    if (existsSync(join(ROOT, 'configs'))) {
      await copyDir(join(ROOT, 'configs'), join(DIST, 'configs'));
    }

    // 7. Copy shared utilities (if needed by functions)
    console.log('🔧 Copying shared utilities...');
    if (existsSync(join(ROOT, 'shared'))) {
      await copyDir(join(ROOT, 'shared'), join(DIST, 'shared'));
    }

    // 8. Copy package.json for dependency reference
    console.log('📦 Copying package.json...');
    await fs.copyFile(
      join(ROOT, 'package.json'),
      join(DIST, 'package.json')
    );

    // 9. Create .env template
    console.log('🔐 Creating .env template...');
    if (existsSync(join(ROOT, '.env.example'))) {
      await fs.copyFile(
        join(ROOT, '.env.example'),
        join(DIST, '.env.example')
      );
    }

    // 10. Optimize CSS (minify)
    console.log('🎨 Optimizing CSS...');
    await optimizeCSS(join(DIST, 'public', 'styles'));

    // 11. Create build info
    console.log('📝 Creating build info...');
    const buildInfo = {
      version: '2.0.0',
      buildDate: new Date().toISOString(),
      buildTimezone: 'Asia/Kuala_Lumpur',
      nodeVersion: process.version,
      environment: 'production',
      platform: 'netlify',
      architecture: 'serverless-functions',
      commit: process.env.COMMIT_REF || process.env.GIT_COMMIT || 'development',
      branch: process.env.BRANCH || 'main'
    };
    await fs.writeFile(
      join(DIST, 'public', 'build-info.json'),
      JSON.stringify(buildInfo, null, 2)
    );

    // 12. Generate file manifest
    console.log('📋 Generating file manifest...');
    const manifest = await generateManifest(DIST);
    await fs.writeFile(
      join(DIST, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    const buildTime = Date.now() - startTime;

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                ✅ Build Complete!                         ║
╚═══════════════════════════════════════════════════════════╝

  📂 Output: ${DIST}
  📦 Files: ${manifest.fileCount}
  💾 Size: ${formatBytes(manifest.totalSize)}
  ⏱️  Time: ${buildTime}ms

  🌐 Deployment Platform: Netlify
  ⚡ Architecture: Serverless Functions
  📍 Functions Directory: netlify/functions/ (auto-deployed)

  Next steps:
  1. Deploy to Netlify (auto-detects netlify.toml)
  2. Set environment variables in Netlify dashboard
  3. Functions are automatically deployed from netlify/functions/

  ⚠️  Note: api/ directory is deprecated and excluded from build
  ✅ Using Netlify Functions for all backend endpoints
`);
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Helper: Copy directory recursively
async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });

  // Skip if source doesn't exist
  if (!existsSync(src)) {
    console.warn(`⚠️  Source directory not found: ${src}`);
    return;
  }

  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    // Skip node_modules and hidden files
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }

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

build();
