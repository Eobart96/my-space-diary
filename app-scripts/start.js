const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Цвета для консоли
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

console.log(`${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════════════════════╗
║                    🚀 MY SPACE - ДНЕВНИК                      ║
║                                                              ║
║  Запуск Frontend и Backend серверов                          ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

// Проверяем наличие Backend
const backendPath = path.join(__dirname, '..', 'Backend');
if (!fs.existsSync(backendPath)) {
    console.log(`${colors.red}❌ Папка Backend не найдена!${colors.reset}`);
    process.exit(1);
}

// Проверяем наличие package.json в Backend
const backendPackage = path.join(backendPath, 'package.json');
if (!fs.existsSync(backendPackage)) {
    console.log(`${colors.red}❌ Backend/package.json не найден!${colors.reset}`);
    process.exit(1);
}

// Функция для запуска процесса
function startProcess(name, command, args, cwd, color) {
    return new Promise((resolve, reject) => {
        console.log(`${color}🔄 Запуск ${name}...${colors.reset}`);

        const process = spawn(command, args, {
            cwd: cwd,
            stdio: 'pipe',
            shell: true
        });

        process.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    console.log(`${color}[${name}]${colors.reset} ${line}`);
                }
            });
        });

        process.stderr.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    console.log(`${colors.red}[${name} ERROR]${colors.reset} ${line}`);
                }
            });
        });

        process.on('close', (code) => {
            if (code === 0) {
                console.log(`${color}✅ ${name} завершился успешно${colors.reset}`);
                resolve();
            } else {
                console.log(`${colors.red}❌ ${name} завершился с ошибкой (код: ${code})${colors.reset}`);
                reject(new Error(`${name} failed with code ${code}`));
            }
        });

        process.on('error', (error) => {
            console.log(`${colors.red}❌ Ошибка запуска ${name}: ${error.message}${colors.reset}`);
            reject(error);
        });

        // Возвращаем процесс для возможности управления
        return process;
    });
}

// Запуск Backend
async function startBackend() {
    try {
        console.log(`${colors.yellow}📦 Проверка зависимостей Backend...${colors.reset}`);

        // Проверяем node_modules
        const nodeModulesPath = path.join(backendPath, 'node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
            console.log(`${colors.yellow}📦 Установка зависимостей Backend...${colors.reset}`);
            await new Promise((resolve, reject) => {
                const npmInstall = spawn('npm', ['install'], {
                    cwd: backendPath,
                    stdio: 'pipe'
                });

                npmInstall.on('close', (code) => {
                    if (code === 0) {
                        console.log(`${colors.green}✅ Зависимости Backend установлены${colors.reset}`);
                        resolve();
                    } else {
                        reject(new Error(`npm install failed with code ${code}`));
                    }
                });
            });
        }

        console.log(`${colors.green}✅ Backend готов к запуску${colors.reset}`);
        return startProcess('Backend', 'npm', ['run', 'dev'], backendPath, colors.green);
    } catch (error) {
        console.log(`${colors.red}❌ Ошибка подготовки Backend: ${error.message}${colors.reset}`);
        throw error;
    }
}

// Запуск Frontend
async function startFrontend() {
    try {
        console.log(`${colors.yellow}📦 Проверка зависимостей Frontend...${colors.reset}`);

        // Проверяем node_modules
        const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
            console.log(`${colors.yellow}📦 Установка зависимостей Frontend...${colors.reset}`);
            await new Promise((resolve, reject) => {
                const npmInstall = spawn('npm', ['install'], {
                    cwd: path.join(__dirname, '..'),
                    stdio: 'pipe'
                });

                npmInstall.on('close', (code) => {
                    if (code === 0) {
                        console.log(`${colors.green}✅ Зависимости Frontend установлены${colors.reset}`);
                        resolve();
                    } else {
                        reject(new Error(`npm install failed with code ${code}`));
                    }
                });
            });
        }

        console.log(`${colors.green}✅ Frontend готов к запуску${colors.reset}`);
        return startProcess('Frontend', 'npm', ['run', 'dev'], path.join(__dirname, '..'), colors.blue);
    } catch (error) {
        console.log(`${colors.red}❌ Ошибка подготовки Frontend: ${error.message}${colors.reset}`);
        throw error;
    }
}

// Основная функция запуска
async function startAll() {
    try {
        // Запускаем Backend
        const backendProcess = await startBackend();

        // Ждем немного для уверенности, что Backend запустился
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Запускаем Frontend
        const frontendProcess = await startFrontend();

        console.log(`\n${colors.green}${colors.bright}
╔══════════════════════════════════════════════════════════════╗
║                    🌟 ВСЕ СЕРВЕРЫ ЗАПУЩЕНЫ!                   ║
║                                                              ║
║  Frontend: http://localhost:5173                              ║
║  Backend:  http://localhost:3001                              ║
║                                                              ║
║  Нажмите Ctrl+C для остановки                                 ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

        // Обработка завершения
        process.on('SIGINT', () => {
            console.log(`\n${colors.yellow}🛑 Остановка серверов...${colors.reset}`);
            process.exit(0);
        });

    } catch (error) {
        console.log(`\n${colors.red}❌ Критическая ошибка: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}

// Запуск
startAll();
