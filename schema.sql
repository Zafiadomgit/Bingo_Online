-- USERS Table
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

-- BINGO GAMES Table
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

-- BINGO CARDS Table
CREATE TABLE IF NOT EXISTS bingo_cards (
  id UUID PRIMARY KEY,
  game_id UUID REFERENCES bingo_games(id),
  user_id UUID REFERENCES users(id),
  card_number INTEGER NOT NULL,
  numbers INTEGER[][] NOT NULL,
  marked_positions BOOLEAN[][] NOT NULL,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PURCHASE REQUESTS Table
CREATE TABLE IF NOT EXISTS purchase_requests (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  game_id UUID REFERENCES bingo_games(id),
  card_number INTEGER,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  receipt_url TEXT,
  promoter_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create initial admin user with hardcoded UUID
INSERT INTO users (id, email, password, display_name, role, credits)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@bingo.com',
  '$2b$12$VjRzlTPekLxg70IheDu1Pu/LQ3Fy219Y2VIBwPVtoQoMc5mCqto/C',
  'Administrador',
  'admin',
  999999
) ON CONFLICT (email) DO NOTHING;

-- Migration: Add missing columns to bingo_cards
ALTER TABLE bingo_cards
ADD COLUMN IF NOT EXISTS promoter_name TEXT,
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC DEFAULT 0;
