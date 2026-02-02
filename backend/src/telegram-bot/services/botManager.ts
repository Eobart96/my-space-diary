import TelegramBot, { Message } from 'node-telegram-bot-api';
import fs from 'fs';
import { diaryApi, nutritionApi } from './apiClient';
import { ensureTelegramSettings, getSettingsPath, readTelegramSettings, writeTelegramSettings } from './settingsStore';
const tzLookup = require('tz-lookup') as (lat: number, lon: number) => string;

type DiaryState = {
    flow: 'add_diary';
    step: 'text' | 'mood' | 'photos';
    data?: {
        text?: string;
        mood?: number;
        photo_url?: string;
        photo_urls?: string[];
    };
};

type EditDiaryState = {
    flow: 'edit_diary';
    step: 'choose' | 'text' | 'mood';
    data?: {
        id?: number;
        text?: string;
        mood?: number;
        originalText?: string;
        originalMood?: number;
    };
};

type FoodState = {
    flow: 'add_food';
    step: 'name' | 'assessment' | 'pros' | 'cons' | 'description' | 'photos';
    data: {
        name?: string;
        assessment?: 'positive' | 'neutral' | 'negative';
        pros?: string | null;
        cons?: string | null;
        description?: string | null;
        photo_url?: string;
        photo_urls?: string[];
    };
};

type EditProductState = {
    flow: 'edit_product';
    step: 'choose' | 'name' | 'assessment' | 'pros' | 'cons' | 'description' | 'photos';
    data: {
        id?: number;
        name?: string;
        assessment?: 'positive' | 'neutral' | 'negative';
        pros?: string;
        cons?: string;
        description?: string;
        photo_url?: string;
        photo_urls?: string[];
    };
};

type ChatState = DiaryState | EditDiaryState | FoodState | EditProductState;

const assessmentAliases: Record<string, 'positive' | 'neutral' | 'negative'> = {
    positive: 'positive',
    neutral: 'neutral',
    negative: 'negative',
    'положительный': 'positive',
    'плюс': 'positive',
    'средний': 'neutral',
    'нейтральный': 'neutral',
    'отрицательный': 'negative',
    'минус': 'negative'
};

const formatDate = (date: Date) => {
    const tzOffsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffsetMs).toISOString().split('T')[0];
};
const formatTime = (date: Date) => date.toTimeString().slice(0, 5);

const getBackendBaseUrl = () => {
    const raw = process.env.TELEGRAM_BACKEND_URL || 'http://localhost:5000/api';
    return raw.replace(/\/api\/?$/, '');
};

const isLocalPhotoUrl = (url: string) => {
    return url.startsWith('http://localhost')
        || url.startsWith('http://127.0.0.1')
        || url.startsWith('http://backend:');
};

const normalizePhotoFetchUrl = (url: string) => {
    if (!url.startsWith('http')) return url;
    const backendBaseUrl = getBackendBaseUrl();
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
        return url.replace(/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, backendBaseUrl);
    }
    return url;
};

const assessmentKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: '✅ Положительный', callback_data: 'food:assessment:positive' },
                { text: '➖ Средний', callback_data: 'food:assessment:neutral' },
                { text: '❌ Отрицательный', callback_data: 'food:assessment:negative' }
            ]
        ]
    }
};

const editAssessmentKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: '✅ Положительный', callback_data: 'product:assessment:positive' },
                { text: '➖ Средний', callback_data: 'product:assessment:neutral' },
                { text: '❌ Отрицательный', callback_data: 'product:assessment:negative' }
            ],
            [{ text: 'Оставить как есть ⏭️', callback_data: 'product:assessment:skip' }]
        ]
    }
};

const skipKeyboard = {
    reply_markup: {
        inline_keyboard: [[{ text: 'Пропустить ⏭️', callback_data: 'food:skip' }]]
    }
};

const diaryPhotosKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: 'Готово ✅', callback_data: 'diary:photo:done' },
                { text: 'Пропустить ⏭️', callback_data: 'diary:photo:skip' }
            ]
        ]
    }
};

const addProductPhotosKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: 'Готово ✅', callback_data: 'food:photo:done' },
                { text: 'Пропустить ⏭️', callback_data: 'food:photo:skip' }
            ]
        ]
    }
};

const editProductPhotosKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: 'Готово ✅', callback_data: 'product:photo:done' },
                { text: 'Пропустить ⏭️', callback_data: 'product:photo:skip' }
            ]
        ]
    }
};

const timezoneLocationKeyboard = {
    reply_markup: {
        keyboard: [
            [{ text: '📍 Отправить геолокацию', request_location: true }],
            [{ text: '❌ Отмена' }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
    }
};

const moodKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: '😢', callback_data: 'diary:mood:1' },
                { text: '😐', callback_data: 'diary:mood:2' },
                { text: '😊', callback_data: 'diary:mood:3' },
                { text: '😍', callback_data: 'diary:mood:4' },
                { text: '🤩', callback_data: 'diary:mood:5' }
            ],
            [{ text: 'Без настроения ⏭️', callback_data: 'diary:mood:skip' }]
        ]
    }
};

const buildFoodPayload = (data: FoodState['data']) => {
    const payload: Record<string, any> = {
        name: data.name || '',
        assessment: data.assessment || 'neutral'
    };

    if (data.pros) payload.pros = data.pros;
    if (data.cons) payload.cons = data.cons;
    if (data.description) payload.notes = data.description;
    if (data.photo_url) payload.photo_url = data.photo_url;
    if (data.photo_urls && data.photo_urls.length) payload.photo_urls = data.photo_urls;

    return payload;
};

const getLargestPhotoId = (photos: TelegramBot.PhotoSize[] = []) => {
    if (!photos.length) return null;
    return photos[photos.length - 1].file_id;
};

