import { Request, Response } from 'express';
import { Pool } from 'pg';
import {
    NutritionEntry,
    CreateNutritionRequest,
    DailyNutritionSummary,
    CreateNutritionProductRequest,
    UpdateNutritionProductRequest,
} from '../models/Nutrition';

const getPool = (req: Request): Pool => (req as any).pool as Pool;

export const getEntries = async (req: Request, res: Response) => {
    try {
        const { date } = req.query;
        let query = `
            SELECT
                id,
                user_id,
                to_char(date, 'YYYY-MM-DD') AS date,
                to_char(time, 'HH24:MI') AS time,
                title,
                calories,
                proteins,
                fats,
                carbs,
                created_at,
                updated_at
            FROM nutrition_entries
            ORDER BY date DESC, time DESC, created_at DESC
        `;
        let params: any[] = [];

        if (date) {
            query = `
                SELECT
                    id,
                    user_id,
                    to_char(date, 'YYYY-MM-DD') AS date,
                    to_char(time, 'HH24:MI') AS time,
                    title,
                    calories,
                    proteins,
                    fats,
                    carbs,
                    created_at,
                    updated_at
                FROM nutrition_entries
                WHERE date = $1
                ORDER BY time DESC, created_at DESC
            `;
            params = [date];
        }

        const result = await getPool(req).query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching nutrition entries:', error);
        res.status(500).json({ error: 'Failed to fetch nutrition entries' });
    }
};

export const getProducts = async (req: Request, res: Response) => {
    try {
        const result = await getPool(req).query(
            `
                SELECT
                    id,
                    user_id,
                    name,
                    assessment,
                    notes,
                    pros,
                    cons,
                    photo_url,
                    photo_urls,
                    created_at,
                    updated_at
                FROM nutrition_products
                ORDER BY name ASC, created_at DESC
            `
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching nutrition products:', error);
        res.status(500).json({ error: 'Failed to fetch nutrition products' });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const { name, assessment, notes, pros, cons, photo_url, photo_urls }: CreateNutritionProductRequest = req.body;
        const normalizedPhotoUrls = Array.isArray(photo_urls)
            ? photo_urls
            : photo_url
                ? [photo_url]
                : null;

        const result = await getPool(req).query(
            `
                INSERT INTO nutrition_products (name, assessment, notes, pros, cons, photo_url, photo_urls)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING
                    id,
                    user_id,
                    name,
                    assessment,
                    notes,
                    pros,
                    cons,
                    photo_url,
                    photo_urls,
                    created_at,
                    updated_at
            `,
            [name, assessment, notes ?? '', pros ?? '', cons ?? '', photo_url ?? null, normalizedPhotoUrls]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating nutrition product:', error);
        res.status(500).json({ error: 'Failed to create nutrition product' });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, assessment, notes, pros, cons, photo_url, photo_urls }: UpdateNutritionProductRequest = req.body;
        const normalizedPhotoUrls = Array.isArray(photo_urls)
            ? photo_urls
            : photo_url
                ? [photo_url]
                : null;

        const result = await getPool(req).query(
            `
                UPDATE nutrition_products
                SET
                    name = COALESCE($1, name),
                    assessment = COALESCE($2, assessment),
                    notes = COALESCE($3, notes),
                    pros = COALESCE($4, pros),
                    cons = COALESCE($5, cons),
                    photo_url = COALESCE($6, photo_url),
                    photo_urls = COALESCE($7, photo_urls),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $8
                RETURNING
                    id,
                    user_id,
                    name,
                    assessment,
                    notes,
                    pros,
                    cons,
                    photo_url,
                    photo_urls,
                    created_at,
                    updated_at
            `,
            [name ?? null, assessment ?? null, notes ?? null, pros ?? null, cons ?? null, photo_url ?? null, normalizedPhotoUrls, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Nutrition product not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating nutrition product:', error);
        res.status(500).json({ error: 'Failed to update nutrition product' });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await getPool(req).query(
            'DELETE FROM nutrition_products WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Nutrition product not found' });
        }

        res.json({ message: 'Nutrition product deleted successfully' });
    } catch (error) {
        console.error('Error deleting nutrition product:', error);
        res.status(500).json({ error: 'Failed to delete nutrition product' });
    }
};

export const getDailySummary = async (req: Request, res: Response) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: 'Date parameter is required' });
        }

        // Get all entries for the specified date
        const entriesResult = await getPool(req).query(
            `
                SELECT
                    id,
                    user_id,
                    to_char(date, 'YYYY-MM-DD') AS date,
                    to_char(time, 'HH24:MI') AS time,
                    title,
                    calories,
                    proteins,
                    fats,
                    carbs,
                    created_at,
                    updated_at
                FROM nutrition_entries
                WHERE date = $1
                ORDER BY time DESC, created_at DESC
            `,
            [date]
        );

        const entries = entriesResult.rows;

        // Calculate daily totals
        const totalCalories = entries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
        const totalProteins = entries.reduce((sum, entry) => sum + (entry.proteins || 0), 0);
        const totalFats = entries.reduce((sum, entry) => sum + (entry.fats || 0), 0);
        const totalCarbs = entries.reduce((sum, entry) => sum + (entry.carbs || 0), 0);

        const summary: DailyNutritionSummary = {
            date: date as string,
            totalCalories,
            totalProteins,
            totalFats,
            totalCarbs,
            entries,
        };

        res.json(summary);
    } catch (error) {
        console.error('Error fetching daily nutrition summary:', error);
        res.status(500).json({ error: 'Failed to fetch daily nutrition summary' });
    }
};

export const createEntry = async (req: Request, res: Response) => {
    try {
        const { date, time, title, calories, proteins, fats, carbs }: CreateNutritionRequest = req.body;

        const result = await getPool(req).query(
            `
                INSERT INTO nutrition_entries (date, time, title, calories, proteins, fats, carbs)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING
                    id,
                    user_id,
                    to_char(date, 'YYYY-MM-DD') AS date,
                    to_char(time, 'HH24:MI') AS time,
                    title,
                    calories,
                    proteins,
                    fats,
                    carbs,
                    created_at,
                    updated_at
            `,
            [date, time, title, calories || null, proteins || null, fats || null, carbs || null]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating nutrition entry:', error);
        res.status(500).json({ error: 'Failed to create nutrition entry' });
    }
};

export const updateEntry = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, calories, proteins, fats, carbs } = req.body;

        const result = await getPool(req).query(
            `
                UPDATE nutrition_entries
                SET
                    title = COALESCE($1, title),
                    calories = COALESCE($2, calories),
                    proteins = COALESCE($3, proteins),
                    fats = COALESCE($4, fats),
                    carbs = COALESCE($5, carbs),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $6
                RETURNING
                    id,
                    user_id,
                    to_char(date, 'YYYY-MM-DD') AS date,
                    to_char(time, 'HH24:MI') AS time,
                    title,
                    calories,
                    proteins,
                    fats,
                    carbs,
                    created_at,
                    updated_at
            `,
            [title, calories || null, proteins || null, fats || null, carbs || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Nutrition entry not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating nutrition entry:', error);
        res.status(500).json({ error: 'Failed to update nutrition entry' });
    }
};

export const deleteEntry = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await getPool(req).query(
            'DELETE FROM nutrition_entries WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Nutrition entry not found' });
        }

        res.json({ message: 'Nutrition entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting nutrition entry:', error);
        res.status(500).json({ error: 'Failed to delete nutrition entry' });
    }
};
