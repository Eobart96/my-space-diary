import IndexedDBManager from './indexedDB.js';

// Универсальный менеджер базы данных
class UniversalDB {
    constructor() {
        this.isServer = typeof window === 'undefined';
        this.indexedDB = !this.isServer ? new IndexedDBManager() : null;
        this.apiBase = this.isServer ? null : 'http://localhost:3001/api';
    }

    // Определить, где хранить данные
    async getStorageLocation() {
        if (this.isServer) {
            return 'server';
        }

        // Проверяем доступность сервера
        try {
            const response = await fetch(`${this.apiBase}/entries`, {
                method: 'HEAD',
                timeout: 2000
            });
            return response.ok ? 'server' : 'local';
        } catch {
            return 'local';
        }
    }

    // Получить все записи
    async getAllEntries() {
        const location = await this.getStorageLocation();

        if (location === 'server') {
            try {
                const response = await fetch(`${this.apiBase}/entries`);
                if (!response.ok) throw new Error('Server error');
                return await response.json();
            } catch (error) {
                console.warn('Server unavailable, falling back to local storage:', error);
                return this.getLocalEntries();
            }
        } else {
            return this.getLocalEntries();
        }
    }

    // Получить локальные записи (IndexedDB)
    async getLocalEntries() {
        if (!this.indexedDB) {
            await this.indexedDB.init();
        }
        return this.indexedDB.getAllEntries();
    }

    // Создать запись
    async createEntry(title, content, date) {
        const location = await this.getStorageLocation();

        if (location === 'server') {
            try {
                const response = await fetch(`${this.apiBase}/entries`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, content, date })
                });

                if (!response.ok) throw new Error('Server error');
                const serverEntry = await response.json();

                // Сохраняем локально для офлайн доступа
                await this.saveLocalEntry(serverEntry);
                return serverEntry;
            } catch (error) {
                console.warn('Server unavailable, saving locally:', error);
                return this.createLocalEntry(title, content, date);
            }
        } else {
            return this.createLocalEntry(title, content, date);
        }
    }

    // Создать локальную запись
    async createLocalEntry(title, content, date) {
        if (!this.indexedDB) {
            await this.indexedDB.init();
        }
        return this.indexedDB.createEntry(title, content, date);
    }

    // Сохранить запись локально
    async saveLocalEntry(entry) {
        if (!this.indexedDB) {
            await this.indexedDB.init();
        }
        // Проверяем, существует ли запись
        try {
            const existing = await this.indexedDB.getEntry(entry.id);
            if (!existing) {
                return this.indexedDB.createEntry(entry.title, entry.content, entry.date);
            }
        } catch {
            return this.indexedDB.createEntry(entry.title, entry.content, entry.date);
        }
    }

    // Удалить запись
    async deleteEntry(id) {
        const location = await this.getStorageLocation();

        if (location === 'server') {
            try {
                await fetch(`${this.apiBase}/entries/${id}`, { method: 'DELETE' });
                // Удаляем и локально
                await this.deleteLocalEntry(id);
                return { deleted: true };
            } catch (error) {
                console.warn('Server unavailable, deleting locally:', error);
                return this.deleteLocalEntry(id);
            }
        } else {
            return this.deleteLocalEntry(id);
        }
    }

    // Удалить локальную запись
    async deleteLocalEntry(id) {
        if (!this.indexedDB) {
            await this.indexedDB.init();
        }
        return this.indexedDB.deleteEntry(id);
    }

    // Обновить запись
    async updateEntry(id, title, content) {
        const location = await this.getStorageLocation();

        if (location === 'server') {
            try {
                await fetch(`${this.apiBase}/entries/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, content })
                });

                // Обновляем и локально
                await this.updateLocalEntry(id, title, content);
                return { updated: true };
            } catch (error) {
                console.warn('Server unavailable, updating locally:', error);
                return this.updateLocalEntry(id, title, content);
            }
        } else {
            return this.updateLocalEntry(id, title, content);
        }
    }

    // Обновить локальную запись
    async updateLocalEntry(id, title, content) {
        if (!this.indexedDB) {
            await this.indexedDB.init();
        }
        return this.indexedDB.updateEntry(id, title, content);
    }

    // Синхронизация данных
    async sync() {
        if (this.isServer) return { synced: false, reason: 'Server mode' };

        try {
            // Получаем серверные данные
            const serverResponse = await fetch(`${this.apiBase}/entries`);
            const serverEntries = serverResponse.ok ? await serverResponse.json() : [];

            // Получаем локальные данные
            const localEntries = await this.getLocalEntries();

            // Простая синхронизация: сервер имеет приоритет
            await this.indexedDB.clear();
            for (const entry of serverEntries) {
                await this.saveLocalEntry(entry);
            }

            return { synced: true, entries: serverEntries.length };
        } catch (error) {
            console.warn('Sync failed:', error);
            return { synced: false, reason: error.message };
        }
    }

    // Получить статус синхронизации
    async getSyncStatus() {
        if (this.isServer) return { mode: 'server', synced: true };

        const location = await this.getStorageLocation();
        return {
            mode: location,
            synced: location === 'server',
            available: location === 'server'
        };
    }
}

export default UniversalDB;