const mainMenuKeyboard = {
    reply_markup: {
        keyboard: [
            [{ text: '📝 Добавить запись' }, { text: '📒 Записи за сегодня' }],
            [{ text: '🗂️ Последние записи' }, { text: '🥗 Добавить продукт' }],
            [{ text: '🧺 Список продуктов' }, { text: '✏️ Изменить запись' }],
            [{ text: '🛠️ Изменить продукт' }, { text: 'ℹ️ Помощь' }],
            [{ text: '❌ Отмена' }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    }
};

const renderDiaryEntryText = (entry: any) => {
    const moodEmojis: Record<number, string> = {
        1: '😢',
        2: '😐',
        3: '🙂',
        4: '😍',
        5: '🤩'
    };
    const mood = entry.mood ? ` · ${moodEmojis[entry.mood] || '🙂'}` : '';
    return `📓 ${entry.date} ${entry.time}${mood}\n${entry.text}`;
};

const renderProductText = (product: any) => {
    const assessmentLabels: Record<string, string> = {
        positive: '✅ Положительный',
        neutral: '➖ Средний',
        negative: '❌ Отрицательный'
    };
    const assessment = assessmentLabels[product.assessment] || '➖ Средний';
    const parts: string[] = [`🥗 ${product.name} (${assessment})`];
    if (product.pros) parts.push(`+ ${product.pros}`);
    if (product.cons) parts.push(`- ${product.cons}`);
    if (product.notes) parts.push(`📝 ${product.notes}`);
    return parts.join('\n');
};

export class TelegramBotManager {
    private bot: TelegramBot | null = null;
    private token: string | null = null;
    private allowedUserId: number | null = null;
    private timezoneOffsetMinutes: number | null = null;
    private timezoneIana: string | null = null;
    private state = new Map<number, ChatState>();
    private watcher: fs.FSWatcher | null = null;
    private restartTimer: NodeJS.Timeout | null = null;

    async start() {
        const settings = await ensureTelegramSettings();
        if (!settings?.token) {
            console.error('Telegram bot token is missing. Set TELEGRAM_BOT_TOKEN or update settings file.');
            return;
        }

        this.allowedUserId = settings.allowedUserId ?? null;
        this.timezoneOffsetMinutes = settings.timezoneOffsetMinutes ?? null;
        this.timezoneIana = settings.timezoneIana ?? null;
        await this.startWithToken(settings.token);
        this.watchSettings();
    }

    private async startWithToken(token: string) {
        if (this.token === token && this.bot) return;

        await this.stop();

        this.token = token;
        this.bot = new TelegramBot(token, { polling: true });
        try {
            await this.bot.deleteWebHook();
        } catch (error) {
            console.error('Failed to delete webhook:', error);
        }

        this.bot.onText(/\/start/, (msg: Message) => {
            if (!this.isAllowed(msg.chat.id)) return;
            this.bot?.sendMessage(
                msg.chat.id,
                'Привет! Я бот My Space 👋\n\nЯ помогу вести дневник и питание.\nВыбери действие кнопками ниже — всё просто.',
                mainMenuKeyboard
            );
        });

        this.bot.onText(/\/help/, (msg: Message) => {
            if (!this.isAllowed(msg.chat.id)) return;
            this.bot?.sendMessage(
                msg.chat.id,
                'Подсказка ✨\n\nКнопки меню:\n📝 Добавить запись\n📒 Записи за сегодня\n🗂️ Последние записи\n🥗 Добавить продукт\n🧺 Список продуктов\n✏️ Изменить запись\n🛠️ Изменить продукт\n❌ Отмена\n\nМожно прикреплять фото к записям и продуктам 📸',
                mainMenuKeyboard
            );
        });

        this.bot.onText(/\/cancel/, (msg: Message) => {
            if (!this.isAllowed(msg.chat.id)) return;
            this.state.delete(msg.chat.id);
            this.bot?.sendMessage(msg.chat.id, 'Ок, отменил ✅ Что дальше?', mainMenuKeyboard);
        });

        this.bot.onText(/\/add_diary/, (msg: Message) => {
            if (!this.isAllowed(msg.chat.id)) return;
            this.state.set(msg.chat.id, { flow: 'add_diary', step: 'text', data: {} });
            this.bot?.sendMessage(msg.chat.id, 'Напиши текст записи ✍️\nМожно просто одной фразой.');
        });

        this.bot.onText(/\/diary_today/, async (msg: Message) => {
            if (!this.isAllowed(msg.chat.id)) return;
            const today = this.getLocalDateTime().date;
            await this.sendDiaryEntries(msg, today);
        });

        this.bot.onText(/\/diary_all(?:\\s+(\\d+))?/, async (msg: Message, match) => {
            const limit = match?.[1] ? Math.min(Math.max(parseInt(match[1], 10), 1), 20) : 5;
            await this.sendDiaryEntries(msg, undefined, limit);
        });

        this.bot.onText(/\/add_food/, (msg: Message) => {
            if (!this.isAllowed(msg.chat.id)) return;
            this.state.set(msg.chat.id, { flow: 'add_food', step: 'name', data: {} });
            this.bot?.sendMessage(msg.chat.id, 'Название продукта? 🥗');
        });

        this.bot.onText(/\/products/, async (msg: Message) => {
            if (!this.isAllowed(msg.chat.id)) return;
            await this.sendProductsList(msg);
        });

        this.bot.onText(/\/edit_diary/, async (msg: Message) => {
            if (!this.isAllowed(msg.chat.id)) return;
            await this.sendDiaryEditList(msg);
        });

        this.bot.onText(/\/edit_product/, async (msg: Message) => {
            if (!this.isAllowed(msg.chat.id)) return;
            await this.sendProductEditList(msg);
        });

        this.bot.onText(/\/timezone/, async (msg: Message) => {
            if (!this.isAllowed(msg.chat.id)) return;
            await this.bot?.sendMessage(
                msg.chat.id,
                'Отправь геолокацию, чтобы я сам определил часовой пояс. 📍',
                timezoneLocationKeyboard
            );
        });

        this.bot.on('callback_query', async (query) => {
            const message = query.message;
            if (!message || !query.data) return;
            const chatId = message.chat.id;
            if (!this.isAllowed(chatId)) return;
            const state = this.state.get(chatId);
            if (!state) {
                try {
                    await this.bot?.answerCallbackQuery(query.id);
                } catch (error) {
                    console.error('Callback ответ не доставлен:', error);
                }
                return;
            }

            if (state.flow === 'add_food') {
                if (query.data.startsWith('food:assessment:') && state.step === 'assessment') {
                    const assessment = query.data.split(':')[2] as 'positive' | 'neutral' | 'negative';
                    state.data.assessment = assessment;
                    state.step = 'pros';
                    await this.bot?.sendMessage(chatId, 'Плюсы продукта? Можно пропустить ⏭️', skipKeyboard);
                    try {
                        await this.bot?.answerCallbackQuery(query.id);
                    } catch (error) {
                        console.error('Callback ответ не доставлен:', error);
                    }
                    return;
                }

                if (query.data === 'food:skip') {
                    await this.handleFoodSkip(chatId, state);
                    try {
                        await this.bot?.answerCallbackQuery(query.id);
                    } catch (error) {
                        console.error('Callback ответ не доставлен:', error);
                    }
                    return;
                }
            }

            if (state.flow === 'edit_diary') {
                if (query.data.startsWith('diary:edit:') && state.step === 'choose') {
                    const id = Number.parseInt(query.data.split(':')[2], 10);
                    await this.prepareDiaryEdit(chatId, id);
                    try {
                        await this.bot?.answerCallbackQuery(query.id);
                    } catch (error) {
                        console.error('Callback ответ не доставлен:', error);
                    }
                    return;
                }
            }

            if (state.flow === 'add_diary' && state.step === 'mood') {
                if (query.data === 'diary:mood:skip') {
                    state.data = state.data || {};
                    state.data.mood = undefined;
                    state.step = 'photos';
                    await this.bot?.sendMessage(chatId, 'Добавить фото к записи? 📸 (до 3)', diaryPhotosKeyboard);
                    try {
                        await this.bot?.answerCallbackQuery(query.id);
                    } catch (error) {
                        console.error('Callback ответ не доставлен:', error);
                    }
                    return;
                }

                if (query.data.startsWith('diary:mood:')) {
                    const moodRaw = query.data.split(':')[2];
                    const mood = Number.parseInt(moodRaw, 10);
                    if (Number.isFinite(mood)) {
                        state.data = state.data || {};
                        state.data.mood = mood;
                    }
                    state.step = 'photos';
                    await this.bot?.sendMessage(chatId, 'Добавить фото к записи? 📸 (до 3)', diaryPhotosKeyboard);
                    try {
                        await this.bot?.answerCallbackQuery(query.id);
                    } catch (error) {
                        console.error('Callback ответ не доставлен:', error);
                    }
                    return;
                }
            }

            if (state.flow === 'edit_diary' && state.step === 'mood') {
                if (query.data === 'diary:mood:skip') {
                    state.data = state.data || {};
                    state.data.mood = state.data.originalMood;
                    await this.finalizeDiaryEdit(chatId, state);
                    try {
                        await this.bot?.answerCallbackQuery(query.id);
                    } catch (error) {
                        console.error('Callback ответ не доставлен:', error);
                    }
                    return;
                }

                if (query.data.startsWith('diary:mood:')) {
                    const moodRaw = query.data.split(':')[2];
                    const mood = Number.parseInt(moodRaw, 10);
                    if (Number.isFinite(mood)) {
                        state.data = state.data || {};
                        state.data.mood = mood;
                    }
                    await this.finalizeDiaryEdit(chatId, state);
                    try {
                        await this.bot?.answerCallbackQuery(query.id);
                    } catch (error) {
                        console.error('Callback ответ не доставлен:', error);
                    }
                    return;
                }
            }

            if (state.flow === 'edit_product') {
                if (query.data.startsWith('product:edit:') && state.step === 'choose') {
                    const id = Number.parseInt(query.data.split(':')[2], 10);
                    await this.prepareProductEdit(chatId, id);
                    try {
                        await this.bot?.answerCallbackQuery(query.id);
                    } catch (error) {
                        console.error('Callback ответ не доставлен:', error);
                    }
                    return;
                }

                if (query.data.startsWith('product:assessment:') && state.step === 'assessment') {
                    const key = query.data.split(':')[2];
                    if (key === 'skip') {
                        state.data.assessment = state.data.assessment || 'neutral';
                    } else {
                        state.data.assessment = key as 'positive' | 'neutral' | 'negative';
                    }
                    state.step = 'pros';
                    await this.bot?.sendMessage(chatId, 'Плюсы продукта? Можно пропустить ⏭️', skipKeyboard);
                    try {
                        await this.bot?.answerCallbackQuery(query.id);
                    } catch (error) {
                        console.error('Callback ответ не доставлен:', error);
                    }
                    return;
                }
            }

            if (state.flow === 'add_diary' && state.step === 'photos') {
                if (query.data === 'diary:photo:skip') {
                    state.data = state.data || {};
                    state.data.photo_url = undefined;
                    state.data.photo_urls = undefined;
                    await this.finalizeDiaryEntry(chatId, state);
                    try {
                        await this.bot?.answerCallbackQuery(query.id);
                    } catch (error) {
                        console.error('Callback ????? ?? ?????????:', error);
                    }
                    return;
                }

                if (query.data === 'diary:photo:done') {
                    await this.finalizeDiaryEntry(chatId, state);
                    try {
                        await this.bot?.answerCallbackQuery(query.id);
                    } catch (error) {
                        console.error('Callback ????? ?? ?????????:', error);
                    }
                    return;
                }
            }

            if (state.flow === 'add_food' && state.step === 'photos') {
                if (query.data === 'food:photo:skip') {
                    state.data.photo_url = undefined;
                    state.data.photo_urls = undefined;
                    await nutritionApi.createProduct(buildFoodPayload(state.data));
                    this.bot?.sendMessage(chatId, '??????? ???????? ??', mainMenuKeyboard);
                    this.state.delete(chatId);
                    try {
                        await this.bot?.answerCallbackQuery(query.id);
                    } catch (error) {
                        console.error('Callback ????? ?? ?????????:', error);
                    }
                    return;
                }

                if (query.data === 'food:photo:done') {
                    await nutritionApi.createProduct(buildFoodPayload(state.data));
                    this.bot?.sendMessage(chatId, '??????? ???????? ??', mainMenuKeyboard);
                    this.state.delete(chatId);
                    try {
                        await this.bot?.answerCallbackQuery(query.id);
                    } catch (error) {
                        console.error('Callback ????? ?? ?????????:', error);
                    }
                    return;
                }
            }

            if (state.flow === 'edit_product' && state.step === 'photos') {
                if (query.data === 'product:photo:skip') {
                    await this.finalizeProductEdit(chatId, state);
                    try {
                        await this.bot?.answerCallbackQuery(query.id);
                    } catch (error) {
                        console.error('Callback ????? ?? ?????????:', error);
                    }
                    return;
                }

                if (query.data === 'product:photo:done') {
                    if (!state.data.photo_urls || state.data.photo_urls.length === 0) {
                        state.data.photo_urls = undefined;
                    }
                    await this.finalizeProductEdit(chatId, state);
                    try {
                        await this.bot?.answerCallbackQuery(query.id);
                    } catch (error) {
                        console.error('Callback ????? ?? ?????????:', error);
                    }
                    return;
                }
            }

            try {
                await this.bot?.answerCallbackQuery(query.id);
            } catch (error) {
                console.error('Callback ответ не доставлен:', error);
            }
        });

        this.bot.on('message', async (msg: Message) => {
            if (!msg.text) return;
            if (!this.isAllowed(msg.chat.id)) return;
            const text = msg.text.trim();

            if (text === '📝 Добавить запись') {
                this.state.set(msg.chat.id, { flow: 'add_diary', step: 'text', data: {} });
                this.bot?.sendMessage(msg.chat.id, 'Напиши текст записи ✍️');
                return;
            }

            if (text === '📒 Записи за сегодня') {
                const today = this.getLocalDateTime().date;
                await this.sendDiaryEntries(msg, today);
                return;
            }

            if (text === '🗂️ Последние записи') {
                await this.sendDiaryEntries(msg, undefined, 5);
                return;
            }

            if (text === '🥗 Добавить продукт') {
                this.state.set(msg.chat.id, { flow: 'add_food', step: 'name', data: {} });
                this.bot?.sendMessage(msg.chat.id, 'Название продукта? 🥗');
                return;
            }

            if (text === '🧺 Список продуктов') {
                await this.sendProductsList(msg);
                return;
            }

            if (text === '✏️ Изменить запись') {
                await this.sendDiaryEditList(msg);
                return;
            }

            if (text === '🛠️ Изменить продукт') {
                await this.sendProductEditList(msg);
                return;
            }

            if (text === '❌ Отмена') {
                this.state.delete(msg.chat.id);
                this.bot?.sendMessage(msg.chat.id, 'Ок, отменил ✅ Что дальше?', mainMenuKeyboard);
                return;
            }

            if (text === 'ℹ️ Помощь') {
                this.bot?.sendMessage(
                    msg.chat.id,
                    'Подсказка ✨\n\nИспользуй кнопки меню:\n📝 Добавить запись\n📒 Записи за сегодня\n🗂️ Последние записи\n🥗 Добавить продукт\n🧺 Список продуктов\n✏️ Изменить запись\n🛠️ Изменить продукт\n❌ Отмена',
                    mainMenuKeyboard
                );
                return;
            }
        });

        this.bot.on('message', async (msg: Message) => {
            if (!msg.text && !msg.photo && !msg.location) return;
            if (!this.isAllowed(msg.chat.id)) return;
            if (msg.location) {
                await this.handleTimezoneLocation(msg);
                return;
            }
            const menuTexts = new Set([
                '📝 Добавить запись',
                '📒 Записи за сегодня',
                '🗂️ Последние записи',
                '🥗 Добавить продукт',
                '🧺 Список продуктов',
                '✏️ Изменить запись',
                '🛠️ Изменить продукт',
                '❌ Отмена',
                'ℹ️ Помощь'
            ]);
            const hasState = this.state.has(msg.chat.id);
            if (msg.text && msg.text.startsWith('/') && !(hasState && msg.text === '/skip')) return;
            if (msg.text && menuTexts.has(msg.text.trim())) return;

            const chatState = this.state.get(msg.chat.id);
            if (!chatState) return;

            try {
                if (chatState.flow === 'add_diary') {
                    await this.handleDiaryFlow(msg, chatState);
                } else if (chatState.flow === 'edit_diary') {
                    await this.handleEditDiaryFlow(msg, chatState);
                } else if (chatState.flow === 'edit_product') {
                    await this.handleEditProductFlow(msg, chatState);
                } else {
                    await this.handleFoodFlow(msg, chatState);
                }
            } catch (error) {
                console.error('Telegram bot error:', error);
                this.bot?.sendMessage(msg.chat.id, 'Ошибка. Попробуй позже.', mainMenuKeyboard);
                this.state.delete(msg.chat.id);
            }
        });

        this.bot.on('polling_error', (error: Error) => {
            console.error('Telegram polling error:', error.message);
        });

        console.log('Telegram bot started');
    }

    private async stop() {
        if (this.bot) {
            await this.bot.stopPolling();
            this.bot.removeAllListeners();
            this.bot = null;
        }
    }

    private isAllowed(chatId: number) {
        return !this.allowedUserId || chatId === this.allowedUserId;
    }

    private watchSettings() {
        const settingsPath = getSettingsPath();
        if (this.watcher) return;

        this.watcher = fs.watch(settingsPath, () => {
            if (this.restartTimer) clearTimeout(this.restartTimer);
            this.restartTimer = setTimeout(async () => {
                const settings = await readTelegramSettings();
                if (settings?.token && settings.token !== this.token) {
                    console.log('Telegram token changed. Restarting bot...');
                    await this.startWithToken(settings.token);
                }
                if (settings?.allowedUserId !== undefined) {
                    this.allowedUserId = settings.allowedUserId ?? null;
                }
                if (settings?.timezoneOffsetMinutes !== undefined) {
                    this.timezoneOffsetMinutes = settings.timezoneOffsetMinutes ?? null;
                }
                if (settings?.timezoneIana !== undefined) {
                    this.timezoneIana = settings.timezoneIana ?? null;
                }
            }, 500);
        });
    }

    private getLocalDateTime() {
        if (this.timezoneIana) {
            const now = new Date();
            const dateFormatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: this.timezoneIana,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const timeFormatter = new Intl.DateTimeFormat('en-GB', {
                timeZone: this.timezoneIana,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            return {
                date: dateFormatter.format(now),
                time: timeFormatter.format(now)
            };
        }
        if (this.timezoneOffsetMinutes === null || this.timezoneOffsetMinutes === undefined) {
            const date = new Date();
            return {
                date: formatDate(date),
                time: formatTime(date)
            };
        }
        const date = new Date(Date.now() + this.timezoneOffsetMinutes * 60000);
        return {
            date: formatDate(date),
            time: formatTime(date)
        };
    }

    private async handleTimezoneLocation(msg: Message) {
        if (!msg.location) return;
        try {
            const { latitude, longitude } = msg.location;
            const timezoneIana = tzLookup(latitude, longitude);
            const settings = await readTelegramSettings();
            const token = settings?.token || this.token;
            if (!token) {
                await this.bot?.sendMessage(msg.chat.id, 'Токен бота не найден. Сначала подключи бота в настройках.');
                return;
            }
            await writeTelegramSettings({
                token,
                allowedUserId: this.allowedUserId ?? settings?.allowedUserId,
                timezoneIana,
                timezoneCity: `lat ${latitude.toFixed(4)}, lon ${longitude.toFixed(4)}`,
                timezoneOffsetMinutes: undefined
            });
            this.timezoneIana = timezoneIana;
            this.timezoneOffsetMinutes = null;
            await this.bot?.sendMessage(
                msg.chat.id,
                `Часовой пояс обновлен: ${timezoneIana}. Теперь время будет корректным ✅`,
                mainMenuKeyboard
            );
        } catch (error) {
            console.error('Failed to update timezone from location:', error);
            await this.bot?.sendMessage(msg.chat.id, 'Не удалось определить часовой пояс. Попробуй снова позже.');
        }
    }

    private getNow() {
        if (this.timezoneOffsetMinutes === null || this.timezoneOffsetMinutes === undefined) {
            return new Date();
        }
        return new Date(Date.now() + this.timezoneOffsetMinutes * 60000);
    }

    private async handleDiaryFlow(msg: Message, state: DiaryState) {
        if (state.step === 'text') {
            state.data = state.data || {};
            state.data.text = msg.text || '';
            state.step = 'mood';
            this.bot?.sendMessage(msg.chat.id, 'Как настроение? 😊', moodKeyboard);
            return;
        }

        if (state.step === 'mood') {
            const text = (msg.text || '').trim();
            if (!text) return;
            if (text === '/skip' || text.toLowerCase() === 'skip' || text.toLowerCase() === 'пропустить') {
                state.data = state.data || {};
                state.data.mood = undefined;
                state.step = 'photos';
                this.bot?.sendMessage(msg.chat.id, 'Добавить фото к записи? 📸 (до 3)', diaryPhotosKeyboard);
                return;
            }

            const mood = Number.parseInt(text, 10);
            if (Number.isFinite(mood) && mood >= 1 && mood <= 5) {
                state.data = state.data || {};
                state.data.mood = mood;
                state.step = 'photos';
                this.bot?.sendMessage(msg.chat.id, 'Добавить фото к записи? 📸 (до 3)', diaryPhotosKeyboard);
            } else {
                this.bot?.sendMessage(msg.chat.id, 'Выбери настроение кнопкой ниже 👇', moodKeyboard);
            }
        }

        if (state.step === 'photos') {
            const text = (msg.text || '').trim();
            const isSkip = text === '/skip' || text.toLowerCase() === 'skip' || text.toLowerCase() === 'пропустить';
            const isDone = text.toLowerCase() === 'готово';
            if (isSkip) {
                state.data = state.data || {};
                state.data.photo_url = undefined;
                state.data.photo_urls = undefined;
                await this.finalizeDiaryEntry(msg.chat.id, state);
                return;
            }
            if (isDone) {
                await this.finalizeDiaryEntry(msg.chat.id, state);
                return;
            }

            const photoId = getLargestPhotoId(msg.photo);
            if (photoId) {
                state.data = state.data || {};
                if (!state.data.photo_urls) state.data.photo_urls = [];
                if (state.data.photo_urls.length >= 3) {
                    await this.finalizeDiaryEntry(msg.chat.id, state);
                    return;
                }
                const uploadedUrl = await this.uploadTelegramPhoto(photoId);
                const photoRef = uploadedUrl || photoId;
                state.data.photo_urls.push(photoRef);
                state.data.photo_url = state.data.photo_urls[0];
                if (state.data.photo_urls.length >= 3) {
                    await this.finalizeDiaryEntry(msg.chat.id, state);
                    return;
                }
                this.bot?.sendMessage(msg.chat.id, 'Фото добавлено. Можно еще (до 3) или нажми "Готово".', diaryPhotosKeyboard);
                return;
            }

            this.bot?.sendMessage(msg.chat.id, 'Пришли фото или нажми "Готово" / "Пропустить".', diaryPhotosKeyboard);
        }
    }

    private async handleEditDiaryFlow(msg: Message, state: EditDiaryState) {
        if (state.step === 'text') {
            const text = (msg.text || '').trim();
            if (text === '/skip' || text.toLowerCase() === 'skip' || text.toLowerCase() === 'пропустить') {
                state.data = state.data || {};
                state.data.text = state.data.originalText;
            } else {
                state.data = state.data || {};
                state.data.text = text;
            }
            state.step = 'mood';
            this.bot?.sendMessage(msg.chat.id, 'Обновить настроение? 😊', moodKeyboard);
            return;
        }
    }

    private async handleFoodFlow(msg: Message, state: FoodState) {
        const text = (msg.text || '').trim();
        const isSkip = text === '/skip' || text.toLowerCase() === 'skip' || text.toLowerCase() === 'пропустить';

        if (state.step === 'name') {
            state.data.name = text;
            state.step = 'assessment';
            this.bot?.sendMessage(msg.chat.id, 'Оценка продукта?', assessmentKeyboard);
            return;
        }

        if (state.step === 'assessment') {
            const normalized = text.toLowerCase();
            const assessment = assessmentAliases[normalized];
            if (!assessment) {
                this.bot?.sendMessage(msg.chat.id, 'Не понял оценку 🤔 Нажми кнопку ниже или напиши: положительный / средний / отрицательный', assessmentKeyboard);
                return;
            }
            state.data.assessment = assessment;
            state.step = 'pros';
            this.bot?.sendMessage(msg.chat.id, 'Плюсы продукта? Можно пропустить ⏭️', skipKeyboard);
            return;
        }

        if (state.step === 'pros') {
            state.data.pros = isSkip ? undefined : text;
            state.step = 'cons';
            this.bot?.sendMessage(msg.chat.id, 'Минусы продукта? Можно пропустить ⏭️', skipKeyboard);
            return;
        }

        if (state.step === 'cons') {
            state.data.cons = isSkip ? undefined : text;
            state.step = 'description';
            this.bot?.sendMessage(msg.chat.id, 'Описание продукта? Можно пропустить ⏭️', skipKeyboard);
            return;
        }

        if (state.step === 'description') {
            state.data.description = isSkip ? undefined : text;
            state.step = 'photos';
            this.bot?.sendMessage(msg.chat.id, 'Добавить фото к продукту? 📸 (до 3)', addProductPhotosKeyboard);
            return;
        }

        if (state.step === 'photos') {
            const textValue = (msg.text || '').trim();
            const skip = textValue === '/skip' || textValue.toLowerCase() === 'skip' || textValue.toLowerCase() === '??????????';
            const done = textValue.toLowerCase() === '??????';
            if (skip) {
                state.data.photo_url = undefined;
                state.data.photo_urls = undefined;
                await nutritionApi.createProduct(buildFoodPayload(state.data));
                this.bot?.sendMessage(msg.chat.id, '??????? ???????? ??', mainMenuKeyboard);
                this.state.delete(msg.chat.id);
                return;
            }
            if (done) {
                await nutritionApi.createProduct(buildFoodPayload(state.data));
                this.bot?.sendMessage(msg.chat.id, '??????? ???????? ??', mainMenuKeyboard);
                this.state.delete(msg.chat.id);
                return;
            }

            const photoId = getLargestPhotoId(msg.photo);
            if (photoId) {
                if (!state.data.photo_urls) state.data.photo_urls = [];
                if (state.data.photo_urls.length >= 3) {
                    await nutritionApi.createProduct(buildFoodPayload(state.data));
                    this.bot?.sendMessage(msg.chat.id, '??????? ???????? ??', mainMenuKeyboard);
                    this.state.delete(msg.chat.id);
                    return;
                }
                const uploadedUrl = await this.uploadTelegramPhoto(photoId);
                const photoRef = uploadedUrl || photoId;
                state.data.photo_urls.push(photoRef);
                state.data.photo_url = state.data.photo_urls[0];
                if (state.data.photo_urls.length >= 3) {
                    await nutritionApi.createProduct(buildFoodPayload(state.data));
                    this.bot?.sendMessage(msg.chat.id, '??????? ???????? ??', mainMenuKeyboard);
                    this.state.delete(msg.chat.id);
                    return;
                }
                this.bot?.sendMessage(msg.chat.id, '???? ?????????. ????? ??? (?? 3) ??? ????? "??????".', addProductPhotosKeyboard);
                return;
            }

            this.bot?.sendMessage(msg.chat.id, '?????? ???? ??? ????? "??????" / "??????????".', addProductPhotosKeyboard);
        }
    }

    private async handleEditProductFlow(msg: Message, state: EditProductState) {
        const text = (msg.text || '').trim();
        const isSkip = text === '/skip' || text.toLowerCase() === 'skip' || text.toLowerCase() === 'пропустить';

        if (state.step === 'name') {
            state.data.name = isSkip ? state.data.name : text;
            state.step = 'assessment';
            this.bot?.sendMessage(msg.chat.id, 'Оценка продукта?', editAssessmentKeyboard);
            return;
        }

        if (state.step === 'assessment') {
            const normalized = text.toLowerCase();
            const assessment = assessmentAliases[normalized];
            if (assessment) {
                state.data.assessment = assessment;
                state.step = 'pros';
                this.bot?.sendMessage(msg.chat.id, 'Плюсы продукта? Можно пропустить ⏭️', skipKeyboard);
            } else if (isSkip) {
                state.step = 'pros';
                this.bot?.sendMessage(msg.chat.id, 'Плюсы продукта? Можно пропустить ⏭️', skipKeyboard);
            } else {
                this.bot?.sendMessage(msg.chat.id, 'Не понял оценку 🤔 Нажми кнопку ниже или напиши: положительный / средний / отрицательный', editAssessmentKeyboard);
            }
            return;
        }

        if (state.step === 'pros') {
            state.data.pros = isSkip ? state.data.pros : text;
            state.step = 'cons';
            this.bot?.sendMessage(msg.chat.id, 'Минусы продукта? Можно пропустить ⏭️', skipKeyboard);
            return;
        }

        if (state.step === 'cons') {
            state.data.cons = isSkip ? state.data.cons : text;
            state.step = 'description';
            this.bot?.sendMessage(msg.chat.id, 'Описание продукта? Можно пропустить ⏭️', skipKeyboard);
            return;
        }

        if (state.step === 'description') {
            state.data.description = isSkip ? state.data.description : text;
            state.step = 'photos';
            this.bot?.sendMessage(msg.chat.id, 'Обновить фото продукта? 📸', editProductPhotosKeyboard);
            return;
        }

        if (state.step === 'photos') {
            const textValue = (msg.text || '').trim();
            const skipPhoto = textValue === '/skip' || textValue.toLowerCase() === 'skip' || textValue.toLowerCase() === 'пропустить';
            const done = textValue.toLowerCase() === 'готово';
            if (skipPhoto) {
                await this.finalizeProductEdit(msg.chat.id, state);
                return;
            }
            if (done) {
                if (!state.data.photo_urls || state.data.photo_urls.length === 0) {
                    state.data.photo_urls = undefined;
                }
                await this.finalizeProductEdit(msg.chat.id, state);
                return;
            }
            const photoId = getLargestPhotoId(msg.photo);
            if (photoId) {
                if (!state.data.photo_urls) {
                    state.data.photo_urls = [];
                    state.data.photo_url = undefined;
                }
                if (state.data.photo_urls.length >= 3) {
                    await this.finalizeProductEdit(msg.chat.id, state);
                    return;
                }
                const uploadedUrl = await this.uploadTelegramPhoto(photoId);
                const photoRef = uploadedUrl || photoId;
                state.data.photo_urls.push(photoRef);
                state.data.photo_url = state.data.photo_urls[0];
                if (state.data.photo_urls.length >= 3) {
                    await this.finalizeProductEdit(msg.chat.id, state);
                    return;
                }
                this.bot?.sendMessage(msg.chat.id, 'Фото добавлено. Можно еще (до 3) или нажми "Готово".', editProductPhotosKeyboard);
                return;
            }
            this.bot?.sendMessage(msg.chat.id, 'Пришли фото или нажми "Готово" / "Пропустить".', editProductPhotosKeyboard);
        }
    }

    private async uploadTelegramPhoto(fileId: string): Promise<string | null> {
        if (!this.bot) return null;
        try {
            const fileLink = await this.bot.getFileLink(fileId);
            const response = await fetch(fileLink);
            if (!response.ok) return null;
            const contentType = response.headers.get('content-type') || 'image/jpeg';
            const arrayBuffer = await response.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: contentType });
            const formData = new FormData();
            formData.append('file', blob, 'photo.jpg');

            const uploadsUrl = `${getBackendBaseUrl()}/uploads`;
            const uploadResponse = await fetch(uploadsUrl, {
                method: 'POST',
                body: formData
            });
            if (!uploadResponse.ok) return null;
            const data = await uploadResponse.json();
            return data?.url || null;
        } catch (error) {
            console.error('Failed to upload telegram photo:', error);
            return null;
        }
    }

    private async sendPhotoSafe(chatId: number, photoUrl: string, caption: string) {
        if (!this.bot) return;
        try {
            if (!photoUrl.startsWith('http')) {
                await this.bot.sendPhoto(chatId, photoUrl, { caption });
                return;
            }

            if (isLocalPhotoUrl(photoUrl)) {
                const fetchUrl = normalizePhotoFetchUrl(photoUrl);
                const response = await fetch(fetchUrl);
                if (!response.ok) throw new Error(`Photo fetch failed: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                await this.bot.sendPhoto(chatId, buffer, { caption }, { filename: 'photo.jpg' });
                return;
            }

            await this.bot.sendPhoto(chatId, photoUrl, { caption });
        } catch (error) {
            console.error('Failed to send photo:', error);
            await this.bot.sendMessage(chatId, caption);
        }
    }

private async handleFoodSkip(chatId: number, state: FoodState) {
        if (state.step === 'pros') {
            state.data.pros = undefined;
            state.step = 'cons';
            await this.bot?.sendMessage(chatId, 'Минусы продукта? Можно пропустить ⏭️', skipKeyboard);
            return;
        }

        if (state.step === 'cons') {
            state.data.cons = undefined;
            state.step = 'description';
            await this.bot?.sendMessage(chatId, 'Описание продукта? Можно пропустить ⏭️', skipKeyboard);
            return;
        }

        if (state.step === 'description') {
            state.data.description = undefined;
            await nutritionApi.createProduct(buildFoodPayload(state.data));
            await this.bot?.sendMessage(chatId, 'Продукт добавлен 🥳', mainMenuKeyboard);
            this.state.delete(chatId);
        }
    }

    private async sendDiaryEntries(msg: Message, date?: string, limit?: number) {
        try {
            const entries = await diaryApi.getEntries(date);
            const list = limit ? entries.slice(0, limit) : entries;
            if (!list.length) {
                this.bot?.sendMessage(msg.chat.id, 'Записей пока нет 📭', mainMenuKeyboard);
                return;
            }
            for (const entry of list) {
                const text = renderDiaryEntryText(entry);
                const photoUrls = Array.isArray(entry.photo_urls) && entry.photo_urls.length
                    ? entry.photo_urls
                    : entry.photo_url
                        ? [entry.photo_url]
                        : [];
                if (photoUrls.length) {
                    const limited = photoUrls.slice(0, 3);
                    for (let i = 0; i < limited.length; i += 1) {
                        const caption = i === 0 ? text : '';
                        await this.sendPhotoSafe(msg.chat.id, limited[i], caption);
                    }
                } else {
                    await this.bot?.sendMessage(msg.chat.id, text);
                }
            }
            this.bot?.sendMessage(msg.chat.id, 'Готово ✅', mainMenuKeyboard);
        } catch (error) {
            console.error('Failed to fetch diary entries:', error);
            this.bot?.sendMessage(msg.chat.id, 'Не удалось получить записи 😔', mainMenuKeyboard);
        }
    }

    private async finalizeDiaryEntry(chatId: number, state: DiaryState) {
        const local = this.getLocalDateTime();
        const text = state.data?.text || '';
        const payload: Record<string, any> = {
            date: local.date,
            time: local.time,
            text
        };
        if (state.data?.mood) payload.mood = state.data.mood;
        if (state.data?.photo_url) payload.photo_url = state.data.photo_url;
        if (state.data?.photo_urls && state.data.photo_urls.length) {
            payload.photo_urls = state.data.photo_urls;
            payload.photo_url = state.data.photo_urls[0];
        }

        await diaryApi.createEntry(payload);
        this.bot?.sendMessage(chatId, 'Запись добавлена ✅', mainMenuKeyboard);
        this.state.delete(chatId);
    }

    private async finalizeDiaryEdit(chatId: number, state: EditDiaryState) {
        if (!state.data?.id) {
            this.bot?.sendMessage(chatId, 'Не удалось обновить запись 😔', mainMenuKeyboard);
            this.state.delete(chatId);
            return;
        }
        const payload: Record<string, any> = {};
        if (state.data.text) payload.text = state.data.text;
        if (state.data.mood) payload.mood = state.data.mood;
        await diaryApi.updateEntry(state.data.id, payload);
        this.bot?.sendMessage(chatId, 'Запись обновлена ✅', mainMenuKeyboard);
        this.state.delete(chatId);
    }

    private async finalizeProductEdit(chatId: number, state: EditProductState) {
        if (!state.data.id) {
            this.bot?.sendMessage(chatId, 'Не удалось обновить продукт 😔', mainMenuKeyboard);
            this.state.delete(chatId);
            return;
        }
        const payload: Record<string, any> = {};
        if (state.data.name) payload.name = state.data.name;
        if (state.data.assessment) payload.assessment = state.data.assessment;
        if (state.data.pros !== undefined) payload.pros = state.data.pros;
        if (state.data.cons !== undefined) payload.cons = state.data.cons;
        if (state.data.description !== undefined) payload.notes = state.data.description;
        if (state.data.photo_url !== undefined) payload.photo_url = state.data.photo_url;
        await nutritionApi.updateProduct(state.data.id, payload);
        this.bot?.sendMessage(chatId, 'Продукт обновлён ✅', mainMenuKeyboard);
        this.state.delete(chatId);
    }

    private async sendDiaryEditList(msg: Message, limit = 5) {
        try {
            const entries = await diaryApi.getEntries();
            const list = entries.slice(0, limit);
            if (!list.length) {
                this.bot?.sendMessage(msg.chat.id, 'Записей пока нет 📭', mainMenuKeyboard);
                return;
            }
            const buttons = list.map((entry: any) => ([
                { text: `${entry.date} ${entry.time}`, callback_data: `diary:edit:${entry.id}` }
            ]));
            this.state.set(msg.chat.id, { flow: 'edit_diary', step: 'choose', data: {} });
            this.bot?.sendMessage(msg.chat.id, 'Какую запись изменить?', {
                reply_markup: { inline_keyboard: buttons }
            });
        } catch (error) {
            console.error('Failed to fetch diary entries:', error);
            this.bot?.sendMessage(msg.chat.id, 'Не удалось получить список записей 😔', mainMenuKeyboard);
        }
    }

    private async sendProductEditList(msg: Message, limit = 5) {
        try {
            const products = await nutritionApi.getProducts();
            const list = products.slice(0, limit);
            if (!list.length) {
                this.bot?.sendMessage(msg.chat.id, 'Продуктов пока нет 🧺', mainMenuKeyboard);
                return;
            }
            const buttons = list.map((product: any) => ([
                { text: product.name, callback_data: `product:edit:${product.id}` }
            ]));
            this.state.set(msg.chat.id, { flow: 'edit_product', step: 'choose', data: {} });
            this.bot?.sendMessage(msg.chat.id, 'Какой продукт изменить?', {
                reply_markup: { inline_keyboard: buttons }
            });
        } catch (error) {
            console.error('Failed to fetch products:', error);
            this.bot?.sendMessage(msg.chat.id, 'Не удалось получить список продуктов 😔', mainMenuKeyboard);
        }
    }

    private async prepareDiaryEdit(chatId: number, id: number) {
        try {
            const entries = await diaryApi.getEntries();
            const entry = entries.find((item: any) => item.id === id);
            if (!entry) {
                this.bot?.sendMessage(chatId, 'Не удалось найти запись 😔', mainMenuKeyboard);
                return;
            }
            this.state.set(chatId, {
                flow: 'edit_diary',
                step: 'text',
                data: {
                    id,
                    originalText: entry.text,
                    originalMood: entry.mood
                }
            });
            this.bot?.sendMessage(chatId, `Новый текст записи? (можно /skip)\n\nТекущий: ${entry.text}`);
        } catch (error) {
            console.error('Failed to prepare diary edit:', error);
            this.bot?.sendMessage(chatId, 'Не удалось открыть запись 😔', mainMenuKeyboard);
        }
    }

    private async prepareProductEdit(chatId: number, id: number) {
        try {
            const products = await nutritionApi.getProducts();
            const product = products.find((item: any) => item.id === id);
            if (!product) {
                this.bot?.sendMessage(chatId, 'Не удалось найти продукт 😔', mainMenuKeyboard);
                return;
            }
            this.state.set(chatId, {
                flow: 'edit_product',
                step: 'name',
                data: {
                    id,
                    name: product.name,
                    assessment: product.assessment,
                    pros: product.pros,
                    cons: product.cons,
                    description: product.notes,
                    photo_url: product.photo_url
                }
            });
            this.bot?.sendMessage(chatId, `Новое название продукта? (можно /skip)\n\nТекущее: ${product.name}`);
        } catch (error) {
            console.error('Failed to prepare product edit:', error);
            this.bot?.sendMessage(chatId, 'Не удалось открыть продукт 😔', mainMenuKeyboard);
        }
    }
    private async sendProductsList(msg: Message, limit = 5) {
        try {
            const products = await nutritionApi.getProducts();
            const list = products.slice(0, limit);
            if (!list.length) {
                this.bot?.sendMessage(msg.chat.id, 'Продуктов пока нет 🧺', mainMenuKeyboard);
                return;
            }
            for (const product of list) {
                const text = renderProductText(product);
                const photoUrls = Array.isArray(product.photo_urls) && product.photo_urls.length
                    ? product.photo_urls
                    : product.photo_url
                        ? [product.photo_url]
                        : [];
                if (photoUrls.length) {
                    const limited = photoUrls.slice(0, 3);
                    for (let i = 0; i < limited.length; i += 1) {
                        const caption = i === 0 ? text : '';
                        await this.sendPhotoSafe(msg.chat.id, limited[i], caption);
                    }
                } else {
                    await this.bot?.sendMessage(msg.chat.id, text);
                }
            }
            this.bot?.sendMessage(msg.chat.id, 'Вот список ✅', mainMenuKeyboard);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            this.bot?.sendMessage(msg.chat.id, 'Не удалось получить список продуктов 😔', mainMenuKeyboard);
        }
    }
}
