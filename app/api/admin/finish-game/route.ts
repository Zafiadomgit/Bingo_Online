import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function supabaseFetch(path: string, options: any = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esrrtfjzxrosytuwfokn.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation', ...(options.headers || {}) },
    cache: 'no-store'
  })
  if (!res.ok) { const err = await res.text(); throw new Error(`Supabase: ${err}`) }
  const text = await res.text(); return text ? JSON.parse(text) : null
}

export async function POST(request: NextRequest) {
  try {
    const { gameId } = await request.json()
    if (!gameId) return NextResponse.json({ success: false, error: 'gameId requerido' }, { status: 400 })

    const updated = await supabaseFetch(`bingo_games?id=eq.${gameId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'FINISHED', finished_at: new Date().toISOString() })
    })

    return NextResponse.json({ success: true, message: 'Juego finalizado', game: updated?.[0] })
  } catch (error: any) {
    console.error('Error finishing game:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
