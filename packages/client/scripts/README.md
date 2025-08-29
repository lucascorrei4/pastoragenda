# 🎨 PWA Asset Generation

## 📱 **Required PNG Icons**

Your PastorAgenda app needs the following PNG icons for full PWA support:

### **Android Icons**
- `pwa-192x192.png` (192x192) - Home screen icon
- `pwa-512x512.png` (512x512) - App store icon

### **iOS Icons**
- `apple-touch-icon.png` (180x180) - iPhone home screen
- `apple-touch-icon-152x152.png` (152x152) - iPad home screen
- `apple-touch-icon-167x167.png` (167x167) - iPad Pro home screen
- `apple-touch-icon-180x180.png` (180x180) - iPhone home screen

### **Screenshots (Optional)**
- `screenshot-wide.png` (1280x720) - Desktop/tablet view
- `screenshot-narrow.png` (750x1334) - Mobile view

## 🛠️ **How to Generate Icons**

### **Option 1: Online Tools (Recommended)**

1. **RealFaviconGenerator** - https://realfavicongenerator.net/
   - Upload your `logo.png`
   - Select "PWA" option
   - Download the generated package
   - Extract and place icons in `public/` folder

2. **PWA Builder** - https://www.pwabuilder.com/imageGenerator
   - Upload your logo
   - Generate all required sizes
   - Download and place in `public/` folder

3. **Favicon.io** - https://favicon.io/
   - Simple icon generation
   - Multiple formats available

### **Option 2: Command Line (Advanced)**

If you have ImageMagick installed:

```bash
cd packages/client/public

# Generate Android icons
convert logo.png -resize 192x192 pwa-192x192.png
convert logo.png -resize 512x512 pwa-512x512.png

# Generate iOS icons
convert logo.png -resize 180x180 apple-touch-icon.png
convert logo.png -resize 152x152 apple-touch-icon-152x152.png
convert logo.png -resize 167x167 apple-touch-icon-167x167.png
convert logo.png -resize 180x180 apple-touch-icon-180x180.png
```

### **Option 3: Design Software**

- **Figma**: Export at different sizes
- **Photoshop**: Save for web at specific dimensions
- **GIMP**: Scale and export
- **Sketch**: Export at different sizes

## 📁 **File Structure After Generation**

```
packages/client/public/
├── favicon.ico ✅
├── logo.png ✅
├── avatar.png ✅
├── masked-icon.svg ✅
├── browserconfig.xml ✅
├── manifest.json ✅
├── pwa-192x192.png ❌ (need to create)
├── pwa-512x512.png ❌ (need to create)
├── apple-touch-icon.png ❌ (need to create)
├── apple-touch-icon-152x152.png ❌ (need to create)
├── apple-touch-icon-167x167.png ❌ (need to create)
├── apple-touch-icon-180x180.png ❌ (need to create)
├── screenshot-wide.png ❌ (optional)
└── screenshot-narrow.png ❌ (optional)
```

## 🧪 **Testing Your PWA**

### **1. Build and Test**
```bash
npm run build
npm run preview
```

### **2. Lighthouse Audit**
- Open Chrome DevTools
- Go to Lighthouse tab
- Run PWA audit
- Aim for 90+ score

### **3. Device Testing**
- **Android**: Chrome should show "Add to Home Screen"
- **iOS**: Safari should show "Add to Home Screen"
- **Desktop**: Install button should appear

### **4. PWA Builder Validation**
- Visit https://www.pwabuilder.com/
- Enter your app URL
- Check for any validation errors

## 🎯 **Quick Start**

1. **Generate icons** using one of the online tools above
2. **Place all PNG files** in the `public/` folder
3. **Build your app** with `npm run build`
4. **Test on real devices** (iOS/Android)
5. **Validate with Lighthouse**

## 📚 **Resources**

- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [iOS PWA Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Android PWA Guide](https://developers.google.com/web/fundamentals/app-install-banners/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
