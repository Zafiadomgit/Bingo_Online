import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const schemaPath = path.resolve(__dirname, '../schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Connecting to database...');
    const client = await pool.connect();
    
    console.log('Executing schema...');
    await client.query(schema);
    
    console.log('Database initialized successfully!');
    client.release();
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    await pool.end();
  }
}

main();
