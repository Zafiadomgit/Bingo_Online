import { NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only'
import { SupabaseService } from '@/lib/supabase-service'

export async function GET() {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    const supabaseService = new SupabaseService()
    const games = await supabaseService.getActiveGames()
    
    console.log('🔍 DEBUG - Todos los juegos en la base de datos:')
    console.log(`Total juegos: ${games.length}`)
    
    const now = new Date()
    
    games.forEach((game, index) => {
      console.log(`\n🎮 Juego ${index + 1}:`)
      console.log(`  ID: ${game.id}`)
      console.log(`  Nombre: ${game.name}`)
      console.log(`  Status: ${game.status}`)
      console.log(`  Scheduled_at: ${game.scheduled_at}`)
      console.log(`  Created_at: ${game.created_at}`)
      
      if (game.scheduled_at) {
        const scheduledDate = new Date(game.scheduled_at)
        const timeDiff = scheduledDate.getTime() - now.getTime()
        const timeDiffMinutes = (timeDiff / (1000 * 60)).toFixed(2)
        
        console.log(`  Scheduled Date: ${scheduledDate.toISOString()}`)
        console.log(`  Now: ${now.toISOString()}`)
        console.log(`  Time Diff: ${timeDiffMinutes} minutos`)
        console.log(`  Is Future: ${timeDiff > 0}`)
        console.log(`  Is Past: ${timeDiff < 0}`)
        
        // Aplicar el mismo filtro que en games/next
        const isWaiting = game.status === 'WAITING' || game.status === 'waiting'
        const isActive = game.status === 'ACTIVE' || game.status === 'active'
        const isFuture = timeDiff > 0
        const isNotFinished = game.status !== 'FINISHED' && game.status !== 'finished'
        
        const shouldShow = isNotFinished && (isWaiting || isActive || isFuture)
        
        console.log(`  Filtro:`)
        console.log(`    - IsWaiting: ${isWaiting}`)
        console.log(`    - IsActive: ${isActive}`)
        console.log(`    - IsFuture: ${isFuture}`)
        console.log(`    - IsNotFinished: ${isNotFinished}`)
        console.log(`    - ShouldShow: ${shouldShow}`)
      } else {
        console.log(`  ❌ No tiene scheduled_at`)
      }
    })
    
    // Aplicar el filtro completo
    const upcomingGames = games.filter(game => {
      if (!game.scheduled_at) {
        return false
      }
      
      const scheduledDate = new Date(game.scheduled_at)
      const timeDiff = scheduledDate.getTime() - now.getTime()
      
      const isWaiting = game.status === 'WAITING' || game.status === 'waiting'
      const isActive = game.status === 'ACTIVE' || game.status === 'active'
      const isFuture = timeDiff > 0
      const isNotFinished = game.status !== 'FINISHED' && game.status !== 'finished'
      
      return isNotFinished && (isWaiting || isActive || isFuture)
    })
    
    console.log(`\n🎯 RESULTADO FINAL:`)
    console.log(`Juegos que pasan el filtro: ${upcomingGames.length}`)
    
    if (upcomingGames.length > 0) {
      const nextGame = upcomingGames.sort((a, b) => 
        new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime()
      )[0]
      
      console.log(`\n✅ Próximo juego seleccionado:`)
      console.log(`  ID: ${nextGame.id}`)
      console.log(`  Nombre: ${nextGame.name}`)
      console.log(`  Status: ${nextGame.status}`)
      console.log(`  Scheduled: ${nextGame.scheduled_at}`)
      
      return NextResponse.json({
        success: true,
        totalGames: games.length,
        filteredGames: upcomingGames.length,
        nextGame: nextGame,
        canPurchase: nextGame.status === 'WAITING' || nextGame.status === 'waiting',
        debug: true
      })
    } else {
      console.log(`\n❌ No hay juegos que pasen el filtro`)
      
      return NextResponse.json({
        success: false,
        totalGames: games.length,
        filteredGames: 0,
        message: "No hay juegos disponibles",
        debug: true
      })
    }

  } catch (error) {
    console.error('❌ Error en debug next-game:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      debug: true
    }, { status: 500 })
  }
}
