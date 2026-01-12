// Генератор иконок для PWA с использованием Canvas
const fs = require('fs');
const path = require('path');

// Создаем иконку с помощью Canvas API
function createIcon(size) {
    const canvas = require('canvas').createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Градиентный фон
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');

    // Скругленный прямоугольник
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, size * 0.2);
    ctx.fill();

    // Космические элементы (звезды)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(size * 0.3, size * 0.3, size * 0.02, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(size * 0.7, size * 0.35, size * 0.015, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(size * 0.55, size * 0.6, size * 0.025, 0, Math.PI * 2);
    ctx.fill();

    // Книга/дневник
    const bookWidth = size * 0.3;
    const bookHeight = size * 0.4;
    const bookX = (size - bookWidth) / 2;
    const bookY = (size - bookHeight) / 2;

    // Белый фон книги
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.roundRect(bookX, bookY, bookWidth, bookHeight, size * 0.02);
    ctx.fill();

    // Темная внутренняя часть
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.roundRect(bookX + size * 0.02, bookY + size * 0.02, bookWidth - size * 0.04, bookHeight - size * 0.04, size * 0.01);
    ctx.fill();

    // Строки текста
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const lineHeight = size * 0.015;
    const lineY = bookY + size * 0.08;

    for (let i = 0; i < 4; i++) {
        const lineWidth = size * (0.15 + Math.random() * 0.1);
        ctx.fillRect(bookX + size * 0.04, lineY + i * (lineHeight + size * 0.01), lineWidth, lineHeight);
    }

    // Текст "MY SPACE"
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.08}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('MY', size / 2, bookY + bookHeight * 0.7);
    ctx.fillText('SPACE', size / 2, bookY + bookHeight * 0.85);

    return canvas;
}

// Создаем все размеры иконок
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('🎨 Генерация иконок для PWA...');

try {
    const { createCanvas } = require('canvas');

    sizes.forEach(size => {
        const canvas = createIcon(size);
        const buffer = canvas.toBuffer('image/png');
        const filename = `icon-${size}x${size}.png`;

        fs.writeFileSync(path.join(__dirname, 'public/icons', filename), buffer);
        console.log(`✅ Создан: ${filename}`);
    });

    console.log('\n🎉 Все иконки созданы успешно!');
    console.log('📁 Папка: /public/icons/');

} catch (error) {
    console.log('❌ Требуется установка canvas:');
    console.log('npm install canvas');
    console.log('\n📋 Или используйте онлайн-сервисы:');
    console.log('1. Откройте /public/icons/icon.svg');
    console.log('2. Скопируйте в https://convertio.co/svg-png/');
    console.log('3. Скачайте нужные размеры');
}
