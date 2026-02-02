import express from 'express';
import { readTelegramSettings, writeTelegramSettings } from '../telegram-bot/services/settingsStore';

const router = express.Router();

const normalizeCityKey = (value: string) => {
    return value
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/[^a-z0-9а-я]+/gi, '');
};

const cityToTimezone: Record<string, string> = {
    moscow: 'Europe/Moscow',
    москва: 'Europe/Moscow',
    spb: 'Europe/Moscow',
    saintpetersburg: 'Europe/Moscow',
    stpetersburg: 'Europe/Moscow',
    санктпетербург: 'Europe/Moscow',
    петербург: 'Europe/Moscow',
    novosibirsk: 'Asia/Novosibirsk',
    новосибирск: 'Asia/Novosibirsk',
    ekaterinburg: 'Asia/Yekaterinburg',
    екатеринбург: 'Asia/Yekaterinburg',
    kazan: 'Europe/Moscow',
    казань: 'Europe/Moscow',
    samara: 'Europe/Samara',
    самара: 'Europe/Samara',
    nizhniynovgorod: 'Europe/Moscow',
    нижнийновгород: 'Europe/Moscow',
    rostovnadonu: 'Europe/Moscow',
    ростовнадону: 'Europe/Moscow',
    krasnodar: 'Europe/Moscow',
    краснодар: 'Europe/Moscow',
    omsk: 'Asia/Omsk',
    омск: 'Asia/Omsk',
    chelyabinsk: 'Asia/Yekaterinburg',
    челябинск: 'Asia/Yekaterinburg',
    ufa: 'Asia/Yekaterinburg',
    уфа: 'Asia/Yekaterinburg',
    voronezh: 'Europe/Moscow',
    воронеж: 'Europe/Moscow',
    perm: 'Asia/Yekaterinburg',
    пермь: 'Asia/Yekaterinburg',
    volgograd: 'Europe/Volgograd',
    волгоград: 'Europe/Volgograd',
    krasnoyarsk: 'Asia/Krasnoyarsk',
    красноярск: 'Asia/Krasnoyarsk',
    irkutsk: 'Asia/Irkutsk',
    иркутск: 'Asia/Irkutsk',
    vladivostok: 'Asia/Vladivostok',
    владивосток: 'Asia/Vladivostok',
    kaliningrad: 'Europe/Kaliningrad',
    калининград: 'Europe/Kaliningrad',
    khabarovsk: 'Asia/Khabarovsk',
    хабаровск: 'Asia/Khabarovsk',
    yakutsk: 'Asia/Yakutsk',
    якутск: 'Asia/Yakutsk'
};

const resolveTimezoneFromCity = (city: string) => {
    const key = normalizeCityKey(city);
    return cityToTimezone[key] || null;
};

router.get('/', async (_req, res) => {
    const settings = await readTelegramSettings();
    if (!settings) {
        return res.json({
            token: '',
            allowedUserId: null,
            timezoneOffsetMinutes: null,
            timezoneCity: '',
            timezoneIana: null
        });
    }
    return res.json({
        token: settings.token || '',
        allowedUserId: settings.allowedUserId ?? null,
        timezoneOffsetMinutes: settings.timezoneOffsetMinutes ?? null,
        timezoneCity: settings.timezoneCity || '',
        timezoneIana: settings.timezoneIana ?? null
    });
});

router.put('/', async (req, res) => {
    const { token, allowedUserId, timezoneOffsetMinutes, timezoneCity } = req.body as {
        token?: string;
        allowedUserId?: number | string | null;
        timezoneOffsetMinutes?: number | string | null;
        timezoneCity?: string | null;
    };
    const normalizedToken = typeof token === 'string' ? token.trim() : '';
    if (!normalizedToken) {
        return res.status(400).json({ error: 'Token is required' });
    }
    let normalizedAllowed: number | undefined;
    if (allowedUserId !== undefined && allowedUserId !== null && allowedUserId !== '') {
        const value = typeof allowedUserId === 'string' ? Number.parseInt(allowedUserId, 10) : allowedUserId;
        if (!Number.isFinite(value)) {
            return res.status(400).json({ error: 'allowedUserId must be a number' });
        }
        normalizedAllowed = Number(value);
    }
    let normalizedTz: number | undefined;
    if (timezoneOffsetMinutes !== undefined && timezoneOffsetMinutes !== null && timezoneOffsetMinutes !== '') {
        const value = typeof timezoneOffsetMinutes === 'string'
            ? Number.parseInt(timezoneOffsetMinutes, 10)
            : timezoneOffsetMinutes;
        if (!Number.isFinite(value)) {
            return res.status(400).json({ error: 'timezoneOffsetMinutes must be a number' });
        }
        normalizedTz = Number(value);
    }
    const normalizedCity = typeof timezoneCity === 'string' ? timezoneCity.trim() : '';
    const resolvedTimezone = normalizedCity ? resolveTimezoneFromCity(normalizedCity) : null;
    if (normalizedCity && !resolvedTimezone) {
        return res.status(400).json({ error: 'Unknown city for timezone' });
    }

    await writeTelegramSettings({
        token: normalizedToken,
        allowedUserId: normalizedAllowed,
        timezoneOffsetMinutes: normalizedTz,
        timezoneCity: normalizedCity || undefined,
        timezoneIana: resolvedTimezone || undefined
    });
    return res.json({
        token: normalizedToken,
        allowedUserId: normalizedAllowed ?? null,
        timezoneOffsetMinutes: normalizedTz ?? null,
        timezoneCity: normalizedCity || '',
        timezoneIana: resolvedTimezone ?? null
    });
});

export default router;
