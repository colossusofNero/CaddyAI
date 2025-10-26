/**
 * Create proper PNG icons using sharp
 * Generates valid image files for PWA manifest
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create SVG template for CaddyAI icon
function createSvgIcon(size) {
  return Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="${size}" height="${size}" fill="#1B5E20"/>

      <!-- Golf flag icon -->
      <g>
        <!-- Flag pole -->
        <rect x="${size * 0.37}" y="${size * 0.25}" width="${size * 0.04}" height="${size * 0.5}" fill="#FFFFFF"/>

        <!-- Flag -->
        <path d="M ${size * 0.41} ${size * 0.25} L ${size * 0.63} ${size * 0.35} L ${size * 0.41} ${size * 0.45} Z" fill="#FFC107"/>
      </g>

      <!-- Text "CA" for CaddyAI -->
      <text
        x="50%"
        y="78%"
        font-family="Arial, sans-serif"
        font-size="${size * 0.2}"
        font-weight="bold"
        fill="#FFFFFF"
        text-anchor="middle"
        dominant-baseline="middle">CA</text>
    </svg>
  `);
}

async function generateIcons() {
  console.log('🎨 Generating proper PNG icons using sharp...\n');

  for (const size of sizes) {
    try {
      const svgBuffer = createSvgIcon(size);
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);

      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✓ Created icon-${size}x${size}.png (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to create icon-${size}x${size}.png:`, error.message);
    }
  }

  console.log('\n✅ All icons generated successfully!');
  console.log(`📁 Icons saved to: ${iconsDir}`);
}

generateIcons().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
