// Настройка синхронизации с GitHub
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class GitHubSync {
    constructor() {
        this.projectPath = __dirname;
        this.gitIgnorePath = path.join(this.projectPath, '.gitignore');
        this.readmePath = path.join(this.projectPath, 'README.md');
        this.packagePath = path.join(this.projectPath, 'package.json');
    }

    // Проверяем Git
    checkGit() {
        try {
            exec('git --version', (error, stdout) => {
                if (error) {
                    console.log('❌ Git не установлен!');
                    console.log('📦 Скачайте с: https://git-scm.com/download/win');
                    return false;
                }
                console.log('✅ Git установлен:', stdout.trim());
                return true;
            });
        } catch (error) {
            console.log('❌ Git не найден');
            return false;
        }
    }

    // Создаем .gitignore
    createGitIgnore() {
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

# Cache
.cache/
.parcel-cache/

# Backup files
*.backup
*.bak
archive/
`;

        fs.writeFileSync(this.gitIgnorePath, gitignore);
        console.log('✅ .gitignore создан');
    }

    // Создаем README.md
    createReadme() {
        let packageInfo = {};
        try {
            packageInfo = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
        } catch (error) {
            console.log('⚠️ package.json не найден');
        }

        const readme = `# 🌌 My Space - Личный дневник

> Ваша космическая вселенная мыслей

## 🚀 Демо

🌐 **Live Demo:** https://username.github.io/my-space-diary

📱 **Android APK:** [MySpace.apk](./MySpace.apk)

## ✨ Возможности

- 📝 Создание записей
- 🎨 Космический интерфейс
- 📅 Фильтрация по дате
- 📱 PWA (Progressive Web App)
- 📲 Установка на главный экран
- 🔄 Автообновления
- 📵 Оффлайн режим

## 🛠️ Технологии

- ⚛️ React 18
- 🎨 Tailwind CSS
- 🗄️ Vite
- 📱 PWA
- 🗄️ Service Worker
- 📱 Progressive Web App

## 🚀 Быстрый старт

### 📦 Установка зависимостей
\`\`\`bash
npm install
\`\`\`

### 🌐 Запуск разработки
\`\`\`bash
npm run dev
\`\`\`

### 📱 Создание APK
\`\`\`bash
node generate-icons.js
node create-apk.js
\`\`\`

### 📱 Установка на Android
1. Скачайте APK файл
2. Разрешите установку из неизвестных источников
3. Установите приложение

## 📁 Структура проекта

\`\`\`
my-space-diary/
├── public/                 # Статические файлы
│   ├── icons/            # Иконки PWA
│   ├── manifest.json      # Манифест PWA
│   └── sw.js            # Service Worker
├── src/                   # Исходный код
│   ├── components/        # React компоненты
│   ├── database/         # База данных
│   └── App.jsx           # Главный компонент
├── Backend/               # Backend сервер
│   ├── server.js          # Express сервер
│   ├── database.js        # SQLite база
│   └── auth.js           # Аутентификация
└── scripts/               # Скрипты
    ├── generate-icons.js  # Генератор иконок
    └── create-apk.js     # Создание APK
\`\`\`

## 🔧 Конфигурация

### 📱 PWA Настройки
- 📋 \`public/manifest.json\` - Манифест приложения
- 🗄️ \`public/sw.js\` - Service Worker
- 🎨 \`public/icons/\` - Иконки приложения

### 🌐 Backend Настройки
- 🔗 \`Backend/server.js\` - Express сервер
- 🗄️ \`Backend/database.js\` - SQLite база данных
- 🔐 \`Backend/auth.js\` - Аутентификация

## 📱 PWA Возможности

- 📱 Установка на главный экран
- 📲 Push уведомления
- 📵 Оффлайн работа
- 🔄 Автообновления
- 🎨 Нативный вид

## 🤝️ Вклад

Вклады приветствуются! Пожалуйста:

1. Форкните репозиторий
2. Создайте ветку (\`git checkout -b feature/AmazingFeature\`)
3. Закоммитьте (\`git commit -m 'Add some AmazingFeature'\`)
4. Отправьте (\`git push origin feature/AmazingFeature\`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. [LICENSE](LICENSE) файл

## 👨‍💻 Автор

**My Space Diary** - Ваш личный космический дневник

---

🌌 **Создавайте, мечтайте, вдохновляйтесь!**
`;

        fs.writeFileSync(this.readmePath, readme);
        console.log('✅ README.md создан');
    }

    // Инициализация Git репозитория
    initGit() {
        const commands = [
            'git init',
            'git add .',
            'git commit -m "🚀 Initial commit: My Space Diary"',
            'git branch -M main'
        ];

        commands.forEach((command, index) => {
            setTimeout(() => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.log(`❌ Ошибка: ${error.message}`);
                        return;
                    }
                    console.log(`✅ ${command}`);

                    if (index === commands.length - 1) {
                        this.showNextSteps();
                    }
                });
            }, index * 1000);
        });
    }

    // Показываем следующие шаги
    showNextSteps() {
        console.log('\n🎉 Git репозиторий инициализирован!');
        console.log('\n📋 Следующие шаги:');
        console.log('1️⃣ Создайте репозиторий на GitHub:');
        console.log('   🌐 https://github.com/new');
        console.log('   📦 Название: my-space-diary');
        console.log('   🌍 Публичный');
        console.log('\n2️⃣ Добавьте remote:');
        console.log('   git remote add origin https://github.com/username/my-space-diary.git');
        console.log('   git push -u origin main');
        console.log('\n3️⃣ Включите GitHub Pages:');
        console.log('   Settings → Pages → Source: Deploy from a branch');
        console.log('   Branch: main → /root');
        console.log('\n4️⃣ Ваш сайт будет доступен:');
        console.log('   🌐 https://username.github.io/my-space-diary');
        console.log('\n5️⃣ Создайте APK:');
        console.log('   📱 Используйте URL сайта в PWA2APK');
        console.log('   🔗 https://www.pwa2apk.com/');
    }

    // Основной метод
    setup() {
        console.log('🚀 Настройка синхронизации с GitHub...\n');

        // Проверяем Git
        if (!this.checkGit()) {
            return;
        }

        // Создаем файлы
        this.createGitIgnore();
        this.createReadme();

        // Инициализируем Git
        this.initGit();
    }
}

// Запуск
if (require.main === module) {
    const sync = new GitHubSync();
    sync.setup();
}

module.exports = GitHubSync;
