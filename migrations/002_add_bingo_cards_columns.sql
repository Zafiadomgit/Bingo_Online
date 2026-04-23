-- Migration 002: Add missing columns to bingo_cards table
-- Run this in your PostgreSQL database (Supabase SQL Editor or psql)

ALTER TABLE bingo_cards
ADD COLUMN IF NOT EXISTS promoter_name TEXT,
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC DEFAULT 0;

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bingo_cards'
ORDER BY ordinal_position;
