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
    const nowStr = new Date().toISOString()

    // Auto-inicio: activar juegos WAITING cuya hora ya llegó (solo si no hay ACTIVE)
    const activeGames = await supabaseFetch(
      `bingo_games?status=in.(ACTIVE,active,ACTIVE_WAITING)&finished_at=is.null&limit=1&select=id`
    ) || []

    if (activeGames.length === 0) {
      const toActivate = await supabaseFetch(
        `bingo_games?status=in.(WAITING,waiting)&auto_start=eq.true&scheduled_at=lte.${nowStr}&scheduled_at=not.is.null&order=scheduled_at.asc&limit=1&select=id`
      ) || []

      if (toActivate.length > 0) {
        await supabaseFetch(`bingo_games?id=eq.${toActivate[0].id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'ACTIVE', started_at: nowStr })
        })
      }
    }

    // Obtener todos los juegos activos/en espera — sin filtro de fecha para no perder juegos
    const rawGames = await supabaseFetch(
      `bingo_games?status=in.(WAITING,ACTIVE,waiting,active,ACTIVE_WAITING)&finished_at=is.null&name=not.ilike.[ELIMINADO]%25&order=scheduled_at.asc`
    ) || []

    if (rawGames.length === 0) {
      const response = NextResponse.json({ success: false, nextGame: null, games: [], message: 'No hay juegos disponibles' })
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
      return response
    }

    // Prioridad: ACTIVE > ACTIVE_WAITING > WAITING
    const nextGame =
      rawGames.find((g: any) => g.status === 'ACTIVE' || g.status === 'active') ||
      rawGames.find((g: any) => g.status === 'ACTIVE_WAITING') ||
      rawGames.find((g: any) => g.status === 'WAITING' || g.status === 'waiting') ||
      rawGames[0]

    // Agregar total_cards_sold a cada juego
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esrrtfjzxrosytuwfokn.supabase.co'
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    for (const g of rawGames) {
      try {
        const countRes = await fetch(`${supabaseUrl}/rest/v1/bingo_cards?game_id=eq.${g.id}`, {
          method: 'HEAD',
          headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Prefer': 'count=exact' },
          cache: 'no-store'
        })
        g.total_cards_sold = parseInt(countRes.headers.get('content-range')?.split('/')[1] || '0')
      } catch {
        g.total_cards_sold = 0
      }
    }

    const canPurchase = nextGame.status === 'WAITING' || nextGame.status === 'waiting'

    const response = NextResponse.json({ success: true, nextGame, games: rawGames, canPurchase })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response

  } catch (error: any) {
    console.error('❌ Error getting next game:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor', details: error?.message }, { status: 500 })
  }
}
