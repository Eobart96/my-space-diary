import fs from 'fs';
import path from 'path';

export interface TelegramSettings {
    token: string;
    allowedUserId?: number;
    timezoneOffsetMinutes?: number;
    timezoneCity?: string;
    timezoneIana?: string;
}

const defaultSettingsPath = path.resolve(process.cwd(), 'data', 'telegram-settings.json');

export const getSettingsPath = () => {
    return process.env.TELEGRAM_SETTINGS_PATH || defaultSettingsPath;
};

export const readTelegramSettings = async (): Promise<TelegramSettings | null> => {
    const settingsPath = getSettingsPath();
    try {
        const raw = await fs.promises.readFile(settingsPath, 'utf-8');
        const parsed = JSON.parse(raw) as TelegramSettings;
        if (!parsed?.token) return null;
        return parsed;
    } catch (error) {
        return null;
    }
};

export const writeTelegramSettings = async (settings: TelegramSettings): Promise<void> => {
    const settingsPath = getSettingsPath();
    await fs.promises.mkdir(path.dirname(settingsPath), { recursive: true });
    await fs.promises.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
};

export const ensureTelegramSettings = async (): Promise<TelegramSettings | null> => {
    const existing = await readTelegramSettings();
    if (existing?.token) return existing;

    const tokenFromEnv = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const allowedUserIdRaw = process.env.TELEGRAM_ALLOWED_USER_ID?.trim();
    const allowedUserId = allowedUserIdRaw ? Number.parseInt(allowedUserIdRaw, 10) : undefined;
    const tzOffsetRaw = process.env.TELEGRAM_TIMEZONE_OFFSET?.trim();
    const timezoneOffsetMinutes = tzOffsetRaw ? Number.parseInt(tzOffsetRaw, 10) : undefined;
    const timezoneCity = process.env.TELEGRAM_TIMEZONE_CITY?.trim();
    const timezoneIana = process.env.TELEGRAM_TIMEZONE?.trim();
    if (!tokenFromEnv) {
        return null;
    }

    const settings = {
        token: tokenFromEnv,
        allowedUserId: Number.isFinite(allowedUserId) ? allowedUserId : undefined,
        timezoneOffsetMinutes: Number.isFinite(timezoneOffsetMinutes) ? timezoneOffsetMinutes : undefined,
        timezoneCity: timezoneCity || undefined,
        timezoneIana: timezoneIana || undefined
    };
    await writeTelegramSettings(settings);
    return settings;
};
