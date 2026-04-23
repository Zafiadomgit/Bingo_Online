import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
        return NextResponse.json({ success: false, error: 'Base de datos no configurada' }, { status: 500 })
    }

    console.log(`🎮 Recibiendo request para iniciar juego`)
    const body = await request.json()
    console.log(`📋 Body recibido:`, body)
    const { gameId } = body

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: 'ID del juego es requerido' },
        { status: 400 }
      )
    }

    console.log(`🎮 Admin iniciando juego: ${gameId}`)

    // Obtener el juego
    const { data: game, error: gameError } = await supabase
      .from('bingo_games')
      .select('*')
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ success: false, error: 'Juego no encontrado' }, { status: 404 })
    }

    // Verificar estado WAITING
    if (game.status !== 'WAITING' && game.status !== 'waiting') {
      return NextResponse.json({ success: false, error: `El juego ya está ${game.status}` }, { status: 400 })
    }

    // Obtener cartones
    const { data: cards } = await supabase
      .from('bingo_cards')
      .select('id, user_id, card_number, numbers, marked_positions')
      .eq('game_id', gameId)

    console.log(`🎮 Iniciando juego ${gameId} con ${cards?.length || 0} cartones`)

    // Actualizar juego a ACTIVE
    const startedAt = new Date().toISOString()
    const { data: updatedGames, error: updateError } = await supabase
      .from('bingo_games')
      .update({
        status: 'ACTIVE',
        started_at: startedAt,
        current_number: null,
        called_numbers: [],
        updated_at: startedAt
      })
      .eq('id', gameId)
      .select('*')

    if (updateError) throw updateError

    console.log(`✅ Juego iniciado exitosamente por admin`)

    return NextResponse.json({
      success: true,
      game: updatedGames?.[0],
      players: [...new Set(cards?.map(card => card.user_id) || [])].length,
      cards: cards?.length || 0,
      message: 'Juego iniciado exitosamente'
    })

  } catch (error: any) {
    console.error('❌ Error starting game from admin:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}
