import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
// Fallback to .env if .env.local doesn't allow connection (or if just .env exists)
if (!process.env.DATABASE_URL) {
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  try {
    console.log('Running migration: Add promoter_name to purchase_requests...');
    await pool.query(`
      ALTER TABLE purchase_requests 
      ADD COLUMN IF NOT EXISTS promoter_name TEXT;
    `);
    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();
