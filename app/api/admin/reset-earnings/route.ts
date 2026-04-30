import { NextResponse } from 'next/server'

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

export async function POST() {
  try {
    // Obtener juego activo más reciente
    const games = await supabaseFetch('bingo_games?status=in.(WAITING,ACTIVE)&finished_at=is.null&order=created_at.desc&limit=1')
    const game = games?.[0]
    if (!game) return NextResponse.json({ success: false, error: 'No hay juego activo' }, { status: 404 })

    // Resetear ganadores y números llamados
    await supabaseFetch(`bingo_games?id=eq.${game.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ called_numbers: [], current_number: null, line_winners: [], two_lines_winners: [], full_card_winners: [] })
    })
    // Resetear cartones
    await supabaseFetch(`bingo_cards?game_id=eq.${game.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_winner: false })
    })

    return NextResponse.json({ success: true, message: 'Ganancias reiniciadas exitosamente' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
