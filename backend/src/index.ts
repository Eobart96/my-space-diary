import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Pool } from 'pg';

import diaryRoutes from './routes/diary';
import nutritionRoutes from './routes/nutrition';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV === 'production') {
    app.use(rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
    }));
}

// Make database pool available to routes
app.use((req: any, res: any, next: any) => {
    req.pool = pool;
    next();
});

// Routes
app.use('/api/diary', diaryRoutes);
app.use('/api/nutrition', nutritionRoutes);

// Health check
app.get('/api/health', (req: any, res: any) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req: any, res: any) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
pool.connect()
    .then(() => {
        console.log('Connected to PostgreSQL database');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error: Error) => {
        console.error('Failed to connect to database:', error);
        process.exit(1);
    });

export default app;
