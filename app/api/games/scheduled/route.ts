import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Obteniendo juegos programados...')
    
    // Obtener todos los juegos programados usando supabaseAdmin para bypass RLS
    const clientToUse = supabaseAdmin || supabase
    const { data: games, error: gamesError } = await clientToUse
      .from('bingo_games')
      .select('*')
      .not('scheduled_at', 'is', null)
      .order('scheduled_at', { ascending: true })

    if (gamesError) {
      console.error('❌ Error getting scheduled games:', gamesError)
      return NextResponse.json(
        { success: false, error: 'Error obteniendo sorteos programados' },
        { status: 500 }
      )
    }

    console.log(`📊 ${games?.length || 0} juegos encontrados en la base de datos`)

    // Calcular tiempo restante para cada juego
    const now = new Date()
    const scheduledGames = games?.map(game => {
      const scheduledDate = new Date(game.scheduled_at)
      const timeRemaining = scheduledDate.getTime() - now.getTime()
      
      console.log(`🎮 Juego ${game.id}: ${game.name}`)
      console.log(`   - Status: ${game.status}`)
      console.log(`   - Scheduled: ${game.scheduled_at}`)
      console.log(`   - Time remaining: ${(timeRemaining / (1000 * 60)).toFixed(2)} min`)
      console.log(`   - Is overdue: ${timeRemaining < 0}`)
      
      return {
        ...game,
        timeRemaining: timeRemaining > 0 ? timeRemaining : 0,
        isOverdue: timeRemaining < 0
      }
    }) || []

    console.log(`✅ Devolviendo ${scheduledGames.length} juegos programados`)

    return NextResponse.json({
      success: true,
      games: scheduledGames,
      total: scheduledGames.length
    })

  } catch (error) {
    console.error('Error getting scheduled games:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
