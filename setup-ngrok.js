const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Установка ngrok если не установлен
function installNgrok() {
    return new Promise((resolve, reject) => {
        const npmInstall = spawn('npm', ['install', '-g', 'ngrok'], { shell: true });

        npmInstall.on('close', (code) => {
            if (code === 0) {
                console.log('✅ ngrok установлен');
                resolve();
            } else {
                console.log('❌ Ошибка установки ngrok');
                reject(new Error('Failed to install ngrok'));
            }
        });
    });
}

// Запуск ngrok для фронтенда
function startNgrokFrontend() {
    return new Promise((resolve, reject) => {
        console.log('🚀 Запуск ngrok для фронтенда (порт 5173)...');

        const ngrok = spawn('ngrok', ['http', '5173'], { shell: true });

        ngrok.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(output);

            // Ищем URL в выводе
            const match = output.match(/https:\/\/[a-z0-9-]+\.ngrok\.io/);
            if (match) {
                const frontendUrl = match[0];
                console.log(`✅ Frontend URL: ${frontendUrl}`);

                // Сохраняем URL в файл
                fs.writeFileSync(path.join(__dirname, 'frontend-url.txt'), frontendUrl);
                resolve(frontendUrl);
            }
        });

        ngrok.stderr.on('data', (data) => {
            console.error(`ngrok error: ${data}`);
        });

        ngrok.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`ngrok exited with code ${code}`));
            }
        });

        // Таймаут на случай, если ngrok не запустится
        setTimeout(() => {
            reject(new Error('ngrok timeout'));
        }, 30000);
    });
}

// Запуск ngrok для бэкенда
function startNgrokBackend() {
    return new Promise((resolve, reject) => {
        console.log('🚀 Запуск ngrok для бэкенда (порт 3001)...');

        const ngrok = spawn('ngrok', ['http', '3001'], { shell: true });

        ngrok.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(output);

            // Ищем URL в выводе
            const match = output.match(/https:\/\/[a-z0-9-]+\.ngrok\.io/);
            if (match) {
                const backendUrl = match[0];
                console.log(`✅ Backend URL: ${backendUrl}`);

                // Сохраняем URL в файл
                fs.writeFileSync(path.join(__dirname, 'backend-url.txt'), backendUrl);
                resolve(backendUrl);
            }
        });

        ngrok.stderr.on('data', (data) => {
            console.error(`ngrok error: ${data}`);
        });

        ngrok.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`ngrok exited with code ${code}`));
            }
        });

        // Таймаут на случай, если ngrok не запустится
        setTimeout(() => {
            reject(new Error('ngrok timeout'));
        }, 30000);
    });
}

// Обновление конфигурации
function updateConfig(frontendUrl, backendUrl) {
    // Обновляем .env файл для бота
    const envPath = path.join(__dirname, 'telegram-services', 'telegram-bot', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Заменяем API_URL на ngrok URL
    envContent = envContent.replace(
        /API_URL=.*/,
        `API_URL=${backendUrl}`
    );

    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Обновлен API_URL: ${backendUrl}`);

    // Обновляем фронтенд конфигурацию
    const viteConfigPath = path.join(__dirname, 'vite.config.js');
    if (fs.existsSync(viteConfigPath)) {
        let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

        // Добавляем прокси для API
        if (!viteConfig.includes('proxy')) {
            viteConfig = viteConfig.replace(
                /export default defineConfig\(\{/,
                `export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: '${backendUrl}',
        changeOrigin: true
      }
    }
  },`
            );
        }

        fs.writeFileSync(viteConfigPath, viteConfig);
        console.log(`✅ Обновлен Vite конфиг`);
    }
}

// Основная функция
async function main() {
    try {
        console.log('🔧 Настройка ngrok для Telegram авторизации...\n');

        // Устанавливаем ngrok если нужно
        try {
            await installNgrok();
        } catch (error) {
            console.log('⚠️ ngrok уже установлен или ошибка установки');
        }

        // Запускаем ngrok для обоих сервисов
        const frontendUrl = await startNgrokFrontend();
        const backendUrl = await startNgrokBackend();

        // Обновляем конфигурацию
        updateConfig(frontendUrl, backendUrl);

        console.log('\n🎉 Готово! Теперь можно использовать:');
        console.log(`🌐 Frontend: ${frontendUrl}`);
        console.log(`🔧 Backend: ${backendUrl}`);
        console.log('\n💡 Обновите домен в настройках бота Telegram!');

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { installNgrok, startNgrokFrontend, startNgrokBackend, updateConfig };
