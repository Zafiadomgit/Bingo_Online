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

    const games = await supabaseFetch(`bingo_games?id=eq.${gameId}&limit=1`)
    const game = games?.[0]
    if (!game) return NextResponse.json({ success: false, error: 'Juego no encontrado' }, { status: 404 })
    if (game.status === 'ACTIVE') return NextResponse.json({ success: true, message: 'El juego ya está activo', game })

    const updated = await supabaseFetch(`bingo_games?id=eq.${gameId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ACTIVE', started_at: new Date().toISOString(), called_numbers: [], current_number: null })
    })

    return NextResponse.json({ success: true, message: 'Juego iniciado exitosamente', game: updated?.[0] })
  } catch (error: any) {
    console.error('Error starting game:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
