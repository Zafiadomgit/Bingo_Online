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

export async function GET(request: NextRequest) {
  try {
    const games = await supabaseFetch('bingo_games?order=created_at.desc') || []
    return NextResponse.json({ success: true, games })
  } catch (error: any) {
    console.error('Error getting games:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, max_cards, card_price, scheduled_at } = await request.json()
    if (!name || !max_cards || !card_price) {
      return NextResponse.json({ success: false, error: 'Nombre, máximo de cartones y precio son requeridos' }, { status: 400 })
    }
    const { v4: uuidv4 } = await import('uuid')
    const game = await supabaseFetch('bingo_games', {
      method: 'POST',
      body: JSON.stringify({
        id: uuidv4(),
        name,
        max_cards: parseInt(max_cards),
        card_price: parseFloat(card_price),
        status: 'WAITING',
        called_numbers: [],
        admin_id: '00000000-0000-0000-0000-000000000000',
        scheduled_at: scheduled_at || null,
        created_at: new Date().toISOString()
      })
    })
    return NextResponse.json({ success: true, game: game?.[0] })
  } catch (error: any) {
    console.error('Error creating game:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Leer gameId desde body JSON (como lo envía el panel admin)
    // o desde query params como fallback
    let gameId: string | null = null
    try {
      const body = await request.json()
      gameId = body?.gameId || null
    } catch {
      const { searchParams } = new URL(request.url)
      gameId = searchParams.get('id')
    }

    if (!gameId) return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })

    // Eliminar dependencias en orden antes de borrar el juego
    await supabaseFetch(`bingo_cards?game_id=eq.${gameId}`, { method: 'DELETE' })
    await supabaseFetch(`purchase_requests?game_id=eq.${gameId}`, { method: 'DELETE' })
    await supabaseFetch(`winner_notifications?game_id=eq.${gameId}`, { method: 'DELETE' })
    await supabaseFetch(`bingo_games?id=eq.${gameId}`, { method: 'DELETE' })

    return NextResponse.json({ success: true, message: 'Juego eliminado' })
  } catch (error: any) {
    console.error('Error deleting game:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
