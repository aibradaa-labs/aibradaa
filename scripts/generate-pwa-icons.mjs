/**
 * Generate PWA Icons from Source
 * Generates all required PWA icon sizes from the original high-res PNG
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SOURCE_FILE = join(__dirname, '..', 'aibradaa_pwa_icons', 'AI Bradaa pwa (original).png');
const OUTPUT_DIR = join(__dirname, '..', 'public', 'icons');

// All required icon sizes for PWA
const SIZES = [
  { size: 72, name: 'icon-72.png' },
  { size: 96, name: 'icon-96.png' },
  { size: 128, name: 'icon-128.png' },
  { size: 144, name: 'icon-144.png' },
  { size: 152, name: 'icon-152.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 384, name: 'icon-384.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' }, // iOS
];

async function generateIcons() {
  console.log('🎨 AI Bradaa PWA Icon Generator');
  console.log('━'.repeat(50));

  try {
    // Verify source file exists
    await fs.access(SOURCE_FILE);
    console.log('✅ Source file found:', SOURCE_FILE);

    // Get source image info
    const sourceImage = sharp(SOURCE_FILE);
    const metadata = await sourceImage.metadata();
    console.log(`📐 Source dimensions: ${metadata.width}x${metadata.height}`);
    console.log(`📦 Source format: ${metadata.format}`);
    console.log('');

    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Generate all icon sizes
    console.log('⚙️  Generating icons...');
    console.log('');

    for (const { size, name } of SIZES) {
      const outputPath = join(OUTPUT_DIR, name);

      await sharp(SOURCE_FILE)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ quality: 90, compressionLevel: 9 })
        .toFile(outputPath);

      const stats = await fs.stat(outputPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`✅ ${name.padEnd(25)} ${size}x${size}  (${sizeKB} KB)`);
    }

    console.log('');
    console.log('━'.repeat(50));
    console.log(`🎉 Successfully generated ${SIZES.length} PWA icons!`);
    console.log('');
    console.log('📁 Output directory:', OUTPUT_DIR);
    console.log('');
    console.log('Next steps:');
    console.log('1. Create favicon.svg');
    console.log('2. Update manifest.json');
    console.log('3. Test PWA installation');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

// Run generator
generateIcons();
