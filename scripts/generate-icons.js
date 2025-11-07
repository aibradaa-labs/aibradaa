#!/usr/bin/env node

/**
 * PWA Icon Generator
 * Generates all required PWA icon sizes from SVG source
 *
 * Usage: node scripts/generate-icons.js
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SVG_SOURCE = join(__dirname, '../public/assets/icons/icon.svg');
const OUTPUT_DIR = join(__dirname, '../public/icons');

// Required icon sizes for PWA
const ICON_SIZES = [
  { size: 72, name: 'icon-72.png', description: 'Android Chrome' },
  { size: 96, name: 'icon-96.png', description: 'Android Chrome' },
  { size: 128, name: 'icon-128.png', description: 'Android Chrome, Windows' },
  { size: 144, name: 'icon-144.png', description: 'Android Chrome' },
  { size: 152, name: 'icon-152.png', description: 'iOS Safari' },
  { size: 192, name: 'icon-192.png', description: 'Android Chrome (main)' },
  { size: 384, name: 'icon-384.png', description: 'Android Chrome' },
  { size: 512, name: 'icon-512.png', description: 'Android Chrome (splash)' }
];

// Additional icons for complete PWA support
const ADDITIONAL_ICONS = [
  { size: 180, name: 'apple-touch-icon.png', description: 'iOS home screen' }
];

async function generateIcon(svgBuffer, size, outputPath, name) {
  try {
    await sharp(svgBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({
        quality: 100,
        compressionLevel: 9,
        palette: false
      })
      .toFile(outputPath);

    console.log(`✓ Generated ${name} (${size}x${size})`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to generate ${name}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🎨 AI Bradaa PWA Icon Generator\n');
  console.log(`Source: ${SVG_SOURCE}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  try {
    // Read SVG source
    const svgBuffer = readFileSync(SVG_SOURCE);
    console.log('✓ SVG source loaded\n');

    console.log('Generating standard PWA icons...');
    let successCount = 0;
    let failCount = 0;

    // Generate all standard sizes
    for (const { size, name, description } of ICON_SIZES) {
      const outputPath = join(OUTPUT_DIR, name);
      const success = await generateIcon(svgBuffer, size, outputPath, name);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log('\nGenerating additional icons...');

    // Generate additional icons
    for (const { size, name, description } of ADDITIONAL_ICONS) {
      const outputPath = join(OUTPUT_DIR, name);
      const success = await generateIcon(svgBuffer, size, outputPath, name);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`\n✅ Icon generation complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`   Total: ${successCount + failCount}\n`);

    if (failCount === 0) {
      console.log('All icons generated successfully! 🎉\n');
      console.log('Next steps:');
      console.log('  1. Verify icons in /public/icons/');
      console.log('  2. Update manifest.json with icon references');
      console.log('  3. Test PWA installation on mobile devices\n');
    } else {
      console.log('⚠️  Some icons failed to generate. Please check errors above.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
