// Автоматическая загрузка APK через PWA2APK API
const https = require('https');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

class APKDownloader {
    constructor() {
        this.url = 'http://localhost:5173';
        this.iconPath = path.join(__dirname, 'public', 'icons', 'icon-512x512.png');
    }

    // Отправка запроса на создание APK
    async createAPK() {
        return new Promise((resolve, reject) => {
            console.log('📱 Создание APK через PWA2APK...');

            // Создаем форму данных
            const form = new FormData();
            form.append('url', this.url);
            form.append('name', 'My Space');
            form.append('package', 'com.myspace.app');
            form.append('icon', fs.createReadStream(this.iconPath));

            // Отправляем запрос
            const options = {
                hostname: 'www.pwa2apk.com',
                port: 443,
                path: '/generate',
                method: 'POST',
                headers: form.getHeaders()
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        if (result.success) {
                            console.log('✅ APK успешно создан!');
                            console.log(`📥 Ссылка для скачивания: ${result.downloadUrl}`);
                            resolve(result);
                        } else {
                            reject(new Error(result.error || 'Ошибка создания APK'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            req.on('error', reject);
            form.pipe(req);
        });
    }

    // Загрузка APK файла
    async downloadAPK(downloadUrl) {
        return new Promise((resolve, reject) => {
            console.log('📥 Загрузка APK файла...');

            const file = fs.createWriteStream(path.join(__dirname, 'MySpace.apk'));

            https.get(downloadUrl, (res) => {
                res.pipe(file);

                file.on('finish', () => {
                    file.close();
                    console.log('✅ APK файл загружен: MySpace.apk');
                    resolve();
                });
            }).on('error', reject);
        });
    }

    // Основной метод
    async run() {
        try {
            console.log('🚀 Запуск процесса создания APK...\n');

            // Проверяем иконку
            if (!fs.existsSync(this.iconPath)) {
                throw new Error(`Иконка не найдена: ${this.iconPath}`);
            }

            // Создаем APK
            const result = await this.createAPK();

            if (result.downloadUrl) {
                // Загружаем APK
                await this.downloadAPK(result.downloadUrl);

                console.log('\n🎉 Готово!');
                console.log('📱 APK файл: MySpace.apk');
                console.log('💾 Размер файла: ' + fs.statSync('MySpace.apk').size + ' байт');
                console.log('\n📲 Установка на Android:');
                console.log('1. Перетащите MySpace.apk на телефон');
                console.log('2. Разрешите установку из неизвестных источников');
                console.log('3. Нажмите "Установить"');
            } else {
                console.log('❌ Не удалось получить ссылку на APK');
                console.log('🌐 Пожалуйста, используйте веб-интерфейс:');
                console.log('https://www.pwa2apk.com/');
            }

        } catch (error) {
            console.error('❌ Ошибка:', error.message);
            console.log('\n🔄 Альтернативный способ:');
            console.log('1. Откройте: https://www.pwa2apk.com/');
            console.log('2. Введите URL: http://localhost:5173');
            console.log('3. Загрузите иконку: public/icons/icon-512x512.png');
            console.log('4. Скачайте APK');
        }
    }
}

// Проверяем наличие form-data
try {
    require('form-data');
} catch (error) {
    console.log('📦 Установка зависимостей...');
    const { exec } = require('child_process');
    exec('npm install form-data', (error, stdout, stderr) => {
        if (error) {
            console.log('❌ Ошибка установки:', error);
            return;
        }
        console.log('✅ Зависимости установлены');
        console.log('🔄 Запустите скрипт еще раз: node download-apk.js');
    });
    return;
}

// Запуск
if (require.main === module) {
    const downloader = new APKDownloader();
    downloader.run();
}

module.exports = APKDownloader;
