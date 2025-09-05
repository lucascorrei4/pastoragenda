const fs = require('fs');
const path = require('path');

console.log('PWA Icon Analysis');
console.log('================');
console.log('');

const publicDir = path.join(__dirname, '../public');
const iconFiles = [
  'logo.png',
  'pwa-192x192.png', 
  'pwa-512x512.png',
  'apple-touch-icon.png',
  'apple-touch-icon-152x152.png',
  'apple-touch-icon-167x167.png',
  'apple-touch-icon-180x180.png'
];

console.log('Icon File Analysis:');
console.log('');

iconFiles.forEach(filename => {
  const filePath = path.join(publicDir, filename);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`✅ ${filename.padEnd(30)} ${sizeKB.toString().padStart(4)} KB`);
    
    // Check if file is suspiciously small (might be white square)
    if (filename.includes('pwa-') && stats.size < 20000) {
      console.log(`   ⚠️  WARNING: File is very small, likely a plain white square`);
    }
  } else {
    console.log(`❌ ${filename.padEnd(30)} MISSING`);
  }
});

console.log('');
console.log('Recommendations:');
console.log('1. The pwa-*.png files are likely plain white squares');
console.log('2. Use logo.png as source to create proper PWA icons');
console.log('3. Use an online tool like realfavicongenerator.net');
console.log('4. Or manually resize logo.png to 192x192 and 512x512 pixels');
console.log('');
console.log('Expected file sizes for proper icons:');
console.log('- pwa-192x192.png: 20-50 KB');
console.log('- pwa-512x512.png: 50-150 KB');
console.log('- apple-touch-icon.png: 20-50 KB');
