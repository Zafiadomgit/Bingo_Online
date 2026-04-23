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
    if (!gameId) return NextResponse.json({ success: false, error: 'ID del juego es requerido' }, { status: 400 })

    console.log(`🗑️ FORCE DELETE - Eliminando juego: ${gameId}`)

    // Eliminar dependencias primero (por si acaso)
    await supabaseFetch(`bingo_cards?game_id=eq.${gameId}`, { method: 'DELETE' }).catch(() => {})
    await supabaseFetch(`card_numbers?game_id=eq.${gameId}`, { method: 'DELETE' }).catch(() => {})
    await supabaseFetch(`winner_notifications?game_id=eq.${gameId}`, { method: 'DELETE' }).catch(() => {})

    // Eliminar el juego
    await supabaseFetch(`bingo_games?id=eq.${gameId}`, { method: 'DELETE' })

    console.log('✅ Juego eliminado exitosamente')
    return NextResponse.json({ success: true, message: 'Juego eliminado exitosamente', gameId })

  } catch (error) {
    console.error('❌ Error en force delete:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
