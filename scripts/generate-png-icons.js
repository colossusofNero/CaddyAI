/**
 * Generate placeholder PWA icons as actual PNG files
 * Uses canvas to create simple branded icons
 */

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Try to use canvas if available, otherwise create minimal PNGs
let Canvas;
try {
  Canvas = require('canvas');
  console.log('✓ Using node-canvas for icon generation');
} catch (e) {
  console.log('⚠ node-canvas not available, creating minimal PNG files');
}

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

if (Canvas) {
  // Generate high-quality icons with canvas
  sizes.forEach(size => {
    const canvas = Canvas.createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background - CaddyAI brand green
    ctx.fillStyle = '#1B5E20';
    ctx.fillRect(0, 0, size, size);

    // Golf flag icon
    const flagX = size * 0.35;
    const flagY = size * 0.25;

    // Flag pole
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(flagX + size * 0.02, flagY, size * 0.04, size * 0.5);

    // Flag
    ctx.fillStyle = '#FFC107';
    ctx.beginPath();
    ctx.moveTo(flagX + size * 0.06, flagY + size * 0.05);
    ctx.lineTo(flagX + size * 0.28, flagY + size * 0.15);
    ctx.lineTo(flagX + size * 0.06, flagY + size * 0.25);
    ctx.closePath();
    ctx.fill();

    // Text "CA" for CaddyAI
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${size * 0.2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CA', size * 0.5, size * 0.75);

    // Save PNG
    const filename = `icon-${size}x${size}.png`;
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(iconsDir, filename), buffer);
    console.log(`✓ Generated ${filename}`);
  });

  console.log('\n✅ High-quality PNG icons created successfully!');
} else {
  // Create minimal valid PNG files (1x1 green pixel, then we'll scale the reference)
  const minimalPNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth: 8, Color type: 2 (RGB), Compression: 0, Filter: 0, Interlace: 0
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x63, 0x60, 0xA8, 0x60, 0x60, 0x00, 0x00, 0x00, 0x04, 0x00, 0x01, // Compressed image data (green pixel)
    0x27, 0x80, 0x9C, 0xB5, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);

  sizes.forEach(size => {
    const filename = `icon-${size}x${size}.png`;
    fs.writeFileSync(path.join(iconsDir, filename), minimalPNG);
    console.log(`✓ Created ${filename} (minimal placeholder)`);
  });

  console.log('\n✅ Minimal PNG placeholders created!');
  console.log('⚠ For better quality icons, install canvas: npm install canvas');
  console.log('  Then run this script again.');
}
