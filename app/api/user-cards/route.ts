import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const gameId = searchParams.get('gameId')

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email es requerido' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esrrtfjzxrosytuwfokn.supabase.co'
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    }

    // 1. Obtener usuario por email
    const userRes = await fetch(
      `${url}/rest/v1/users?email=ilike.${encodeURIComponent(email)}&select=id,email&limit=1`,
      { headers, cache: 'no-store' }
    )
    const users = await userRes.json()
    if (!users || users.length === 0) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }
    const userId = users[0].id

    // 2. Obtener juego activo (WAITING o ACTIVE, sin finished_at)
    let targetGameId = gameId
    if (!targetGameId) {
      const gameRes = await fetch(
        `${url}/rest/v1/bingo_games?status=in.(WAITING,ACTIVE,waiting,active)&finished_at=is.null&order=created_at.desc&limit=1&select=id`,
        { headers, cache: 'no-store' }
      )
      const games = await gameRes.json()
      if (games && games.length > 0) {
        targetGameId = games[0].id
      }
    }

    // Si no hay juego activo, no hay cartones que mostrar
    if (!targetGameId) {
      const response = NextResponse.json({ success: true, cards: [], pendingRequests: [] })
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      return response
    }

    // 3. Verificar que el juego sigue activo (no FINISHED)
    const gameCheckRes = await fetch(
      `${url}/rest/v1/bingo_games?id=eq.${targetGameId}&status=in.(WAITING,ACTIVE,waiting,active)&finished_at=is.null&select=id&limit=1`,
      { headers, cache: 'no-store' }
    )
    const activeGame = await gameCheckRes.json()
    if (!activeGame || activeGame.length === 0) {
      // El juego ya no está activo — no mostrar cartones
      const response = NextResponse.json({ success: true, cards: [], pendingRequests: [] })
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      return response
    }

    // 4. Obtener cartones del usuario para ese juego activo
    const cardsRes = await fetch(
      `${url}/rest/v1/bingo_cards?user_id=eq.${userId}&game_id=eq.${targetGameId}&order=created_at.desc`,
      { headers, cache: 'no-store' }
    )
    const cards = await cardsRes.json()

    // 5. Obtener solicitudes pendientes del usuario
    const reqRes = await fetch(
      `${url}/rest/v1/purchase_requests?email=ilike.${encodeURIComponent(email)}&status=eq.pending&order=created_at.desc`,
      { headers, cache: 'no-store' }
    )
    const pendingRequests = await reqRes.json()

    const response = NextResponse.json({
      success: true,
      cards: cards || [],
      pendingRequests: pendingRequests || [],
      gameId: targetGameId
    })

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response

  } catch (error: any) {
    console.error('Error in user-cards API:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
