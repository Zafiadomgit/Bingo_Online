import { NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    console.log('🕐 Debug - Verificando tiempos de juegos');

    // Obtener todos los juegos
    const { data: games, error } = await supabase
      .from('bingo_games')
      .select('id, name, status, scheduled_at, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching games:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Error fetching games' 
      }, { status: 500 });
    }

    const now = new Date();
    
    const debugInfo = games?.map(game => {
      const scheduledDate = game.scheduled_at ? new Date(game.scheduled_at) : null;
      const timeDiff = scheduledDate ? scheduledDate.getTime() - now.getTime() : null;
      
      return {
        id: game.id,
        name: game.name,
        status: game.status,
        scheduled_at: game.scheduled_at,
        scheduledDate: scheduledDate?.toISOString(),
        scheduledDateLocal: scheduledDate?.toString(),
        now: now.toISOString(),
        nowLocal: now.toString(),
        timeDiffMinutes: timeDiff ? (timeDiff / (1000 * 60)).toFixed(2) : null,
        isFuture: timeDiff ? timeDiff > 0 : false,
        isActive: game.status === 'ACTIVE' || game.status === 'active',
        shouldShow: timeDiff ? (timeDiff > 0 || game.status === 'ACTIVE' || game.status === 'active') : false
      };
    }) || [];

    console.log('📊 Debug info:', debugInfo);

    return NextResponse.json({
      success: true,
      debug: {
        serverTime: now.toISOString(),
        serverTimeLocal: now.toString(),
        games: debugInfo
      }
    });

  } catch (error: any) {
    console.error('Error in game times debug:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
