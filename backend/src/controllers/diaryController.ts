import { Request, Response } from 'express';
import { Pool } from 'pg';
import { CreateDiaryRequest } from '../models/Diary';

const getPool = (req: Request): Pool => (req as any).pool as Pool;

export const getEntries = async (req: Request, res: Response) => {
    try {
        const { date } = req.query;

        let query = `
            SELECT
                id,
                user_id,
                to_char(date, 'YYYY-MM-DD') AS date,
                time,
                text,
                mood,
                photo_url,
                photo_urls,
                created_at,
                updated_at
            FROM diary_entries
            ORDER BY date DESC, time DESC, created_at DESC
        `;
        let params: any[] = [];

        if (date) {
            query = `
                SELECT
                    id,
                    user_id,
                    to_char(date, 'YYYY-MM-DD') AS date,
                    time,
                    text,
                    mood,
                    photo_url,
                    photo_urls,
                    created_at,
                    updated_at
                FROM diary_entries
                WHERE date = $1
                ORDER BY time DESC, created_at DESC
            `;
            params = [date];
        }

        const result = await getPool(req).query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching diary entries:', error);
        res.status(500).json({ error: 'Failed to fetch diary entries' });
    }
};

export const createEntry = async (req: Request, res: Response) => {
    try {
        const { date, time, text, mood, photo_url, photo_urls }: CreateDiaryRequest = req.body;
        const normalizedPhotoUrls = Array.isArray(photo_urls)
            ? photo_urls
            : photo_url
                ? [photo_url]
                : null;

        const result = await getPool(req).query(
            `
                INSERT INTO diary_entries (date, time, text, mood, photo_url, photo_urls)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING
                    id,
                    user_id,
                    to_char(date, 'YYYY-MM-DD') AS date,
                    time,
                    text,
                    mood,
                    photo_url,
                    photo_urls,
                    created_at,
                    updated_at
            `,
            [date, time, text, mood ?? null, photo_url ?? null, normalizedPhotoUrls]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating diary entry:', error);
        res.status(500).json({ error: 'Failed to create diary entry' });
    }
};

export const updateEntry = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { date, time, text, mood, photo_url, photo_urls } = req.body;
        const normalizedPhotoUrls = Array.isArray(photo_urls)
            ? photo_urls
            : photo_url
                ? [photo_url]
                : null;

        const result = await getPool(req).query(
            `
                UPDATE diary_entries
                SET
                    date = COALESCE($1, date),
                    time = COALESCE($2, time),
                    text = COALESCE($3, text),
                    mood = COALESCE($4, mood),
                    photo_url = COALESCE($5, photo_url),
                    photo_urls = COALESCE($6, photo_urls),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $7
                RETURNING
                    id,
                    user_id,
                    to_char(date, 'YYYY-MM-DD') AS date,
                    time,
                    text,
                    mood,
                    photo_url,
                    photo_urls,
                    created_at,
                    updated_at
            `,
            [date ?? null, time ?? null, text ?? null, mood ?? null, photo_url ?? null, normalizedPhotoUrls, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Diary entry not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating diary entry:', error);
        res.status(500).json({ error: 'Failed to update diary entry' });
    }
};

export const deleteEntry = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await getPool(req).query(
            `
                DELETE FROM diary_entries
                WHERE id = $1
                RETURNING
                    id,
                    user_id,
                    to_char(date, 'YYYY-MM-DD') AS date,
                    time,
                    text,
                    mood,
                    photo_url,
                    photo_urls,
                    created_at,
                    updated_at
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Diary entry not found' });
        }

        res.json({ message: 'Diary entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting diary entry:', error);
        res.status(500).json({ error: 'Failed to delete diary entry' });
    }
};
