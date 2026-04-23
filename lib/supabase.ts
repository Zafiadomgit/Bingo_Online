import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://esrrtfjzxrosytuwfokn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcnJ0Zmp6eHJvc3l0dXdmb2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjk4ODIsImV4cCI6MjA4NTY0NTg4Mn0.rxRLX88TPPala7jwS396zhO0RXgllQyNP8G5ZD6c9vk'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcnJ0Zmp6eHJvc3l0dXdmb2tuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA2OTg4MiwiZXhwIjoyMDg1NjQ1ODgyfQ.UrzG5HCEcS7Ck4LCLdT14bPzgIk0e23v9q6rIZWFD5c'

function createSupabaseClient(url: string, key: string): SupabaseClient {
  const cleanUrl = url.replace(/^["']|["']$/g, '').trim()
  const cleanKey = key.replace(/^["']|["']$/g, '').trim()
  return createClient(cleanUrl, cleanKey, { auth: { persistSession: false } })
}

export function getSupabase(): SupabaseClient {
  const url = SUPABASE_URL; // Using hardcoded correct value to override Vercel's outdated env var
  const key = SUPABASE_ANON_KEY;
  return createSupabaseClient(url, key)
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = SUPABASE_URL; // Using hardcoded correct value to override Vercel's outdated env var
  const key = SUPABASE_SERVICE_ROLE_KEY;
  return createSupabaseClient(url, key)
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) { return (getSupabase() as any)[prop] }
})

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) { return (getSupabaseAdmin() as any)[prop] }
})

export interface User {
  id: string; email: string; display_name: string | null
  credits: number; created_at: string; updated_at: string
}
export interface BingoGame {
  id: string; name: string; max_cards: number; card_price: number
  status: 'WAITING' | 'ACTIVE' | 'FINISHED'; current_number: number | null
  called_numbers: number[]; winner_id: string | null; created_at: string
  started_at: string | null; finished_at: string | null
  scheduled_at: string | null; admin_id: string
}
export interface BingoCard {
  id: string; game_id: string; user_id: string; card_number: number
  numbers: number[]; marked_positions: boolean[]; is_winner: boolean; created_at: string
}
export interface Payment {
  id: string; user_id: string; game_id: string; amount: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  payment_method: string; receipt_url: string | null
  created_at: string; completed_at: string | null
}
