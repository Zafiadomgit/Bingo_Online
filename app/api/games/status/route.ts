import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function supabaseFetch(path: string, options: any = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esrrtfjzxrosytuwfokn.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {})
    },
    cache: 'no-store'
  })
  if (!res.ok) { const err = await res.text(); throw new Error(`Supabase: ${err}`) }
  const text = await res.text(); return text ? JSON.parse(text) : null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')
    const userId = searchParams.get('userId')

    if (!gameId) return NextResponse.json({ success: false, error: 'ID del juego es requerido' }, { status: 400 })

    // 1. Obtener el juego
    const games = await supabaseFetch(`bingo_games?id=eq.${gameId}&limit=1`)
    let game = games?.[0]
    if (!game) return NextResponse.json({ success: false, error: 'Juego no encontrado' }, { status: 404 })

    // 2. Obtener info del admin
    if (game.admin_id) {
      const admins = await supabaseFetch(`users?id=eq.${game.admin_id}&select=id,email,display_name&limit=1`)
      const admin = admins?.[0]
      if (admin) {
        game.admin_id_val = admin.id
        game.admin_email = admin.email
        game.admin_name = admin.display_name
        game.admin = { id: admin.id, email: admin.email, display_name: admin.display_name }
      }
    }

    const now = new Date()

    // 3. Auto-inicio: WAITING → ACTIVE si llegó la hora
    if (game.status === 'WAITING' && game.auto_start === true && game.scheduled_at) {
      const scheduledAt = new Date(game.scheduled_at)
      if (now >= scheduledAt) {
        const updated = await supabaseFetch(`bingo_games?id=eq.${gameId}&status=eq.WAITING`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'ACTIVE', started_at: now.toISOString(), called_numbers: [], current_number: null })
        })
        if (updated?.[0]) game = { ...game, ...updated[0] }
      }
    }

    // 4. Transición ACTIVE_WAITING → ACTIVE después de 2 min
    if (game.status === 'ACTIVE_WAITING' && game.started_at) {
      const startedAt = new Date(game.started_at)
      if (now >= new Date(startedAt.getTime() + 2 * 60 * 1000)) {
        const updated = await supabaseFetch(`bingo_games?id=eq.${gameId}&status=eq.ACTIVE_WAITING`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'ACTIVE', called_numbers: [], current_number: null })
        })
        if (updated?.[0]) game = { ...game, ...updated[0] }
      }
    }

    // 5. Cartones del usuario si se especifica userId
    let userCards: any[] = []
    if (userId) {
      userCards = await supabaseFetch(`bingo_cards?game_id=eq.${gameId}&user_id=eq.${userId}&order=created_at.desc`) || []
    }

    // 6. Estadísticas del juego
    const allCards = await supabaseFetch(`bingo_cards?game_id=eq.${gameId}&select=user_id,is_winner`) || []
    const uniquePlayers = new Set(allCards.map((c: any) => c.user_id)).size
    const totalCards = allCards.length
    const winners = allCards.filter((c: any) => c.is_winner).length

    return NextResponse.json({
      success: true,
      game: {
        ...game,
        totalPlayers: uniquePlayers,
        totalCards,
        winners,
        calledNumbers: game.called_numbers || [],
        currentNumber: game.current_number
      },
      userCards,
      isActive: game.status === 'ACTIVE',
      isFinished: game.status === 'FINISHED'
    })

  } catch (error: any) {
    console.error('Error getting game status:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor', details: error.message }, { status: 500 })
  }
}
