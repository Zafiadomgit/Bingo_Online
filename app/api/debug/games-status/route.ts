import { NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only'
import { SupabaseService } from '@/lib/supabase-service'

export async function GET() {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    const supabaseService = new SupabaseService()
    const games = await supabaseService.getActiveGames()
    
    const now = new Date()
    const debugInfo = games.map(game => {
      const scheduledDate = game.scheduled_at ? new Date(game.scheduled_at) : null
      const timeDiff = scheduledDate ? scheduledDate.getTime() - now.getTime() : null
      
      return {
        id: game.id,
        name: game.name,
        status: game.status,
        scheduled_at: game.scheduled_at,
        scheduledDate: scheduledDate?.toISOString(),
        now: now.toISOString(),
        timeDiffMinutes: timeDiff ? (timeDiff / (1000 * 60)).toFixed(2) : null,
        isWaiting: game.status === 'WAITING' || game.status === 'waiting',
        isActive: game.status === 'ACTIVE' || game.status === 'active',
        isFuture: timeDiff ? timeDiff > 0 : false,
        isNotFinished: game.status !== 'FINISHED' && game.status !== 'finished',
        shouldShow: (game.status !== 'FINISHED' && game.status !== 'finished') && 
                   ((game.status === 'WAITING' || game.status === 'waiting') || 
                    (game.status === 'ACTIVE' || game.status === 'active') || 
                    (timeDiff ? timeDiff > 0 : false))
      }
    })
    
    return NextResponse.json({
      success: true,
      totalGames: games.length,
      now: now.toISOString(),
      games: debugInfo
    })
    
  } catch (error) {
    console.error('Error getting games debug info:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}