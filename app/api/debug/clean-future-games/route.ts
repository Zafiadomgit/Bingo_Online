import { NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST() {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    console.log('🧹 Limpiando juegos con fechas futuras incorrectas...')
    
    // Obtener todos los juegos
    const { data: games, error: fetchError } = await supabase
      .from('bingo_games')
      .select('*')

    if (fetchError) {
      console.error('Error fetching games:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener juegos'
      }, { status: 500 })
    }

    console.log(`📊 Juegos encontrados: ${games?.length || 0}`)

    const now = new Date()
    const currentYear = now.getFullYear()
    let deletedCount = 0

    for (const game of games || []) {
      if (game.scheduled_at) {
        const scheduledDate = new Date(game.scheduled_at)
        const scheduledYear = scheduledDate.getFullYear()
        
        console.log(`🔍 Juego ${game.id}: ${game.name}`)
        console.log(`   - Fecha programada: ${game.scheduled_at}`)
        console.log(`   - Año programado: ${scheduledYear}`)
        console.log(`   - Año actual: ${currentYear}`)
        
        // Si el año programado es mayor al año actual, probablemente es un error
        if (scheduledYear > currentYear) {
          console.log(`❌ Eliminando juego con año futuro: ${game.name}`)
          
          const { error: deleteError } = await supabase
            .from('bingo_games')
            .delete()
            .eq('id', game.id)
          
          if (deleteError) {
            console.error(`Error eliminando juego ${game.id}:`, deleteError)
          } else {
            deletedCount++
            console.log(`✅ Juego eliminado: ${game.id}`)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Limpieza completada. ${deletedCount} juegos eliminados.`,
      deletedCount,
      totalGames: games?.length || 0
    })

  } catch (error: any) {
    console.error('Error in clean future games:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 })
  }
}
