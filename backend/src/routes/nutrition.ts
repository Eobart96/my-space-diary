import express from 'express';
import { body } from 'express-validator';
import { createEntry, getEntries, getDailySummary, updateEntry, deleteEntry, getProducts, createProduct, updateProduct, deleteProduct } from '../controllers/nutritionController';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// Get nutrition entries
router.get('/', getEntries);

// Get daily nutrition summary
router.get('/summary', getDailySummary);

// Products CRUD
router.get('/products', getProducts);
router.post(
    '/products',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('assessment').isIn(['positive', 'negative', 'neutral']).withMessage('Assessment must be positive|negative|neutral'),
        body('notes').optional().isString(),
        body('pros').optional().isString(),
        body('cons').optional().isString(),
        body('photo_url').optional().isString(),
    ],
    validateRequest,
    createProduct
);
router.put(
    '/products/:id',
    [
        body('name').optional().notEmpty().withMessage('Name cannot be empty'),
        body('assessment').optional().isIn(['positive', 'negative', 'neutral']).withMessage('Assessment must be positive|negative|neutral'),
        body('notes').optional().isString(),
        body('pros').optional().isString(),
        body('cons').optional().isString(),
        body('photo_url').optional().isString(),
    ],
    validateRequest,
    updateProduct
);
router.delete('/products/:id', deleteProduct);

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
