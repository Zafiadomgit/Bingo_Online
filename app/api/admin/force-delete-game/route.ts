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

export async function POST(request: Request) {
  try {
    const { gameId } = await request.json()
    if (!gameId) return NextResponse.json({ success: false, error: 'Game ID requerido' }, { status: 400 })

    console.log(`🗑️ Iniciando eliminación forzada del juego: ${gameId}`)

    const games = await supabaseFetch(`bingo_games?id=eq.${gameId}&select=id,name,status&limit=1`)
    const game = games?.[0]
    if (!game) return NextResponse.json({ success: false, error: 'Juego no encontrado' }, { status: 404 })

    // Eliminar dependencias en orden
    await supabaseFetch(`bingo_cards?game_id=eq.${gameId}`, { method: 'DELETE' })
    await supabaseFetch(`card_numbers?game_id=eq.${gameId}`, { method: 'DELETE' })
    await supabaseFetch(`game_notifications?game_id=eq.${gameId}`, { method: 'DELETE' })
    await supabaseFetch(`purchase_requests?game_id=eq.${gameId}`, { method: 'DELETE' })

    // Eliminar el juego
    try {
      await supabaseFetch(`bingo_games?id=eq.${gameId}`, { method: 'DELETE' })
    } catch {
      // Si no se puede eliminar, marcarlo como eliminado
      await supabaseFetch(`bingo_games?id=eq.${gameId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: `[ELIMINADO] ${game.name}`, status: 'FINISHED', finished_at: new Date().toISOString() })
      })
    }

    console.log(`✅ Juego eliminado: ${game.name}`)
    return NextResponse.json({ success: true, message: 'Juego eliminado exitosamente', details: { game: game.name } })
  } catch (error: any) {
    console.error('Error in force delete game:', error)
    return NextResponse.json({ success: false, error: 'Error interno', details: error.message }, { status: 500 })
  }
}
