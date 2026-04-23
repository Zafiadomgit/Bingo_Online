import { NextRequest, NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    console.log('🔍 Verificando estado de cartones...')

    // 1. Verificar todos los juegos
    const { data: games, error: gamesError } = await supabase
      .from('bingo_games')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false })

    if (gamesError) {
      console.error('Error obteniendo juegos:', gamesError)
      return NextResponse.json({ success: false, error: 'Error obteniendo juegos' }, { status: 500 })
    }

    console.log(`🎮 Encontrados ${games?.length || 0} juegos`)

    // 2. Verificar todos los cartones
    const { data: allCards, error: cardsError } = await supabase
      .from('bingo_cards')
      .select('id, game_id, user_id, card_number, created_at')
      .order('created_at', { ascending: false })

    if (cardsError) {
      console.error('Error obteniendo cartones:', cardsError)
      return NextResponse.json({ success: false, error: 'Error obteniendo cartones' }, { status: 500 })
    }

    console.log(`🎴 Encontrados ${allCards?.length || 0} cartones`)

    // 3. Verificar todas las solicitudes de compra
    const { data: requests, error: requestsError } = await supabase
      .from('purchase_requests')
      .select('id, email, game_id, status, cantidad_cartones, created_at')
      .order('created_at', { ascending: false })

    if (requestsError) {
      console.error('Error obteniendo solicitudes:', requestsError)
      return NextResponse.json({ success: false, error: 'Error obteniendo solicitudes' }, { status: 500 })
    }

    console.log(`💰 Encontradas ${requests?.length || 0} solicitudes`)

    // 4. Verificar números de cartón (opcional, puede no existir la tabla)
    let cardNumbers = []
    try {
      const { data: cardNumbersData, error: cardNumbersError } = await supabase
        .from('card_numbers')
        .select('id, number, user_email, game_id, status, created_at')
        .order('created_at', { ascending: false })

      if (cardNumbersError) {
        console.log('⚠️ Tabla card_numbers no disponible o error:', cardNumbersError.message)
        cardNumbers = []
      } else {
        cardNumbers = cardNumbersData || []
        console.log(`🔢 Encontrados ${cardNumbers.length} números de cartón`)
      }
    } catch (error) {
      console.log('⚠️ Error accediendo a card_numbers:', error)
      cardNumbers = []
    }

    // 5. Agrupar cartones por juego
    const cardsByGame = games?.map(game => {
      const gameCards = allCards?.filter(card => card.game_id === game.id) || []
      const gameRequests = requests?.filter(req => req.game_id === game.id) || []
      const gameCardNumbers = cardNumbers.filter(cn => cn.game_id === game.id) || []

      return {
        game: {
          id: game.id,
          name: game.name,
          status: game.status,
          created_at: game.created_at
        },
        cards: gameCards,
        requests: gameRequests,
        cardNumbers: gameCardNumbers,
        summary: {
          totalCards: gameCards.length,
          approvedRequests: gameRequests.filter(r => r.status === 'approved').length,
          pendingRequests: gameRequests.filter(r => r.status === 'pending').length,
          reservedNumbers: gameCardNumbers.filter(cn => cn.status === 'reserved').length,
          confirmedNumbers: gameCardNumbers.filter(cn => cn.status === 'confirmed').length
        }
      }
    }) || []

    return NextResponse.json({
      success: true,
      summary: {
        totalGames: games?.length || 0,
        totalCards: allCards?.length || 0,
        totalRequests: requests?.length || 0,
        totalCardNumbers: cardNumbers.length || 0
      },
      games: cardsByGame,
      debug: {
        allGames: games,
        allCards: allCards,
        allRequests: requests,
        allCardNumbers: cardNumbers
      }
    })

  } catch (error) {
    console.error('Error verificando cartones:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
