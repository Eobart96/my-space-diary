import express from 'express';
import { body } from 'express-validator';
import { register, login } from '../controllers/authController';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// Register user
router.post('/register',
    [
        body('username')
            .isLength({ min: 3 })
            .withMessage('Username must be at least 3 characters long')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),
        body('email')
            .optional()
            .isEmail()
            .withMessage('Please provide a valid email')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long'),
    ],
    validateRequest,
    register
);

// Login user
router.post('/login',
    [
        body('username')
            .notEmpty()
            .withMessage('Username is required'),
        body('password')
            .notEmpty()
            .withMessage('Password is required'),
    ],
    validateRequest,
    login
);

export default router;
