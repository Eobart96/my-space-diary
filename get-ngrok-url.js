// Получение ngrok URL
const https = require('https');

function getNgrokUrl() {
    return new Promise((resolve, reject) => {
        console.log('🔍 Поиск ngrok URL...');

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
                        const url = httpsTunnel.public_url;
                        console.log(`✅ HTTPS URL: ${url}`);
                        resolve(url);
                    } else {
                        console.log('❌ HTTPS туннель не найден');
                        reject(new Error('HTTPS tunnel not found'));
                    }
                } catch (error) {
                    console.log('❌ Ошибка парсинга JSON:', error.message);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Ошибка подключения к ngrok API:', error.message);
            reject(error);
        });

        req.end();
    });
}

// Запуск
if (require.main === module) {
    getNgrokUrl()
        .then(url => {
            console.log('\n🎉 Готово!');
            console.log('📱 Используйте этот URL для PWA2APK:');
            console.log(`📍 ${url}`);

            // Обновляем инструкции
            const fs = require('fs');
            const instructions = `
📱 ИНСТРУКЦИЯ ПО СОЗДАНИЮ APK

🔧 Что нужно сделать вручную:

1️⃣ **Откройте PWA2APK:**
   https://www.pwa2apk.com/

2️⃣ **Введите данные:**
   📍 URL: ${url}
   📱 App Name: My Space
   📦 Package Name: com.myspace.app
   🎨 Icon: выберите файл icon-512x512.png

3️⃣ **Нажмите "Generate APK"**

4️⃣ **Скачайте APK файл**

5️⃣ **Установите на Android:**
   - Перетащите APK на телефон
   - Или используйте: adb install myspace.apk

🌐 Публичный URL: ${url}

💡 Советы:
- Убедитесь что сайт доступен по URL
- APK будет работать оффлайн после установки
- Этот URL действителен пока запущен ngrok

🚀 После установки My Space будет выглядеть как нативное приложение!
            `;

            fs.writeFileSync('APK_INSTRUCTIONS_UPDATED.md', instructions);
            console.log('\n📝 Инструкции обновлены: APK_INSTRUCTIONS_UPDATED.md');

        })
        .catch(error => {
            console.log('\n❌ Не удалось получить ngrok URL');
            console.log('💡 Убедитесь что ngrok запущен:');
            console.log('   ngrok http 5173');
        });
}

module.exports = getNgrokUrl;
