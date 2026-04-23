import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Endpoint para limpiar cartones de juegos finalizados
export async function POST(request: Request) {
  try {
    const { gameId } = await request.json()

    if (!gameId) {
      return NextResponse.json({ success: false, error: 'gameId requerido' }, { status: 400 })
    }

    // Verificar que el juego esté finalizado
    const { data: game, error: gameError } = await supabase
      .from('bingo_games')
      .select('status')
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ success: false, error: 'Juego no encontrado' }, { status: 404 })
    }

    if (game.status !== 'FINISHED') {
      return NextResponse.json({ 
        success: false, 
        error: 'Solo se pueden limpiar juegos finalizados' 
      }, { status: 400 })
    }

    // Eliminar los cartones del juego
    const { error: deleteError } = await supabase
      .from('bingo_cards')
      .delete()
      .eq('game_id', gameId)

    if (deleteError) {
      console.error('Error deleting cards:', deleteError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al eliminar cartones' 
      }, { status: 500 })
    }

    // Resetear números de cartón disponibles
    const { error: resetError } = await supabase
      .from('card_numbers')
      .update({ status: 'available', user_email: null })
      .eq('game_id', gameId)

    if (resetError) {
      console.error('Error resetting card numbers:', resetError)
    }

    return NextResponse.json({
      success: true,
      message: 'Cartones eliminados exitosamente'
    })

  } catch (error) {
    console.error('Error in cleanup API:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

