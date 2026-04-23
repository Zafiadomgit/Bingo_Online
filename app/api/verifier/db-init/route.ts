import { NextResponse } from 'next/server'
import { getClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('Starting remote database initialization...')

    const client = await getClient()

    try {
      // 1. Users Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          display_name TEXT,
          credits INTEGER DEFAULT 1000,
          role TEXT DEFAULT 'user',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)

      // 2. Bingo Games Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS bingo_games (
          id UUID PRIMARY KEY,
          name TEXT NOT NULL,
          max_cards INTEGER DEFAULT 100,
          card_price NUMERIC DEFAULT 10,
          status TEXT DEFAULT 'WAITING',
          current_number INTEGER,
          called_numbers INTEGER[] DEFAULT '{}',
          winner_id UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          started_at TIMESTAMP WITH TIME ZONE,
          finished_at TIMESTAMP WITH TIME ZONE,
          scheduled_at TIMESTAMP WITH TIME ZONE,
          admin_id UUID REFERENCES users(id),
          auto_start BOOLEAN DEFAULT FALSE,
          start_delay_minutes INTEGER DEFAULT 0,
          notification_sent BOOLEAN DEFAULT FALSE,
          prize_line NUMERIC DEFAULT 50,
          prize_two_lines NUMERIC DEFAULT 100,
          prize_full_card NUMERIC DEFAULT 200,
          use_percentage_prizes BOOLEAN DEFAULT FALSE,
          prize_line_percentage NUMERIC DEFAULT 10,
          prize_two_lines_percentage NUMERIC DEFAULT 15,
          prize_full_card_percentage NUMERIC DEFAULT 25,
          currency TEXT DEFAULT 'USD',
          line_winners JSONB DEFAULT '[]',
          two_lines_winners JSONB DEFAULT '[]',
          full_card_winners JSONB DEFAULT '[]'
        );
      `)

      // 3. Ensure bingo_games has all required columns
      await client.query(`
        ALTER TABLE bingo_games 
        ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS start_delay_minutes INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS prize_line NUMERIC DEFAULT 50,
        ADD COLUMN IF NOT EXISTS prize_two_lines NUMERIC DEFAULT 100,
        ADD COLUMN IF NOT EXISTS prize_full_card NUMERIC DEFAULT 200,
        ADD COLUMN IF NOT EXISTS use_percentage_prizes BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS prize_line_percentage NUMERIC DEFAULT 10,
        ADD COLUMN IF NOT EXISTS prize_two_lines_percentage NUMERIC DEFAULT 15,
        ADD COLUMN IF NOT EXISTS prize_full_card_percentage NUMERIC DEFAULT 25,
        ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
        ADD COLUMN IF NOT EXISTS line_winners JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS two_lines_winners JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS full_card_winners JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS waiting_until TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      `)

      // 4. Bingo Cards Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS bingo_cards (
          id UUID PRIMARY KEY,
          game_id UUID REFERENCES bingo_games(id),
          user_id UUID REFERENCES users(id),
          card_number INTEGER NOT NULL,
          numbers INTEGER[][] NOT NULL,
          marked_positions BOOLEAN[][] NOT NULL,
          is_winner BOOLEAN DEFAULT FALSE,
          promoter_name TEXT,
          purchase_price NUMERIC,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)

      // 4. Ensure bingo_cards has required columns
      await client.query(`
        ALTER TABLE bingo_cards
        ADD COLUMN IF NOT EXISTS promoter_name TEXT,
        ADD COLUMN IF NOT EXISTS purchase_price NUMERIC;
      `)

      // 5. Purchase Requests Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS purchase_requests (
          id UUID PRIMARY KEY,
          email TEXT NOT NULL,
          game_id UUID REFERENCES bingo_games(id),
          card_number INTEGER,
          amount NUMERIC NOT NULL,
          status TEXT DEFAULT 'pending',
          receipt_url TEXT,
          promoter_name TEXT,
          nombres TEXT,
          apellidos TEXT,
          telefono TEXT,
          cedula TEXT,
          cantidad_cartones INTEGER,
          card_numbers JSONB,
          numero_referencia TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)

      // Ensure all columns exist if table already exists
      await client.query(`
        ALTER TABLE purchase_requests
        ADD COLUMN IF NOT EXISTS nombres TEXT,
        ADD COLUMN IF NOT EXISTS apellidos TEXT,
        ADD COLUMN IF NOT EXISTS telefono TEXT,
        ADD COLUMN IF NOT EXISTS cedula TEXT,
        ADD COLUMN IF NOT EXISTS cantidad_cartones INTEGER,
        ADD COLUMN IF NOT EXISTS card_numbers JSONB,
        ADD COLUMN IF NOT EXISTS numero_referencia TEXT,
        ADD COLUMN IF NOT EXISTS amount NUMERIC;
      `)

      // 5. Promoters Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS promoters (
          id UUID PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)

      // 6. Card Numbers Table (for reserving specific numbers)
      await client.query(`
        CREATE TABLE IF NOT EXISTS card_numbers (
          id SERIAL PRIMARY KEY,
          number INTEGER NOT NULL,
          user_email TEXT NOT NULL,
          game_id UUID REFERENCES bingo_games(id),
          status TEXT DEFAULT 'reserved',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(number, game_id)
        );
      `)

      await client.query(`
        INSERT INTO users (id, email, password, display_name, role, credits)
        VALUES (
          '00000000-0000-0000-0000-000000000000',
          'admin@bingo.com',
          '$2b$12$VjRzlTPekLxg70IheDu1Pu/LQ3Fy219Y2VIBwPVtoQoMc5mCqto/C',
          'Administrador',
          'admin',
          999999
        ) ON CONFLICT (email) DO NOTHING;
      `)

      return NextResponse.json({
        success: true,
        message: 'Database initialized successfully with all tables and admin user.'
      })

    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('Initialization failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
