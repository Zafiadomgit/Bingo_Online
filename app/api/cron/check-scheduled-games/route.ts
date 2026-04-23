import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const now = new Date()
    console.log('🕐 [CRON] Verificando juegos programados...', now.toISOString())
    console.log('🕐 [CRON] Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone)

    // Buscar juegos que deberían iniciarse
    const { data: scheduledGames, error } = await supabase
      .from('bingo_games')
      .select('*')
      .eq('status', 'WAITING')
      .eq('auto_start', true)
      .lte('scheduled_at', now.toISOString())

    console.log('🕐 [CRON] Búsqueda completada. Criterios:', {
      status: 'WAITING',
      auto_start: true,
      scheduled_at_lte: now.toISOString()
    })

    if (error) {
      console.error('Error getting scheduled games:', error)
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo juegos programados'
      })
    }

    if (!scheduledGames || scheduledGames.length === 0) {
      // Obtener estadísticas para debugging
      const { data: allGames } = await supabase
        .from('bingo_games')
        .select('id, name, status, auto_start, scheduled_at')
        .order('created_at', { ascending: false })
        .limit(10)

      console.log('✅ [CRON] No hay juegos programados para iniciar')
      console.log('📊 [CRON] Últimos 10 juegos en BD:', allGames)

      return NextResponse.json({
        success: true,
        message: 'No hay juegos programados para iniciar',
        gamesChecked: 0,
        debug: {
          timestamp: now.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          recentGames: allGames
        }
      })
    }

    console.log(`🎮 Encontrados ${scheduledGames.length} juegos para iniciar`)

    const results = []

    for (const game of scheduledGames) {
      try {
        // Verificar si el juego tiene cartones
        const { data: cards, error: cardsError } = await supabase
          .from('bingo_cards')
          .select('id')
          .eq('game_id', game.id)

        if (cardsError) {
          console.error(`Error checking cards for game ${game.id}:`, cardsError)
          results.push({ gameId: game.id, success: false, error: 'Error verificando cartones' })
          continue
        }

        if (!cards || cards.length === 0) {
          console.log(`⚠️ [WARNING] Juego ${game.id} no tiene cartones, pero se iniciará de todas formas (modo testing)`)
          // No bloqueamos el inicio, solo advertimos
        }

        // Iniciar el juego en modo "esperando" (60 segundos)
        const cardsCount = cards ? cards.length : 0
        console.log(`🚀 Iniciando juego ${game.id} con ${cardsCount} cartones en modo ACTIVE_WAITING`)

        const waitingUntil = new Date(Date.now() + 60000) // 60 segundos

        // Actualizar estado del juego a ACTIVE_WAITING
        const { error: updateError } = await supabase
          .from('bingo_games')
          .update({
            status: 'ACTIVE_WAITING',
            started_at: new Date().toISOString(),
            waiting_until: waitingUntil.toISOString()
          })
          .eq('id', game.id)

        if (updateError) {
          console.error(`Error starting game ${game.id}:`, updateError)
          results.push({ gameId: game.id, success: false, error: updateError.message })
          continue
        }

        // Obtener usuarios únicos con cartones
        const { data: userCards, error: userCardsError } = await supabase
          .from('bingo_cards')
          .select('user_id')
          .eq('game_id', game.id)

        if (userCardsError) {
          console.error(`Error getting user cards for game ${game.id}:`, userCardsError)
        }

        const userIds = [...new Set(userCards?.map((card: any) => card.user_id) || [])]

        // Enviar notificaciones con auto-redirect
        const notifications = userIds.map(userId => ({
          user_id: userId,
          game_id: game.id,
          type: 'game_auto_started_redirect',
          title: '¡El juego está por comenzar!',
          message: `El juego "${game.name}" comenzará en 60 segundos. Redirigiendo...`,
          is_read: false,
          metadata: {
            auto_redirect: true,
            redirect_url: `/game/${game.id}`
          }
        }))

        // Notificación especial para el admin
        const adminNotification = {
          user_id: '00000000-0000-0000-0000-000000000000',
          game_id: game.id,
          type: 'game_auto_started_redirect',
          title: '🎮 Juego Auto-iniciado',
          message: `El juego "${game.name}" se ha iniciado automáticamente. Redirigiendo...`,
          is_read: false,
          metadata: {
            auto_redirect: true,
            redirect_url: `/game/${game.id}`
          }
        }

        notifications.push(adminNotification)

        if (notifications.length > 0) {
          const { error: notificationError } = await supabase
            .from('game_notifications')
            .insert(notifications)

          if (notificationError) {
            console.error(`Error sending notifications for game ${game.id}:`, notificationError)
          } else {
            console.log(`📢 Notificaciones enviadas a ${userIds.length} usuarios`)
          }
        }

        results.push({
          gameId: game.id,
          success: true,
          players: userIds.length,
          cards: cardsCount,
          message: 'Juego iniciado exitosamente'
        })

        console.log(`✅ Juego ${game.id} iniciado exitosamente`)

      } catch (gameError) {
        console.error(`Error processing game ${game.id}:`, gameError)
        results.push({
          gameId: game.id,
          success: false,
          error: gameError instanceof Error ? gameError.message : 'Error desconocido'
        })
      }
    }

    const successfulGames = results.filter(r => r.success).length
    const failedGames = results.filter(r => !r.success).length

    console.log(`✅ Proceso completado: ${successfulGames} exitosos, ${failedGames} fallidos`)

    return NextResponse.json({
      success: true,
      message: `Procesados ${scheduledGames.length} juegos`,
      results,
      summary: {
        total: scheduledGames.length,
        successful: successfulGames,
        failed: failedGames
      }
    })

  } catch (error) {
    console.error('Error in cron job:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// También permitir GET para testing
export async function GET() {
  return POST()
}
