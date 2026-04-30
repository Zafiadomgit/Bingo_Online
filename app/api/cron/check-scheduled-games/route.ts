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
    const now = new Date().toISOString()
    console.log('🕐 [CRON] Verificando juegos programados...', now)

    // Buscar juegos WAITING con auto_start cuya hora ya llegó
    const scheduledGames = await supabaseFetch(
      `bingo_games?status=eq.WAITING&auto_start=eq.true&scheduled_at=lte.${now}&finished_at=is.null&order=scheduled_at.asc`
    ) || []

    if (scheduledGames.length === 0) {
      console.log('✅ [CRON] No hay juegos programados para iniciar')
      return NextResponse.json({ success: true, message: 'No hay juegos programados para iniciar', gamesStarted: 0 })
    }

    // Verificar si ya hay un juego ACTIVE
    const activeGames = await supabaseFetch('bingo_games?status=in.(ACTIVE,ACTIVE_WAITING)&finished_at=is.null&limit=1') || []

    if (activeGames.length > 0) {
      console.log('⏸️ [CRON] Ya hay un juego activo, no iniciar otro')
      return NextResponse.json({ success: true, message: 'Ya hay un juego activo', gamesStarted: 0 })
    }

    // Iniciar solo el primero
    const gameToStart = scheduledGames[0]
    await supabaseFetch(`bingo_games?id=eq.${gameToStart.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ACTIVE', started_at: now, called_numbers: [], current_number: null })
    })

    console.log(`✅ [CRON] Juego iniciado: ${gameToStart.name}`)
    return NextResponse.json({ success: true, message: `Juego iniciado: ${gameToStart.name}`, gamesStarted: 1, gameId: gameToStart.id })

  } catch (error: any) {
    console.error('❌ [CRON] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// También aceptar GET para compatibilidad con algunos cron services
export async function GET() {
  return POST()
}
