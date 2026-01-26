import express from 'express';
import { body } from 'express-validator';
import { createEntry, getEntries, updateEntry, deleteEntry } from '../controllers/diaryController';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// Get diary entries
router.get('/', getEntries);

// Create diary entry
router.post('/',
    [
        body('date').notEmpty().withMessage('Date is required'),
        body('text').notEmpty().withMessage('Text is required'),
        body('mood').optional().isInt({ min: 1, max: 5 }).withMessage('Mood must be between 1 and 5'),
    ],
    validateRequest,
    createEntry
);

// Update diary entry
router.put('/:id',
    [
        body('text').optional().notEmpty().withMessage('Text cannot be empty'),
        body('mood').optional().isInt({ min: 1, max: 5 }).withMessage('Mood must be between 1 and 5'),
    ],
    validateRequest,
    updateEntry
);

// Delete diary entry
router.delete('/:id', deleteEntry);

export default router;
