import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { CreateUserRequest, LoginRequest, AuthResponse } from '../models/User';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const register = async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        let existingUserQuery = 'SELECT id FROM users WHERE username = $1';
        const existingUserParams = [username];

        if (email) {
            existingUserQuery += ' OR email = $2';
            existingUserParams.push(email);
        }

        const existingUser = await pool.query(existingUserQuery, existingUserParams);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Create user
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
            [username, email || null, password_hash]
        );

        const user = result.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET!,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password }: LoginRequest = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const result = await pool.query(
            'SELECT id, username, email, password_hash FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        const response: AuthResponse = {
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at,
                password_hash: user.password_hash
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
