// Автоматическая синхронизация с GitHub
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class GitHubAutoSync {
    constructor() {
        this.configPath = path.join(__dirname, 'github-config.json');
        this.config = this.loadConfig();
        this.projectPath = __dirname;
    }

    // Загрузка конфигурации
    loadConfig() {
        try {
            const configData = fs.readFileSync(this.configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.log('❌ Ошибка загрузки конфигурации:', error.message);
            process.exit(1);
        }
    }

    // Проверка Git статуса
    async checkGitStatus() {
        return new Promise((resolve, reject) => {
            exec('git status --porcelain', { cwd: this.projectPath }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout.trim());
            });
        });
    }

    // Добавление всех файлов
    async addFiles() {
        return new Promise((resolve, reject) => {
            exec('git add .', { cwd: this.projectPath }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                console.log('📁 Файлы добавлены в Git');
                resolve(stdout);
            });
        });
    }

    // Создание коммита
    async commitChanges() {
        return new Promise((resolve, reject) => {
            const message = this.config.autoSync.commitMessage;
            exec(`git commit -m "${message}"`, { cwd: this.projectPath }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                console.log('💾 Коммит создан:', message);
                resolve(stdout);
            });
        });
    }

    // Отправка в GitHub
    async pushToGitHub() {
        return new Promise((resolve, reject) => {
            const { url, branch } = this.config.repository;
            exec(`git push origin ${branch}`, { cwd: this.projectPath }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                console.log('📤 Изменения отправлены в GitHub');
                resolve(stdout);
            });
        });
    }

    // Настройка remote
    async setupRemote() {
        return new Promise((resolve, reject) => {
            const { url } = this.config.repository;
            exec(`git remote add origin ${url}`, { cwd: this.projectPath }, (error, stdout, stderr) => {
                if (error && !error.message.includes('already exists')) {
                    reject(error);
                    return;
                }
                console.log('🔗 Remote настроен:', url);
                resolve(stdout);
            });
        });
    }

    // Полная синхронизация
    async sync() {
        try {
            console.log('🔄 Начинаю синхронизацию с GitHub...');
            console.log(`📍 Репозиторий: ${this.config.repository.url}`);
            console.log(`🌿 Ветка: ${this.config.repository.branch}\n`);

            // Проверяем статус
            const status = await this.checkGitStatus();

            if (!status) {
                console.log('✅ Нет изменений для синхронизации');
                return;
            }

            console.log('📝 Обнаружены изменения:');
            console.log(status);

            // Добавляем файлы
            await this.addFiles();

            // Создаем коммит
            await this.commitChanges();

            // Отправляем в GitHub
            await this.pushToGitHub();

            console.log('\n🎉 Синхронизация успешно завершена!');
            console.log(`🌐 Ваш проект доступен: https://${this.config.repository.username}.github.io/${this.config.repository.repoName}`);

        } catch (error) {
            console.error('❌ Ошибка синхронизации:', error.message);

            if (error.message.includes('not a git repository')) {
                console.log('\n💡 Инициализация Git репозитория...');
                await this.initGit();
            } else if (error.message.includes('no such remote')) {
                console.log('\n💡 Настройка remote...');
                await this.setupRemote();
                await this.sync(); // Повторная попытка
            }
        }
    }

    // Инициализация Git
    async initGit() {
        return new Promise((resolve, reject) => {
            exec('git init', { cwd: this.projectPath }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                console.log('✅ Git репозиторий инициализирован');
                resolve(stdout);
            });
        });
    }

    // Запуск авто-синхронизации
    startAutoSync() {
        if (!this.config.autoSync.enabled) {
            console.log('ℹ️ Авто-синхронизация отключена');
            return;
        }

        const interval = this.config.autoSync.interval;
        console.log(`⏰ Авто-синхронизация включена (каждые ${interval / 1000} секунд)`);

        // Первая синхронизация сразу
        this.sync();

        // Последующие синхронизации по интервалу
        setInterval(() => {
            this.sync();
        }, interval);
    }

    // Синхронизация при изменениях файлов
    watchFiles() {
        console.log('👀 Включен отслеживание изменений файлов...');

        const watcher = require('chokidar').watch(this.projectPath, {
            ignored: this.config.build.excludeFiles,
            persistent: true
        });

        watcher.on('change', (path) => {
            console.log(`📝 Файл изменен: ${path}`);
            setTimeout(() => this.sync(), 2000); // Задержка 2 секунды
        });

        watcher.on('add', (path) => {
            console.log(`➕ Файл добавлен: ${path}`);
            setTimeout(() => this.sync(), 2000);
        });
    }
}

// Команды
const command = process.argv[2];

if (!command) {
    console.log('🔄 GitHub Auto Sync');
    console.log('\n📋 Команды:');
    console.log('  sync     - Синхронизировать сейчас');
    console.log('  auto     - Включить авто-синхронизацию');
    console.log('  watch    - Отслеживать изменения файлов');
    console.log('  init     - Инициализировать репозиторий');
    console.log('  status   - Показать статус');
    console.log('\n💡 Использование:');
    console.log('  node auto-sync-github.js sync');
    process.exit(0);
}

const sync = new GitHubAutoSync();

switch (command) {
    case 'sync':
        sync.sync();
        break;
    case 'auto':
        sync.startAutoSync();
        break;
    case 'watch':
        sync.watchFiles();
        break;
    case 'init':
        sync.initGit().then(() => sync.setupRemote()).then(() => sync.sync());
        break;
    case 'status':
        sync.checkGitStatus().then(status => {
            if (status) {
                console.log('📝 Изменения:');
                console.log(status);
            } else {
                console.log('✅ Нет изменений');
            }
        });
        break;
    default:
        console.log('❌ Неизвестная команда:', command);
}

module.exports = GitHubAutoSync;
