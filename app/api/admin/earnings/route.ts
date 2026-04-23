import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Base de datos no configurada' }, { status: 500 })
    }

    // 1. Obtener todos los juegos
    const { data: games } = await supabase.from('bingo_games').select('*')
    const gamesList = games || []

    // 2. Obtener solicitudes de compra aprobadas
    const { data: purchaseRequests } = await supabase.from('purchase_requests').select('*').eq('status', 'approved')
    const requestsList = purchaseRequests || []

    // 3. Obtener conteo de usuarios
    const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true })
    const registeredUsers = usersCount || 0

    // 4. Calcular estadísticas
    const activeGames = gamesList.filter(game => game.status === 'WAITING' || game.status === 'ACTIVE' || game.status === 'waiting' || game.status === 'active')
    const finishedGames = gamesList.filter(game => game.status === 'FINISHED' || game.status === 'finished')

    // En el nuevo sistema, cada registro es un cartón
    const totalCardsSold = requestsList.length
    const totalRevenue = requestsList.reduce((sum, request) => sum + (parseFloat(request.amount) || 0), 0)

    // Calcular premios pagados
    let totalPrizesPaid = 0
    finishedGames.forEach((game: any) => {
      const lineWinners = game.line_winners || []
      const twoLinesWinners = game.two_lines_winners || []
      const fullCardWinners = game.full_card_winners || []

      totalPrizesPaid += (lineWinners.length * (parseFloat(game.prize_line) || 0))
      totalPrizesPaid += (twoLinesWinners.length * (parseFloat(game.prize_two_lines) || 0))
      totalPrizesPaid += (fullCardWinners.length * (parseFloat(game.prize_full_card) || 0))
    })

    const netEarnings = totalRevenue - totalPrizesPaid

    const earnings = {
      totalCardsSold,
      totalRevenue,
      totalPrizesPaid,
      netEarnings,
      activeGames: activeGames.length,
      finishedGames: finishedGames.length,
      registeredUsers,
      gamesWithPrizes: finishedGames.filter((game: any) =>
        (game.line_winners && game.line_winners.length > 0) ||
        (game.two_lines_winners && game.two_lines_winners.length > 0) ||
        (game.full_card_winners && game.full_card_winners.length > 0)
      ).length
    }

    return NextResponse.json({
      success: true,
      earnings
    })

  } catch (error: any) {
    console.error('Error calculating earnings:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}
