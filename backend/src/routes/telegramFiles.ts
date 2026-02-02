import express from 'express';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

const router = express.Router();

const getTelegramToken = () => {
    if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN;
    const settingsPath = path.resolve(process.cwd(), 'data', 'telegram-settings.json');
    if (!fs.existsSync(settingsPath)) return null;
    try {
        const raw = fs.readFileSync(settingsPath, 'utf-8');
        const data = JSON.parse(raw) as { token?: string };
        return data.token || null;
    } catch {
        return null;
    }
};

router.get('/', async (req, res) => {
    const fileId = typeof req.query.file_id === 'string' ? req.query.file_id : '';
    if (!fileId) {
        return res.status(400).json({ error: 'file_id is required' });
    }

    const token = getTelegramToken();
    if (!token) {
        return res.status(500).json({ error: 'Telegram token is missing' });
    }

    try {
        const infoResponse = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`);
        if (!infoResponse.ok) {
            const text = await infoResponse.text();
            return res.status(infoResponse.status).json({ error: text || 'Failed to fetch telegram file info' });
        }
        const info = await infoResponse.json() as { ok: boolean; result?: { file_path?: string } };
        const filePath = info.result?.file_path;
        if (!filePath) {
            return res.status(404).json({ error: 'Telegram file not found' });
        }

        const fileResponse = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
        if (!fileResponse.ok || !fileResponse.body) {
            const text = await fileResponse.text();
            return res.status(fileResponse.status).json({ error: text || 'Failed to download telegram file' });
        }

        res.setHeader('Content-Type', fileResponse.headers.get('content-type') || 'application/octet-stream');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        Readable.fromWeb(fileResponse.body as any).pipe(res);
    } catch (error) {
        console.error('Telegram file proxy error:', error);
        res.status(500).json({ error: 'Failed to proxy telegram file' });
    }
});

export default router;
