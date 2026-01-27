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
        body('time').notEmpty().withMessage('Time is required'),
        body('text').notEmpty().withMessage('Text is required'),
        body('mood').optional().isInt({ min: 1, max: 5 }).withMessage('Mood must be between 1 and 5'),
    ],
    validateRequest,
    createEntry
);

// Update diary entry
router.put('/:id',
    [
        body('date').optional().notEmpty().withMessage('Date cannot be empty'),
        body('time').optional().notEmpty().withMessage('Time cannot be empty'),
        body('text').optional().notEmpty().withMessage('Text cannot be empty'),
        body('mood').optional().isInt({ min: 1, max: 5 }).withMessage('Mood must be between 1 and 5'),
    ],
    validateRequest,
    updateEntry
);

// Delete diary entry
router.delete('/:id', deleteEntry);

export default router;
