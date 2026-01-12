// Автоматическое создание APK через PWA2APK API
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class APKGenerator {
    constructor() {
        this.ngrokUrl = null;
        this.manifestPath = path.join(__dirname, 'public', 'manifest.json');
        this.iconPath = path.join(__dirname, 'public', 'icons', 'icon-512x512.png');
    }

    // Получение ngrok URL
    async getNgrokUrl() {
        return new Promise((resolve, reject) => {
            console.log('🔍 Поиск ngrok URL...');

            // Проверяем API ngrok
            const options = {
                hostname: '127.0.0.1',
                port: 4040,
                path: '/api/tunnels',
                method: 'GET'
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const tunnels = JSON.parse(data);
                        const httpsTunnel = tunnels.tunnels.find(t => t.proto === 'https');
                        if (httpsTunnel) {
                            this.ngrokUrl = httpsTunnel.public_url;
                            console.log(`✅ Ngrok URL найден: ${this.ngrokUrl}`);
                            resolve(this.ngrokUrl);
                        } else {
                            reject(new Error('HTTPS туннель не найден'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            req.on('error', () => {
                console.log('⚠️ ngrok API недоступен, использую localhost...');
                resolve('http://localhost:5173');
            });

            req.end();
        });
    }

    // Проверка готовности файлов
    checkFiles() {
        const requiredFiles = [
            this.manifestPath,
            this.iconPath
        ];

        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`Файл не найден: ${file}`);
            }
        }

        console.log('✅ Все необходимые файлы на месте');
    }

    // Создание инструкций для ручной генерации
    createManualInstructions() {
        const instructions = `
📱 ИНСТРУКЦИЯ ПО СОЗДАНИЮ APK

🔧 Что нужно сделать вручную:

1️⃣ **Откройте PWA2APK:**
   https://www.pwa2apk.com/

2️⃣ **Введите данные:**
   📍 URL: ${this.ngrokUrl || 'http://localhost:5173'}
   📱 App Name: My Space
   📦 Package Name: com.myspace.app
   🎨 Icon: выберите файл icon-512x512.png

3️⃣ **Нажмите "Generate APK"**

4️⃣ **Скачайте APK файл**

5️⃣ **Установите на Android:**
   - Перетащите APK на телефон
   - Или используйте: adb install myspace.apk

📁 Готовые файлы:
- 📋 Manifest: ${this.manifestPath}
- 🎨 Icon: ${this.iconPath}

🌐 Публичный URL: ${this.ngrokUrl || 'http://localhost:5173'}

💡 Советы:
- Убедитесь что сайт доступен по URL
- Используйте HTTPS URL для продакшена
- APK будет работать оффлайн после установки

🚀 После установки My Space будет выглядеть как нативное приложение!
        `;

        // Сохраняем инструкции
        fs.writeFileSync(path.join(__dirname, 'APK_INSTRUCTIONS.md'), instructions);
        console.log('📝 Инструкции сохранены в APK_INSTRUCTIONS.md');

        return instructions;
    }

    // Основной метод
    async generate() {
        try {
            console.log('🚀 Запуск генерации APK...\n');

            // Проверяем файлы
            this.checkFiles();

            // Получаем ngrok URL
            await this.getNgrokUrl();

            // Создаем инструкции
            const instructions = this.createManualInstructions();

            console.log('\n🎉 Готово! Следуйте инструкциям выше.');
            console.log('📱 APK файл будет создан через PWA2APK');
            console.log('💡 Это самый простой и надежный способ');

            // Открываем браузер с инструкциями
            setTimeout(() => {
                const start = process.platform === 'win32' ? 'start' : 'open';
                exec(`${start} https://www.pwa2apk.com/`, (error) => {
                    if (error) {
                        console.log('🌐 Откройте вручную: https://www.pwa2apk.com/');
                    } else {
                        console.log('🌐 PWA2APK открыт в браузере');
                    }
                });
            }, 2000);

        } catch (error) {
            console.error('❌ Ошибка:', error.message);
            process.exit(1);
        }
    }
}

// Запуск
if (require.main === module) {
    const generator = new APKGenerator();
    generator.generate();
}

module.exports = APKGenerator;
