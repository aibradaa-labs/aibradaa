# AI Bradaa Icons

This directory contains all icon assets for the AI Bradaa PWA.

## Icon Sizes

PWA icons are required in multiple sizes for different use cases:

### Standard Sizes (PNG)

- `icon-72.png` - 72x72 (Android Chrome)
- `icon-96.png` - 96x96 (Android Chrome)
- `icon-128.png` - 128x128 (Android Chrome, Windows)
- `icon-144.png` - 144x144 (Android Chrome)
- `icon-152.png` - 152x152 (iOS Safari)
- `icon-192.png` - 192x192 (Android Chrome, main icon)
- `icon-384.png` - 384x384 (Android Chrome)
- `icon-512.png` - 512x512 (Android Chrome, splash screen)

### Maskable Icons

- `icon-maskable-192.png` - 192x192 (Adaptive icon)
- `icon-maskable-512.png` - 512x512 (Adaptive icon)

Maskable icons have safe zones to work with different device shapes.

### Apple Touch Icons

- `apple-touch-icon.png` - 180x180 (iOS home screen)

### Favicon

- `favicon.ico` - 16x16, 32x32, 48x48 (Browser tabs)
- `favicon-16x16.png` - 16x16
- `favicon-32x32.png` - 32x32

## Design Guidelines

### Brand Colors

- **Primary**: Indigo (#4F46E5)
- **Secondary**: Purple (#9333EA)
- **Accent**: Pink (#EC4899)

### Icon Design

1. **Simple & Recognizable**
   - Clear at small sizes (16x16)
   - Works in both light and dark mode
   - Distinctive brand identity

2. **Consistent Style**
   - Rounded corners
   - Flat design with subtle gradients
   - Minimal detail

3. **Safe Zones**
   - Keep important elements within 80% of canvas
   - Leave padding for rounded masks

## Current Icon

The current AI Bradaa icon features:
- **Design**: "AI" text with circuit board pattern
- **Colors**: Gradient from indigo to purple
- **Style**: Modern, tech-focused, clean

## Generating Icons

### From SVG Source

Use the source SVG (`icon-source.svg`) to generate all sizes:

```bash
# Using ImageMagick
convert icon-source.svg -resize 72x72 icon-72.png
convert icon-source.svg -resize 96x96 icon-96.png
convert icon-source.svg -resize 128x128 icon-128.png
# ... repeat for all sizes
```

### Using Online Tools

1. **RealFaviconGenerator**: https://realfavicongenerator.net/
   - Upload master icon (512x512+)
   - Generates all required formats
   - Provides manifest.json configuration

2. **PWA Asset Generator**: https://github.com/elegantapp/pwa-asset-generator
   ```bash
   npx pwa-asset-generator icon-source.png ./icons
   ```

## Maskable Icon Guide

Maskable icons need extra padding (safe zone):

```
┌─────────────────────────┐
│         Padding         │  ← Outer 10% (may be cropped)
│  ┌───────────────────┐  │
│  │                   │  │
│  │   Safe Zone 80%   │  │  ← Keep logo here
│  │                   │  │
│  └───────────────────┘  │
│         Padding         │
└─────────────────────────┘
```

## Testing Icons

### PWA Builder
https://www.pwabuilder.com/

Upload manifest.json to validate icon sizes and formats.

### Chrome DevTools

1. Open DevTools → Application → Manifest
2. Check all icon sizes are listed
3. Verify "Purpose" field (any, maskable)

### iOS Safari

1. Add to Home Screen
2. Check icon appearance
3. Verify no white borders

## File Checklist

- [ ] icon-72.png
- [ ] icon-96.png
- [ ] icon-128.png
- [ ] icon-144.png
- [ ] icon-152.png
- [ ] icon-192.png
- [ ] icon-384.png
- [ ] icon-512.png
- [ ] icon-maskable-192.png
- [ ] icon-maskable-512.png
- [ ] apple-touch-icon.png
- [ ] favicon.ico
- [ ] favicon-16x16.png
- [ ] favicon-32x32.png

## Asset Optimization

### PNG Optimization

```bash
# Using pngquant
pngquant --quality=80-95 icon-*.png
```

### Size Recommendations

- Each PNG should be < 50KB
- Use PNG-8 if possible
- Optimize with tools like TinyPNG

## License

All AI Bradaa icons are proprietary and © 2025 AI Bradaa Labs.
