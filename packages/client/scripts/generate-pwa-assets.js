#!/usr/bin/env node

/**
 * Generate PWA assets from logo.png
 * This script creates all necessary PWA icons and assets
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the scripts directory if it doesn't exist
const scriptsDir = path.join(__dirname);
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

console.log('🎨 Generating PWA assets...');

// Create a simple SVG icon as a fallback
const maskedIconSVG = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" fill="#0ea5e9"/>
  <g transform="translate(128, 128) scale(0.5)">
    <path d="M8 2H16L19 6H5L8 2Z" fill="white"/>
    <path d="M4 8H20V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V8Z" fill="white"/>
    <path d="M10 12H14V16H10V12Z" fill="white"/>
    <path d="M10 18H14V22H10V18Z" fill="white"/>
  </g>
</svg>`;

// Create browserconfig.xml for Windows
const browserConfigXML = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/pwa-192x192.png"/>
      <TileColor>#0ea5e9</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;

// Create a basic manifest.json (Vite PWA will generate the full one)
const basicManifest = {
  name: "PastorAgenda - Schedule with Pastors",
  short_name: "PastorAgenda",
  description: "Schedule appointments with pastors and religious leaders through our easy-to-use booking platform",
  theme_color: "#0ea5e9",
  background_color: "#ffffff",
  display: "standalone",
  orientation: "portrait",
  scope: "/",
  start_url: "/",
  categories: ["productivity", "business", "lifestyle"],
  lang: "en",
  dir: "ltr"
};

// Write the files
const publicDir = path.join(__dirname, '..', 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write masked icon
fs.writeFileSync(path.join(publicDir, 'masked-icon.svg'), maskedIconSVG);
console.log('✅ Created masked-icon.svg');

// Write browserconfig.xml
fs.writeFileSync(path.join(publicDir, 'browserconfig.xml'), browserConfigXML);
console.log('✅ Created browserconfig.xml');

// Write basic manifest (Vite PWA will override this)
fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(basicManifest, null, 2));
console.log('✅ Created basic manifest.json');

console.log('\n📱 PWA assets generated successfully!');
console.log('\nNext steps:');
console.log('1. Create proper PNG icons from your logo.png:');
console.log('   - pwa-192x192.png (192x192)');
console.log('   - pwa-512x512.png (512x512)');
console.log('   - apple-touch-icon.png (180x180)');
console.log('   - apple-touch-icon-152x152.png (152x152)');
console.log('   - apple-touch-icon-167x167.png (167x167)');
console.log('   - apple-touch-icon-180x180.png (180x180)');
console.log('2. Create screenshots:');
console.log('   - screenshot-wide.png (1280x720)');
console.log('   - screenshot-narrow.png (750x1334)');
console.log('\nYou can use online tools like:');
console.log('- https://realfavicongenerator.net/');
console.log('- https://www.pwabuilder.com/imageGenerator');
console.log('- https://favicon.io/');
