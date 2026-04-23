import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// CRON Job para limpiar cartones de juegos terminados despues de 15 minutos
export async function GET(request: NextRequest) {
  try {
    console.log('🧹 Iniciando limpieza automática de cartones...')

    // Verificar token de autorización de Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ Acceso no autorizado al cron')
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Calcular tiempo límite (15 minutos atrás)
    const fifteenMinutesAgo = new Date()
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15)

    console.log(`🕐 Buscando juegos terminados antes de: ${fifteenMinutesAgo.toISOString()}`)

    // Buscar juegos terminados hace más de 15 minutos
    const { data: finishedGames, error: gamesError } = await supabase
      .from('bingo_games')
      .select('id, name, finished_at')
      .eq('status', 'FINISHED')
      .lt('finished_at', fifteenMinutesAgo.toISOString())
      .limit(50) // Limitar para evitar sobrecarga

    if (gamesError) {
      console.error('Error obteniendo juegos:', gamesError)
      return NextResponse.json(
        { success: false, error: 'Error obteniendo juegos' },
        { status: 500 }
      )
    }

    if (!finishedGames || finishedGames.length === 0) {
      console.log('✅ No hay juegos para limpiar')
      return NextResponse.json({
        success: true,
        message: 'No hay juegos para limpiar',
        gamesProcessed: 0
      })
    }

    console.log(`📦 Encontrados ${finishedGames.length} juegos para limpiar`)

    let successCount = 0
    let errorCount = 0

    // Procesar cada juego
    for (const game of finishedGames) {
      try {
        console.log(`🧹 Limpiando juego: ${game.name} (${game.id})`)

        // Eliminar cartones
        const { error: deleteCardsError, count: deletedCards } = await supabase
          .from('bingo_cards')
          .delete({ count: 'exact' })
          .eq('game_id', game.id)

        if (deleteCardsError) {
          console.error(`Error eliminando cartones del juego ${game.id}:`, deleteCardsError)
          errorCount++
          continue
        }

        console.log(`  ✓ ${deletedCards || 0} cartones eliminados`)

        // Resetear números de cartón disponibles
        const { error: resetError } = await supabase
          .from('card_numbers')
          .update({ status: 'available', user_email: null })
          .eq('game_id', game.id)

        if (resetError) {
          console.error(`Error reseteando números del juego ${game.id}:`, resetError)
        }

        successCount++
        console.log(`  ✅ Juego ${game.name} limpiado exitosamente`)

      } catch (error) {
        console.error(`Error procesando juego ${game.id}:`, error)
        errorCount++
      }
    }

    console.log(`\n📊 Limpieza completada:`)
    console.log(`  ✅ Exitosos: ${successCount}`)
    console.log(`  ❌ Errores: ${errorCount}`)

    return NextResponse.json({
      success: true,
      message: 'Limpieza completada',
      gamesProcessed: finishedGames.length,
      successCount,
      errorCount,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error en CRON de limpieza:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Permitir también POST para testing manual
export async function POST(request: NextRequest) {
  return GET(request)
}

