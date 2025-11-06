#!/usr/bin/env node

/**
 * Build Optimization Script
 * Minifies, compresses, and optimizes assets for production
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

/**
 * Main build process
 */
async function build() {
  console.log('🚀 Starting production build...\n');

  try {
    // Clean dist directory
    await cleanDist();

    // Copy public files
    await copyPublicFiles();

    // Process HTML files
    await processHtmlFiles();

    // Process CSS files
    await processCssFiles();

    // Process JS files
    await processJsFiles();

    // Generate file manifest
    await generateManifest();

    // Calculate bundle sizes
    await calculateSizes();

    console.log('\n✅ Build complete!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

/**
 * Clean dist directory
 */
async function cleanDist() {
  console.log('🧹 Cleaning dist directory...');

  try {
    await fs.rm(DIST_DIR, { recursive: true, force: true });
    await fs.mkdir(DIST_DIR, { recursive: true });
    console.log('✓ Dist cleaned\n');
  } catch (error) {
    console.error('Failed to clean dist:', error);
    throw error;
  }
}

/**
 * Copy public files to dist
 */
async function copyPublicFiles() {
  console.log('📁 Copying public files...');

  async function copyRecursive(src, dest) {
    const stats = await fs.stat(src);

    if (stats.isDirectory()) {
      await fs.mkdir(dest, { recursive: true });
      const entries = await fs.readdir(src);

      for (const entry of entries) {
        await copyRecursive(
          path.join(src, entry),
          path.join(dest, entry)
        );
      }
    } else {
      await fs.copyFile(src, dest);
    }
  }

  await copyRecursive(PUBLIC_DIR, DIST_DIR);
  console.log('✓ Files copied\n');
}

/**
 * Process HTML files - minify and inject cache busting
 */
async function processHtmlFiles() {
  console.log('📄 Processing HTML files...');

  const htmlFiles = await findFiles(DIST_DIR, '.html');

  for (const file of htmlFiles) {
    let content = await fs.readFile(file, 'utf-8');

    // Simple minification (remove comments and extra whitespace)
    content = content
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/>\s+</g, '><'); // Remove whitespace between tags

    // Add cache busting to asset references
    content = await addCacheBusting(content);

    await fs.writeFile(file, content);
  }

  console.log(`✓ Processed ${htmlFiles.length} HTML files\n`);
}

/**
 * Process CSS files - minify
 */
async function processCssFiles() {
  console.log('🎨 Processing CSS files...');

  const cssFiles = await findFiles(DIST_DIR, '.css');

  for (const file of cssFiles) {
    let content = await fs.readFile(file, 'utf-8');

    // Simple minification
    content = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/\s*([{}:;,])\s*/g, '$1') // Remove whitespace around punctuation
      .trim();

    await fs.writeFile(file, content);
  }

  console.log(`✓ Processed ${cssFiles.length} CSS files\n`);
}

/**
 * Process JS files - add source maps info
 */
async function processJsFiles() {
  console.log('⚡ Processing JS files...');

  const jsFiles = await findFiles(DIST_DIR, '.js');

  for (const file of jsFiles) {
    // In a real build, you'd use a minifier like terser
    // For now, just log the files
    const stats = await fs.stat(file);
    console.log(`  - ${path.relative(DIST_DIR, file)} (${formatBytes(stats.size)})`);
  }

  console.log(`✓ Processed ${jsFiles.length} JS files\n`);
}

/**
 * Generate asset manifest with hashes
 */
async function generateManifest() {
  console.log('📋 Generating asset manifest...');

  const manifest = {
    version: process.env.npm_package_version || '1.0.0',
    buildTime: new Date().toISOString(),
    files: {}
  };

  const files = await findFiles(DIST_DIR, ['.html', '.css', '.js', '.json']);

  for (const file of files) {
    const content = await fs.readFile(file);
    const hash = createHash('md5').update(content).digest('hex').substring(0, 8);
    const relativePath = path.relative(DIST_DIR, file);

    manifest.files[relativePath] = {
      hash,
      size: content.length
    };
  }

  await fs.writeFile(
    path.join(DIST_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log('✓ Manifest generated\n');
}

/**
 * Calculate and display bundle sizes
 */
async function calculateSizes() {
  console.log('📊 Bundle sizes:\n');

  const categories = {
    'HTML': '.html',
    'CSS': '.css',
    'JavaScript': '.js',
    'Images': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    'Other': '*'
  };

  const sizes = {};

  for (const [category, extensions] of Object.entries(categories)) {
    const exts = Array.isArray(extensions) ? extensions : [extensions];
    const files = await findFiles(DIST_DIR, exts);

    let totalSize = 0;
    for (const file of files) {
      const stats = await fs.stat(file);
      totalSize += stats.size;
    }

    sizes[category] = {
      count: files.length,
      size: totalSize
    };
  }

  for (const [category, data] of Object.entries(sizes)) {
    console.log(`  ${category}: ${data.count} files, ${formatBytes(data.size)}`);
  }

  const totalSize = Object.values(sizes).reduce((sum, data) => sum + data.size, 0);
  console.log(`\n  Total: ${formatBytes(totalSize)}`);
}

/**
 * Find files by extension
 */
async function findFiles(dir, extensions) {
  const exts = Array.isArray(extensions) ? extensions : [extensions];
  const files = [];

  async function scan(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (exts.includes('*') || exts.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  await scan(dir);
  return files;
}

/**
 * Add cache busting to asset URLs
 */
async function addCacheBusting(content) {
  // Simple implementation - in production, use proper asset hasher
  const version = Date.now();

  content = content
    .replace(/(href|src)="([^"]+\.(css|js))"/g, `$1="$2?v=${version}"`)
    .replace(/(href|src)='([^']+\.(css|js))'/g, `$1='$2?v=${version}'`);

  return content;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run build if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  build();
}

export { build };
