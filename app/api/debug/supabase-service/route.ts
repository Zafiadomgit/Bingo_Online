import { NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only'
import { SupabaseService } from '@/lib/supabase-service'

export async function GET() {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    const supabaseService = new SupabaseService()
    
    console.log('🔍 DEBUG - Probando SupabaseService.getActiveGames()')
    
    const games = await supabaseService.getActiveGames()
    
    console.log('🔍 DEBUG - Resultado de getActiveGames():')
    console.log(`Total juegos encontrados: ${games.length}`)
    
    games.forEach((game, index) => {
      console.log(`\n🎮 Juego ${index + 1}:`)
      console.log(`  ID: ${game.id}`)
      console.log(`  Nombre: ${game.name}`)
      console.log(`  Status: ${game.status}`)
      console.log(`  Scheduled_at: ${game.scheduled_at}`)
      console.log(`  Created_at: ${game.created_at}`)
    })
    
    return NextResponse.json({
      success: true,
      totalGames: games.length,
      games: games,
      debug: true
    })

  } catch (error) {
    console.error('❌ Error en debug supabase-service:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: true
    }, { status: 500 })
  }
}
