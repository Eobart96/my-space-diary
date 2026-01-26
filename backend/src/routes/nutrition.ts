import express from 'express';
import { body } from 'express-validator';
import { createEntry, getEntries, getDailySummary, updateEntry, deleteEntry } from '../controllers/nutritionController';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// Get nutrition entries
router.get('/', getEntries);

// Get daily nutrition summary
router.get('/summary', getDailySummary);

// Create nutrition entry
router.post('/',
    [
        body('date').notEmpty().withMessage('Date is required'),
        body('time').notEmpty().withMessage('Time is required'),
        body('title').notEmpty().withMessage('Title is required'),
        body('calories').optional().isInt({ min: 0 }).withMessage('Calories must be a positive number'),
        body('proteins').optional().isFloat({ min: 0 }).withMessage('Proteins must be a positive number'),
        body('fats').optional().isFloat({ min: 0 }).withMessage('Fats must be a positive number'),
        body('carbs').optional().isFloat({ min: 0 }).withMessage('Carbs must be a positive number'),
    ],
    validateRequest,
    createEntry
);

// Update nutrition entry
router.put('/:id',
    [
        body('title').optional().notEmpty().withMessage('Title cannot be empty'),
        body('calories').optional().isInt({ min: 0 }).withMessage('Calories must be a positive number'),
        body('proteins').optional().isFloat({ min: 0 }).withMessage('Proteins must be a positive number'),
        body('fats').optional().isFloat({ min: 0 }).withMessage('Fats must be a positive number'),
        body('carbs').optional().isFloat({ min: 0 }).withMessage('Carbs must be a positive number'),
    ],
    validateRequest,
    updateEntry
);

// Delete nutrition entry
router.delete('/:id', deleteEntry);

export default router;
