// Генератор иконок для PWA
const fs = require('fs');
const path = require('path');

// Создаем простую SVG иконку
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Фон -->
  <rect width="512" height="512" rx="120" fill="url(#grad1)"/>
  
  <!-- Космические элементы -->
  <circle cx="150" cy="150" r="8" fill="white" opacity="0.8"/>
  <circle cx="362" cy="180" r="6" fill="white" opacity="0.6"/>
  <circle cx="280" cy="320" r="10" fill="white" opacity="0.7"/>
  <circle cx="200" cy="380" r="5" fill="white" opacity="0.5"/>
  <circle cx="400" cy="350" r="7" fill="white" opacity="0.6"/>
  
  <!-- Главный элемент - книга/дневник -->
  <rect x="180" y="140" width="152" height="200" rx="8" fill="white" opacity="0.9"/>
  <rect x="190" y="150" width="132" height="180" rx="4" fill="#1a1a2e"/>
  
  <!-- Строки в дневнике -->
  <rect x="200" y="165" width="80" height="3" fill="white" opacity="0.7"/>
  <rect x="200" y="175" width="100" height="3" fill="white" opacity="0.7"/>
  <rect x="200" y="185" width="70" height="3" fill="white" opacity="0.7"/>
  <rect x="200" y="195" width="90" height="3" fill="white" opacity="0.7"/>
  
  <!-- Ручка -->
  <rect x="330" y="160" width="4" height="40" rx="2" fill="#667eea"/>
  <circle cx="332" cy="155" r="6" fill="#764ba2"/>
  
  <!-- Текст "MY SPACE" -->
  <text x="256" y="290" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="white">MY</text>
  <text x="256" y="315" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="white">SPACE</text>
</svg>
`;

// Сохраняем SVG
fs.writeFileSync(path.join(__dirname, 'icon.svg'), svgIcon);
console.log('✅ SVG иконка создана');

// Инструкция по конвертации в PNG
console.log(`
📋 Для конвертации SVG в PNG иконки:

1. **Онлайн сервисы:**
   - https://convertio.co/svg-png/
   - https://cloudconvert.com/svg-to-png
   - https://www.aconvert.com/icon/svg-to-png/

2. **Командная строка (если установлен ImageMagick):**
   \`\`\`bash
   convert icon.svg -resize 72x72 icon-72x72.png
   convert icon.svg -resize 96x96 icon-96x96.png
   convert icon.svg -resize 128x128 icon-128x128.png
   convert icon.svg -resize 144x144 icon-144x144.png
   convert icon.svg -resize 152x152 icon-152x152.png
   convert icon.svg -resize 192x192 icon-192x192.png
   convert icon.svg -resize 384x384 icon-384x384.png
   convert icon.svg -resize 512x512 icon-512x512.png
   \`\`\`

3. **Node.js (npm install sharp):**
   \`\`\`bash
   npm install sharp
   node convert-icons.js
   \`\`\`

📁 Нужные размеры:
- 72x72, 96x96, 128x128, 144x144, 152x152
- 192x192, 384x384, 512x512

🎯 После конвертации положите все PNG файлы в папку /public/icons/
`);
