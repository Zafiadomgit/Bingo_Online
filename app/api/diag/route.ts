import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const results: any = {}

  results.env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SERVICE_ROLE_ref: (() => {
      try {
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString())
        return payload.ref
      } catch { return 'error' }
    })(),
  }

  const client = getSupabaseAdmin()

  // Sin filtro
  try {
    const { data, error } = await client
      .from('purchase_requests')
      .select('id, email, status')
      .order('created_at', { ascending: false })
    results.sin_filtro = { data, error }
  } catch (e: any) {
    results.sin_filtro_error = e?.message
  }

  // Con filtro pending
  try {
    const { data, error } = await client
      .from('purchase_requests')
      .select('id, email, status')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    results.con_filtro_pending = { data, error }
  } catch (e: any) {
    results.con_filtro_error = e?.message
  }

  return NextResponse.json(results)
}
