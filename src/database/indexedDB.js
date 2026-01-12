// IndexedDB менеджер для браузера
class IndexedDBManager {
    constructor() {
        this.dbName = 'MySpaceDiary';
        this.version = 1;
        this.db = null;
    }

    // Инициализация базы данных
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Создаем хранилище для записей
                if (!db.objectStoreNames.contains('entries')) {
                    const store = db.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('date', 'date', { unique: false });
                    store.createIndex('created_at', 'created_at', { unique: false });
                }
            };
        });
    }

    // Получить все записи
    async getAllEntries() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['entries'], 'readonly');
            const store = transaction.objectStore('entries');
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const entries = request.result;
                // Сортируем по дате (новые первые)
                entries.sort((a, b) => new Date(b.date) - new Date(a.date));
                resolve(entries);
            };
        });
    }

    // Создать новую запись
    async createEntry(title, content, date) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['entries'], 'readwrite');
            const store = transaction.objectStore('entries');

            const entry = {
                title,
                content,
                date: date || new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const request = store.add(entry);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                entry.id = request.result;
                resolve(entry);
            };
        });
    }

    // Удалить запись
    async deleteEntry(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['entries'], 'readwrite');
            const store = transaction.objectStore('entries');
            const request = store.delete(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve({ deleted: true });
        });
    }

    // Обновить запись
    async updateEntry(id, title, content) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['entries'], 'readwrite');
            const store = transaction.objectStore('entries');

            // Сначала получаем существующую запись
            const getRequest = store.get(id);

            getRequest.onerror = () => reject(getRequest.error);
            getRequest.onsuccess = () => {
                const entry = getRequest.result;
                if (!entry) {
                    reject(new Error('Entry not found'));
                    return;
                }

                // Обновляем поля
                entry.title = title;
                entry.content = content;
                entry.updated_at = new Date().toISOString();

                const updateRequest = store.put(entry);
                updateRequest.onerror = () => reject(updateRequest.error);
                updateRequest.onsuccess = () => resolve({ updated: true });
            };
        });
    }

    // Получить записи по дате
    async getEntriesByDate(date) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['entries'], 'readonly');
            const store = transaction.objectStore('entries');
            const index = store.index('date');
            const request = index.getAll(date);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Очистить базу данных
    async clear() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['entries'], 'readwrite');
            const store = transaction.objectStore('entries');
            const request = store.clear();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve({ cleared: true });
        });
    }
}

export default IndexedDBManager;
