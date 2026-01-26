import { Request, Response } from 'express';
import { Pool } from 'pg';
import { DiaryEntry, CreateDiaryRequest } from '../models/Diary';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const getEntries = async (req: Request, res: Response) => {
    try {
        const { date } = req.query;
        let query = 'SELECT * FROM diary_entries ORDER BY date DESC, created_at DESC';
        let params: any[] = [];

        if (date) {
            query = 'SELECT * FROM diary_entries WHERE date = $1 ORDER BY created_at DESC';
            params = [date];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching diary entries:', error);
        res.status(500).json({ error: 'Failed to fetch diary entries' });
    }
};

export const createEntry = async (req: Request, res: Response) => {
    try {
        const { date, text, mood }: CreateDiaryRequest = req.body;

        const result = await pool.query(
            'INSERT INTO diary_entries (date, text, mood) VALUES ($1, $2, $3) RETURNING *',
            [date, text, mood || null]
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
        const { text, mood } = req.body;

        const result = await pool.query(
            'UPDATE diary_entries SET text = COALESCE($1, text), mood = COALESCE($2, mood), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [text, mood || null, id]
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

        const result = await pool.query(
            'DELETE FROM diary_entries WHERE id = $1 RETURNING *',
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