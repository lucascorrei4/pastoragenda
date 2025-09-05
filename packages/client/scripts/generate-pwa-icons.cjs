const fs = require('fs');
const path = require('path');

console.log('🎨 PastorAgenda PWA Icon Generator');
console.log('==================================');
console.log('');

const publicDir = path.join(__dirname, '../public');
const logoPath = path.join(publicDir, 'logo.png');

// Check if logo exists
if (!fs.existsSync(logoPath)) {
  console.log('❌ Logo file not found:', logoPath);
  console.log('   Please ensure logo.png exists in the public directory');
  process.exit(1);
}

console.log('✅ Logo file found:', logoPath);
const logoStats = fs.statSync(logoPath);
console.log(`   Size: ${Math.round(logoStats.size / 1024)} KB`);
console.log('');

console.log('📋 Required PWA Icons:');
console.log('');

const requiredIcons = [
  { name: 'pwa-192x192.png', size: 192, currentSize: 7655, expectedMin: 20000, expectedMax: 50000 },
  { name: 'pwa-512x512.png', size: 512, currentSize: 13313, expectedMin: 50000, expectedMax: 150000 },
  { name: 'apple-touch-icon.png', size: 180, currentSize: 7522, expectedMin: 20000, expectedMax: 50000 },
  { name: 'favicon-32x32.png', size: 32, currentSize: 0, expectedMin: 2000, expectedMax: 8000 },
  { name: 'favicon-16x16.png', size: 16, currentSize: 0, expectedMin: 1000, expectedMax: 4000 }
];

requiredIcons.forEach(icon => {
  const status = icon.currentSize === 0 ? '❌ MISSING' : 
                 icon.currentSize < icon.expectedMin ? '⚠️  TOO SMALL' : 
                 icon.currentSize > icon.expectedMax ? '⚠️  TOO LARGE' : '✅ OK';
  
  console.log(`${status} ${icon.name.padEnd(25)} ${icon.currentSize.toString().padStart(8)} bytes (${icon.size}x${icon.size}px)`);
  if (icon.currentSize > 0 && icon.currentSize < icon.expectedMin) {
    console.log(`   Expected: ${icon.expectedMin}-${icon.expectedMax} bytes (likely plain white square)`);
  }
});

console.log('');
console.log('🔧 Solution:');
console.log('1. Open scripts/create-pwa-icons.html in your browser');
console.log('2. Upload your logo.png file');
console.log('3. Click "Generate PWA Icons"');
console.log('4. Download all generated icons');
console.log('5. Replace the existing files in public/ folder');
console.log('');
console.log('Or use an online tool:');
console.log('- https://realfavicongenerator.net/');
console.log('- https://www.favicon-generator.org/');
console.log('- https://favicon.io/');
console.log('');
console.log('Expected results:');
console.log('- pwa-192x192.png: 20-50 KB with PastorAgenda logo');
console.log('- pwa-512x512.png: 50-150 KB with PastorAgenda logo');
console.log('- apple-touch-icon.png: 20-50 KB with PastorAgenda logo');
console.log('- favicon-32x32.png: 2-8 KB with PastorAgenda logo');
console.log('- favicon-16x16.png: 1-4 KB with PastorAgenda logo');
