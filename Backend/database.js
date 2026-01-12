const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'diary.db'));
        this.init();
    }

    init() {
        // Создаем таблицу пользователей
        this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        telegram_id INTEGER UNIQUE,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Обновляем таблицу записей для поддержки пользователей
        this.db.run(`
      CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

        // Если старая таблица существует без user_id, добавляем user_id по умолчанию
        this.db.run(`
      ALTER TABLE entries ADD COLUMN user_id TEXT DEFAULT 'default_user'
    `, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.log('Column user_id already exists or other error:', err.message);
            }
        });

        console.log('База данных SQLite инициализирована с поддержкой пользователей');
    }

    // Получить все записи
    getAllEntries(userId = null) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM entries';
            let params = [];

            if (userId) {
                query += ' WHERE user_id = ?';
                params = [userId];
            }

            query += ' ORDER BY date DESC';

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Создать новую запись
    createEntry(entry) {
        return new Promise((resolve, reject) => {
            const { title, content, date, userId = 'default_user' } = entry;
            const stmt = this.db.prepare('INSERT INTO entries (title, content, date, user_id) VALUES (?, ?, ?, ?)');
            stmt.run([title, content, date, userId], function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, title, content, date, userId });
            });
            stmt.finalize();
        });
    }

    // Создать пользователя
    createUser(user) {
        return new Promise((resolve, reject) => {
            const { id, telegramId, username, firstName, lastName, createdAt, lastActive } = user;
            const stmt = this.db.prepare('INSERT INTO users (id, telegram_id, username, first_name, last_name, created_at, last_active) VALUES (?, ?, ?, ?, ?, ?, ?)');
            stmt.run([id, telegramId, username, firstName, lastName, createdAt, lastActive], function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, ...user });
            });
            stmt.finalize();
        });
    }

    // Получить пользователя по Telegram ID
    getUserByTelegramId(telegramId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Получить пользователя по ID
    getUserById(userId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Обновить пользователя
    updateUser(userId, updates) {
        return new Promise((resolve, reject) => {
            const { username, firstName, lastName, lastActive } = updates;
            const stmt = this.db.prepare('UPDATE users SET username = ?, first_name = ?, last_name = ?, last_active = ? WHERE id = ?');
            stmt.run([username, firstName, lastName, lastActive, userId], function (err) {
                if (err) reject(err);
                else resolve({ updated: this.changes > 0 });
            });
            stmt.finalize();
        });
    }

    // Получить записи пользователя
    getUserEntries(userId) {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM entries WHERE user_id = ? ORDER BY date DESC', [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Удалить запись
    deleteEntry(id) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM entries WHERE id = ?', [id], function (err) {
                if (err) reject(err);
                else resolve({ deleted: this.changes > 0 });
            });
        });
    }

    // Обновить запись
    updateEntry(id, title, content) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare('UPDATE entries SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
            stmt.run([title, content, id], function (err) {
                if (err) reject(err);
                else resolve({ updated: this.changes > 0 });
            });
            stmt.finalize();
        });
    }

    // Закрыть соединение
    close() {
        this.db.close((err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Соединение с базой данных закрыто');
            }
        });
    }
}

module.exports = Database;
