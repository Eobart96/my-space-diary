import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const router = express.Router();

const uploadsDir = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || '';
        cb(null, `${randomUUID()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 8 * 1024 * 1024
    }
});

router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
    }

    const forwardedHost = req.get('x-forwarded-host');
    const forwardedProto = req.get('x-forwarded-proto');
    const publicBaseUrl = process.env.PUBLIC_BASE_URL?.replace(/\/$/, '');
    const host = forwardedHost
        ? `${forwardedProto || req.protocol}://${forwardedHost}`
        : `${req.protocol}://${req.get('host')}`;
    const baseUrl = publicBaseUrl || host;
    const url = `${baseUrl}/uploads/${req.file.filename}`;
    res.json({ url });
});

export default router;
