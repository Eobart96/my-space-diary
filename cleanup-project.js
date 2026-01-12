// Очистка проекта от лишних файлов
const fs = require('fs');
const path = require('path');

class ProjectCleaner {
    constructor() {
        this.projectPath = __dirname;
        this.filesToDelete = [
            // Временные и системные файлы
            '.continue/',
            '.DS_Store',
            'Thumbs.db',
            '*.log',
            '*.tmp',
            '*.temp',

            // Архивные файлы
            'archive/',

            // Временные скрипты и файлы
            'ngrok.exe',
            'ngrok.zip',
            'cloudflared.exe',

            // Дубликаты README
            'README_NEW.md',
            'RUN_GUIDE.md',
            'PROJECT_GUIDE.md',
            'NGROK_TELEGRAM_SETUP.md',
            'TELEGRAM_GUIDE.md',
            'TELEGRAM_SETUP.md',
            'APK_INSTRUCTIONS.md',
            'APK_INSTRUCTIONS_UPDATED.md',

            // Старые скрипты запуска
            'START.bat',
            'START_BOT.bat',
            'START_WEB.bat',
            'START_SEPARATE.bat',
            'START_WITH_NGROK.bat',
            'START_NGROK_AND_APK.bat',
            'CREATE_APK.bat',
            'CREATE_PUBLIC_APK.bat',
            'GITHUB_SYNC.bat',
            'START_WITH_NGROK.bat',

            // Временные скрипты
            'create-apk.js',
            'download-apk.js',
            'get-ngrok-url.js',
            'setup-ngrok.js',
            'setup-github-sync.js',
            'sync-to-github.js',
            'setup-git-user.js',

            // APK файлы
            '*.apk',
            'MySpace.apk',

            // Документация Telegram
            'TELEGRAM_GUIDE.md'
        ];

        this.foldersToDelete = [
            'app-scripts/',
            'telegram-services/'
        ];
    }

    // Безопасное удаление файла
    safeDeleteFile(filePath) {
        try {
            const fullPath = path.join(this.projectPath, filePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log(`🗑️ Удален файл: ${filePath}`);
                return true;
            }
        } catch (error) {
            console.log(`⚠️ Не удалось удалить файл ${filePath}: ${error.message}`);
            return false;
        }
        return false;
    }

    // Безопасное удаление папки
    safeDeleteFolder(folderPath) {
        try {
            const fullPath = path.join(this.projectPath, folderPath);
            if (fs.existsSync(fullPath)) {
                fs.rmSync(fullPath, { recursive: true, force: true });
                console.log(`📁 Удалена папка: ${folderPath}`);
                return true;
            }
        } catch (error) {
            console.log(`⚠️ Не удалось удалить папку ${folderPath}: ${error.message}`);
            return false;
        }
        return false;
    }

    // Очистка файлов по маске
    cleanupByMask(mask) {
        try {
            const files = fs.readdirSync(this.projectPath);
            files.forEach(file => {
                if (this.matchMask(file, mask)) {
                    this.safeDeleteFile(file);
                }
            });
        } catch (error) {
            console.log(`⚠️ Ошибка при очистке по маске ${mask}: ${error.message}`);
        }
    }

    // Проверка соответствия маске
    matchMask(filename, mask) {
        const regex = new RegExp(mask.replace(/\*/g, '.*'));
        return regex.test(filename);
    }

    // Создание чистого .gitignore
    createCleanGitignore() {
        const gitignore = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# APK files
*.apk
MySpace.apk

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Temporary files
tmp/
temp/
.cache/

# Archive
archive/

# Ngrok и временные файлы
ngrok.exe
ngrok.zip
cloudflared.exe

# Telegram сервисы
telegram-services/

# Временные скрипты
create-apk.js
download-apk.js
get-ngrok-url.js
setup-ngrok.js
setup-github-sync.js
sync-to-github.js
setup-git-user.js
`;

        fs.writeFileSync(path.join(this.projectPath, '.gitignore'), gitignore);
        console.log('✅ .gitignore обновлен');
    }

    // Очистка проекта
    cleanup() {
        console.log('🧹 Очистка проекта от лишних файлов...\n');

        let deletedCount = 0;

        // Удаляем файлы
        this.filesToDelete.forEach(item => {
            if (item.includes('*')) {
                this.cleanupByMask(item);
            } else {
                if (this.safeDeleteFile(item)) {
                    deletedCount++;
                }
            }
        });

        // Удаляем папки
        this.foldersToDelete.forEach(folder => {
            if (this.safeDeleteFolder(folder)) {
                deletedCount++;
            }
        });

        // Создаем чистый .gitignore
        this.createCleanGitignore();

        // Показываем статистику
        console.log(`\n📊 Статистика очистки:`);
        console.log(`🗑️ Удалено файлов: ${deletedCount}`);
        console.log(`📁 Удалено папок: ${this.foldersToDelete.length}`);

        // Показываем что осталось
        console.log('\n📁 Остались важные файлы:');
        const importantFiles = [
            'src/',
            'public/',
            'Backend/',
            'package.json',
            'vite.config.js',
            'tailwind.config.js',
            'index.html',
            'auto-sync-github.js',
            'SYNC_TO_REPO.bat',
            'github-config.json',
            'GITHUB_FINAL_GUIDE.md'
        ];

        importantFiles.forEach(file => {
            const fullPath = path.join(this.projectPath, file);
            if (fs.existsSync(fullPath)) {
                console.log(`✅ ${file}`);
            }
        });

        console.log('\n🎉 Очистка завершена!');
        console.log('💡 Проект готов к работе и синхронизации с GitHub');
    }
}

// Запуск
if (require.main === module) {
    const cleaner = new ProjectCleaner();

    console.log('🧹 My Space - Очистка проекта');
    console.log('⚠️ Внимание! Будут удалены все временные и неиспользуемые файлы\n');

    // Подтверждение
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('❓ Вы уверены? (y/N): ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            cleaner.cleanup();
        } else {
            console.log('❌ Очистка отменена');
        }
        rl.close();
    });
}

module.exports = ProjectCleaner;
