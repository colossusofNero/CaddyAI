/**
 * Generate placeholder PWA icons for CaddyAI
 * Creates simple colored PNG icons with the app name
 */

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('✓ Created icons directory');
}

// Generate SVG for each size and save as file
sizes.forEach(size => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#1B5E20"/>

  <!-- Golf flag icon -->
  <g transform="translate(${size * 0.35}, ${size * 0.25})">
    <!-- Flag pole -->
    <rect x="${size * 0.02}" y="0" width="${size * 0.04}" height="${size * 0.5}" fill="#FFFFFF"/>

    <!-- Flag -->
    <path d="M ${size * 0.06} ${size * 0.05} L ${size * 0.28} ${size * 0.15} L ${size * 0.06} ${size * 0.25} Z" fill="#FFC107"/>
  </g>

  <!-- Text "CA" for CaddyAI -->
  <text x="50%" y="75%" font-family="Arial, sans-serif" font-size="${size * 0.2}" font-weight="bold" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">CA</text>
</svg>`;

  const filename = `icon-${size}x${size}.png`;
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);

  // Save SVG file (browsers will use these if PNG conversion isn't available)
  fs.writeFileSync(svgPath, svg);
  console.log(`✓ Generated ${filename.replace('.png', '.svg')}`);
});

console.log('\n✅ Icon generation complete!');
console.log('Note: SVG icons created. For production, consider converting to PNG using a tool like sharp or imagemagick.');
console.log('\nTo convert SVGs to PNGs, you can:');
console.log('1. Use an online tool like https://cloudconvert.com/svg-to-png');
console.log('2. Install sharp: npm install sharp');
console.log('3. Or use the SVGs directly by updating manifest.json to reference .svg files');
