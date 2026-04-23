import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Base de datos no configurada' }, { status: 500 })
    }

    console.log('🔍 Admin all-cards endpoint llamado')
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      return NextResponse.json({ success: false, error: 'gameId es requerido' }, { status: 400 })
    }

    // 1. Obtener cartones del juego con join de usuarios
    const { data: rawCards, error } = await supabase
      .from('bingo_cards')
      .select(`
        id,
        card_number,
        numbers,
        marked_positions,
        is_winner,
        created_at,
        user_id,
        users (id, email, display_name)
      `)
      .eq('game_id', gameId)
      .order('card_number', { ascending: true })

    if (error) throw error

    const cards = rawCards || []
    console.log(`✅ Encontrados ${cards.length} cartones for game ${gameId}`)

    // Formatear y agrupar
    const cardsWithUsers = cards.map(c => {
      const u = Array.isArray(c.users) ? c.users[0] : c.users;
      return {
        id: c.id,
        card_number: c.card_number,
        numbers: c.numbers,
        marked_positions: c.marked_positions,
        is_winner: c.is_winner,
        created_at: c.created_at,
        user_id: c.user_id,
        user: u || null
      }
    })

    const cardsByUser = cardsWithUsers.reduce((acc: any, card: any) => {
      const userId = card.user_id || 'unknown'
      if (!acc[userId]) {
         acc[userId] = { user: card.user, cards: [] }
      }
      acc[userId].cards.push(card)
      return acc
    }, {})

    const response = NextResponse.json({
      success: true,
      cards: cardsWithUsers,
      cardsByUser: Object.values(cardsByUser),
      totalCards: cardsWithUsers.length,
      totalPlayers: Object.keys(cardsByUser).length
    })

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return response

  } catch (error: any) {
    console.error('Error in all-cards API:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message || 'Error desconocido'
    }, { status: 500 })
  }
}
