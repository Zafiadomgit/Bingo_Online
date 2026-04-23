import { NextRequest, NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    console.log('🧪 Test cards endpoint iniciado')

    // 1. Probar conexión básica a Supabase
    console.log('🔌 Probando conexión a Supabase...')
    
    // 2. Buscar todos los juegos
    const { data: games, error: gamesError } = await supabase
      .from('bingo_games')
      .select('id, name, status')
      .order('created_at', { ascending: false })
      .limit(3)

    if (gamesError) {
      console.error('❌ Error con juegos:', gamesError)
      return NextResponse.json({ 
        success: false, 
        error: `Error juegos: ${gamesError.message}`,
        code: gamesError.code
      }, { status: 500 })
    }

    console.log('✅ Juegos encontrados:', games?.length || 0)

    // 3. Buscar todos los cartones
    const { data: allCards, error: cardsError } = await supabase
      .from('bingo_cards')
      .select('id, game_id, card_number, user_id')
      .order('created_at', { ascending: false })
      .limit(10)

    if (cardsError) {
      console.error('❌ Error con cartones:', cardsError)
      return NextResponse.json({ 
        success: false, 
        error: `Error cartones: ${cardsError.message}`,
        code: cardsError.code
      }, { status: 500 })
    }

    console.log('✅ Cartones encontrados:', allCards?.length || 0)

    // 4. Si hay juegos, probar con el primer juego
    let gameCards = []
    if (games && games.length > 0) {
      const firstGame = games[0]
      console.log(`🎯 Probando con el primer juego: ${firstGame.id}`)
      
      const { data: specificCards, error: specificError } = await supabase
        .from('bingo_cards')
        .select('id, game_id, card_number, user_id')
        .eq('game_id', firstGame.id)

      if (specificError) {
        console.error('❌ Error con cartones específicos:', specificError)
      } else {
        gameCards = specificCards || []
        console.log(`✅ Cartones para juego ${firstGame.id}:`, gameCards.length)
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalGames: games?.length || 0,
        totalCards: allCards?.length || 0,
        gameCards: gameCards.length
      },
      games: games || [],
      allCards: allCards || [],
      gameCards: gameCards
    })

  } catch (error) {
    console.error('❌ Error en test cards:', error)
    return NextResponse.json(
      { success: false, error: `Error interno: ${error}` },
      { status: 500 }
    )
  }
}
