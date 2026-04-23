-- Migration: Add missing columns to purchase_requests table
-- Execute this in Supabase SQL Editor

ALTER TABLE purchase_requests
ADD COLUMN IF NOT EXISTS nombres TEXT,
ADD COLUMN IF NOT EXISTS apellidos TEXT,
ADD COLUMN IF NOT EXISTS telefono TEXT,
ADD COLUMN IF NOT EXISTS cedula TEXT,
ADD COLUMN IF NOT EXISTS cantidad_cartones INTEGER,
ADD COLUMN IF NOT EXISTS card_numbers TEXT,
ADD COLUMN IF NOT EXISTS numero_referencia TEXT;

-- Verify the migration
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'purchase_requests'
ORDER BY ordinal_position;
