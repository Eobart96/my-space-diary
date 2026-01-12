const crypto = require('crypto');
const Database = require('./database');

class AuthService {
    constructor() {
        this.db = new Database();
        this.pendingAuth = new Map(); // Временное хранилище для pending auth
    }

    // Генерация уникального токена авторизации
    generateAuthToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Создание запроса на авторизацию
    createAuthRequest() {
        const token = this.generateAuthToken();
        const authData = {
            token,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 минут
            status: 'pending'
        };

        this.pendingAuth.set(token, authData);

        // Очистка истекших токенов
        this.cleanupExpiredTokens();

        return {
            token,
            authUrl: `https://t.me/MySpaceDiary_bot?start=auth_${token}`,
            expiresAt: authData.expiresAt
        };
    }

    // Проверка токена авторизации
    validateAuthToken(token) {
        const authData = this.pendingAuth.get(token);

        if (!authData) {
            return { valid: false, error: 'Token not found' };
        }

        if (authData.status !== 'pending') {
            return { valid: false, error: 'Token already used' };
        }

        if (new Date() > authData.expiresAt) {
            this.pendingAuth.delete(token);
            return { valid: false, error: 'Token expired' };
        }

        return { valid: true, authData };
    }

    // Привязка Telegram аккаунта к веб-сессии
    async linkTelegramAccount(token, telegramId, telegramUser) {
        const validation = this.validateAuthToken(token);

        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        try {
            // Обновляем статус токена
            const authData = validation.authData;
            authData.status = 'linked';
            authData.telegramId = telegramId;
            authData.telegramUser = telegramUser;
            authData.linkedAt = new Date();

            // Создаем или обновляем пользователя в веб-БД
            const webUserId = `telegram_${telegramId}`;

            // Проверяем, есть ли уже пользователь
            const existingUser = await this.db.getUserByTelegramId(telegramId);

            if (!existingUser) {
                // Создаем нового пользователя
                await this.db.createUser({
                    id: webUserId,
                    telegramId: telegramId,
                    username: telegramUser.username,
                    firstName: telegramUser.first_name,
                    lastName: telegramUser.last_name,
                    createdAt: new Date(),
                    lastActive: new Date()
                });
            } else {
                // Обновляем существующего пользователя
                await this.db.updateUser(webUserId, {
                    username: telegramUser.username,
                    firstName: telegramUser.first_name,
                    lastName: telegramUser.last_name,
                    lastActive: new Date()
                });
            }

            // Синхронизируем записи из Telegram в веб
            await this.syncEntriesFromTelegram(telegramId, webUserId);

            // Создаем сессию для веб-приложения
            const sessionToken = this.generateSessionToken(webUserId);

            return {
                success: true,
                webUserId,
                sessionToken,
                user: {
                    id: webUserId,
                    telegramId: telegramId,
                    username: telegramUser.username,
                    firstName: telegramUser.first_name,
                    lastName: telegramUser.last_name
                }
            };

        } catch (error) {
            console.error('Error linking Telegram account:', error);
            return { success: false, error: 'Internal server error' };
        }
    }

    // Генерация сессионного токена
    generateSessionToken(userId) {
        const token = crypto.randomBytes(64).toString('hex');
        const sessionData = {
            userId,
            token,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 часа
        };

        // В реальном приложении здесь нужно сохранить в Redis или базу данных
        // Для примера используем временное хранилище
        this.pendingAuth.set(`session_${token}`, sessionData);

        return token;
    }

    // Проверка сессионного токена
    validateSessionToken(token) {
        const sessionData = this.pendingAuth.get(`session_${token}`);

        if (!sessionData) {
            return { valid: false };
        }

        if (new Date() > sessionData.expiresAt) {
            this.pendingAuth.delete(`session_${token}`);
            return { valid: false };
        }

        return { valid: true, userId: sessionData.userId };
    }

    // Синхронизация записей из Telegram в веб
    async syncEntriesFromTelegram(telegramId, webUserId) {
        try {
            // Здесь должна быть логика синхронизации с Telegram базой данных
            // Для примера просто создадим тестовую запись

            const testEntry = {
                title: "Первая запись после синхронизации",
                content: "Ваш аккаунт Telegram успешно связан с веб-приложением!",
                date: new Date().toISOString().split('T')[0],
                userId: webUserId,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await this.db.createEntry(testEntry);

            console.log(`Synced entries for Telegram user ${telegramId} to web user ${webUserId}`);
        } catch (error) {
            console.error('Error syncing entries:', error);
        }
    }

    // Очистка истекших токенов
    cleanupExpiredTokens() {
        const now = new Date();

        for (const [token, data] of this.pendingAuth.entries()) {
            if (data.expiresAt && now > data.expiresAt) {
                this.pendingAuth.delete(token);
            }
        }
    }

    // Получение статуса авторизации
    getAuthStatus(token) {
        const authData = this.pendingAuth.get(token);

        if (!authData) {
            return { status: 'not_found' };
        }

        if (authData.status === 'linked') {
            return {
                status: 'linked',
                linkedAt: authData.linkedAt,
                telegramUser: authData.telegramUser
            };
        }

        if (new Date() > authData.expiresAt) {
            this.pendingAuth.delete(token);
            return { status: 'expired' };
        }

        return { status: 'pending', expiresAt: authData.expiresAt };
    }
}

module.exports = AuthService;
