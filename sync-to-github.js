// Автоматическая синхронизация с GitHub
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class GitHubSyncManager {
    constructor() {
        this.projectPath = __dirname;
        this.configPath = path.join(this.projectPath, 'github-config.json');
    }

    // Загружаем конфигурацию
    loadConfig() {
        if (fs.existsSync(this.configPath)) {
            return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        }
        return null;
    }

    // Сохраняем конфигурацию
    saveConfig(config) {
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    }

    // Проверяем статус Git
    checkGitStatus() {
        return new Promise((resolve, reject) => {
            exec('git status --porcelain', (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout.trim());
            });
        });
    }

    // Добавляем файлы в Git
    addFiles() {
        return new Promise((resolve, reject) => {
            exec('git add .', (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout);
            });
        });
    }

    // Создаем коммит
    commitChanges(message) {
        return new Promise((resolve, reject) => {
            exec(`git commit -m "${message}"`, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout);
            });
        });
    }

    // Отправляем в GitHub
    pushToGitHub() {
        return new Promise((resolve, reject) => {
            exec('git push origin main', (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout);
            });
        });
    }

    // Полная синхронизация
    async sync() {
        try {
            console.log('🔄 Синхронизация с GitHub...\n');

            // Проверяем статус
            const status = await this.checkGitStatus();

            if (!status) {
                console.log('✅ Все файлы уже синхронизированы');
                return;
            }

            console.log('📝 Изменения найдены:');
            console.log(status);

            // Добавляем файлы
            console.log('\n📁 Добавление файлов...');
            await this.addFiles();

            // Создаем коммит
            const timestamp = new Date().toLocaleString('ru-RU');
            const commitMessage = `🚀 Auto-sync: ${timestamp}`;
            console.log(`\n💾 Создание коммита: ${commitMessage}`);
            await this.commitChanges(commitMessage);

            // Отправляем в GitHub
            console.log('\n📤 Отправка в GitHub...');
            await this.pushToGitHub();

            console.log('\n✅ Синхронизация завершена успешно!');

        } catch (error) {
            console.error('❌ Ошибка синхронизации:', error.message);

            if (error.message.includes('not a git repository')) {
                console.log('\n💡 Сначала инициализируйте Git:');
                console.log('   node setup-github-sync.js');
            } else if (error.message.includes('no such remote')) {
                console.log('\n💡 Добавьте remote:');
                console.log('   git remote add origin https://github.com/username/my-space-diary.git');
            }
        }
    }

    // Настройка авто-синхронизации
    setupAutoSync() {
        const config = this.loadConfig();

        if (config && config.autoSync) {
            console.log('⏰ Настройка авто-синхронизации каждые 5 минут...');

            setInterval(async () => {
                try {
                    await this.sync();
                } catch (error) {
                    console.log('⚠️ Ошибка авто-синхронизации:', error.message);
                }
            }, 5 * 60 * 1000); // 5 минут

            console.log('✅ Авто-синхронизация включена');
        } else {
            console.log('ℹ️ Авто-синхронизация отключена');
            console.log('💡 Включите в github-config.json:');
            console.log('   {"autoSync": true}');
        }
    }
}

// Команды
const command = process.argv[2];

if (!command) {
    console.log('🌐 GitHub Sync Manager');
    console.log('\n📋 Команды:');
    console.log('  sync     - Синхронизировать изменения');
    console.log('  status   - Показать статус');
    console.log('  setup    - Настроить авто-синхронизацию');
    console.log('  init     - Инициализировать репозиторий');
    console.log('\n💡 Использование:');
    console.log('  node sync-to-github.js sync');
    console.log('  node sync-to-github.js status');
    process.exit(0);
}

const manager = new GitHubSyncManager();

switch (command) {
    case 'sync':
        manager.sync();
        break;
    case 'status':
        manager.checkGitStatus().then(status => {
            if (status) {
                console.log('📝 Изменения:');
                console.log(status);
            } else {
                console.log('✅ Нет изменений');
            }
        });
        break;
    case 'setup':
        manager.setupAutoSync();
        break;
    case 'init':
        const setup = require('./setup-github-sync.js');
        const sync = new setup();
        sync.setup();
        break;
    default:
        console.log('❌ Неизвестная команда:', command);
}

module.exports = GitHubSyncManager;
