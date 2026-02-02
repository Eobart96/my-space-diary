import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL
    `);

    // Diary entries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS diary_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        time TEXT NOT NULL,
        text TEXT NOT NULL,
        mood INTEGER CHECK (mood >= 1 AND mood <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Backward-compatible schema upgrades
    await client.query(`ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS time TEXT`);
    await client.query(`ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS photo_url TEXT`);
    await client.query(`ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS photo_urls TEXT[]`);
    await client.query(`UPDATE diary_entries SET photo_urls = ARRAY[photo_url] WHERE photo_urls IS NULL AND photo_url IS NOT NULL`);
    await client.query(`UPDATE diary_entries SET time = COALESCE(time, to_char(created_at, 'HH24:MI'))`);
    await client.query(`ALTER TABLE diary_entries ALTER COLUMN time SET NOT NULL`);

    // Nutrition entries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS nutrition_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        time TIME NOT NULL,
        title VARCHAR(255) NOT NULL,
        calories INTEGER CHECK (calories >= 0),
        proteins DECIMAL(5,2) CHECK (proteins >= 0),
        fats DECIMAL(5,2) CHECK (fats >= 0),
        carbs DECIMAL(5,2) CHECK (carbs >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Nutrition products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS nutrition_products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        assessment TEXT NOT NULL CHECK (assessment IN ('positive', 'negative', 'neutral')),
        notes TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`ALTER TABLE nutrition_products ADD COLUMN IF NOT EXISTS pros TEXT NOT NULL DEFAULT ''`);
    await client.query(`ALTER TABLE nutrition_products ADD COLUMN IF NOT EXISTS cons TEXT NOT NULL DEFAULT ''`);
    await client.query(`ALTER TABLE nutrition_products ADD COLUMN IF NOT EXISTS photo_url TEXT`);
    await client.query(`ALTER TABLE nutrition_products ADD COLUMN IF NOT EXISTS photo_urls TEXT[]`);
    await client.query(`UPDATE nutrition_products SET photo_urls = ARRAY[photo_url] WHERE photo_urls IS NULL AND photo_url IS NOT NULL`);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_diary_entries_user_date ON diary_entries(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_nutrition_entries_user_date ON nutrition_entries(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_nutrition_products_user_name ON nutrition_products(user_id, name);
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  migrate().catch(console.error);
}

export default migrate;
