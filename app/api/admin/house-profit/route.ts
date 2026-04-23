import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function supabaseFetch(path: string, options: any = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esrrtfjzxrosytuwfokn.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation', ...(options.headers || {}) },
    cache: 'no-store'
  })
  if (!res.ok) { const err = await res.text(); throw new Error(`Supabase: ${err}`) }
  const text = await res.text(); return text ? JSON.parse(text) : null
}

export async function GET() {
  try {
    // Obtener el juego más reciente
    const games = await supabaseFetch('bingo_games?status=in.(WAITING,ACTIVE,FINISHED,waiting,active,finished)&order=created_at.desc&limit=1')
    const game = games?.[0]

    if (!game) {
      return NextResponse.json({
        success: true,
        summary: { totalRevenue: 0, totalPrizes: 0, totalHouseProfit: 0, profitMargin: 0 },
        byCurrency: {
          USD: { totalRevenue: 0, totalPrizes: 0, totalHouseProfit: 0, profitMargin: 0 },
          VES: { totalRevenue: 0, totalPrizes: 0, totalHouseProfit: 0, profitMargin: 0 }
        },
        gameId: null, gameName: null
      })
    }

    // Contar cartones vendidos
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esrrtfjzxrosytuwfokn.supabase.co'
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const countRes = await fetch(`${supabaseUrl}/rest/v1/bingo_cards?game_id=eq.${game.id}`, {
      method: 'HEAD',
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Prefer': 'count=exact' },
      cache: 'no-store'
    })
    const cardsSold = parseInt(countRes.headers.get('content-range')?.split('/')[1] || '0')

    const cardPrice = parseFloat(String(game.card_price || 0))
    const gameRevenue = cardsSold * cardPrice
    let gamePrizes = 0

    if (game.use_percentage_prizes) {
      gamePrizes =
        (gameRevenue * parseFloat(String(game.prize_line_percentage || 0)) / 100) +
        (gameRevenue * parseFloat(String(game.prize_two_lines_percentage || 0)) / 100) +
        (gameRevenue * parseFloat(String(game.prize_full_card_percentage || 0)) / 100)
    } else {
      gamePrizes = parseFloat(String(game.prize_line || 0)) + parseFloat(String(game.prize_two_lines || 0)) + parseFloat(String(game.prize_full_card || 0))
    }

    const gameProfit = gameRevenue - gamePrizes
    const gameCurrency = game.currency || 'USD'

    const totalRevenueUSD = gameCurrency === 'USD' ? gameRevenue : 0
    const totalPrizesUSD = gameCurrency === 'USD' ? gamePrizes : 0
    const totalHouseProfitUSD = gameCurrency === 'USD' ? gameProfit : 0
    const totalRevenueVES = gameCurrency === 'VES' ? gameRevenue : 0
    const totalPrizesVES = gameCurrency === 'VES' ? gamePrizes : 0
    const totalHouseProfitVES = gameCurrency === 'VES' ? gameProfit : 0

    return NextResponse.json({
      success: true,
      summary: {
        totalRevenue: gameRevenue, totalPrizes: gamePrizes, totalHouseProfit: gameProfit,
        profitMargin: gameRevenue > 0 ? ((gameProfit / gameRevenue) * 100).toFixed(2) : 0
      },
      byCurrency: {
        USD: { totalRevenue: totalRevenueUSD, totalPrizes: totalPrizesUSD, totalHouseProfit: totalHouseProfitUSD, profitMargin: totalRevenueUSD > 0 ? ((totalHouseProfitUSD / totalRevenueUSD) * 100).toFixed(2) : 0 },
        VES: { totalRevenue: totalRevenueVES, totalPrizes: totalPrizesVES, totalHouseProfit: totalHouseProfitVES, profitMargin: totalRevenueVES > 0 ? ((totalHouseProfitVES / totalRevenueVES) * 100).toFixed(2) : 0 }
      },
      gameId: game.id, gameName: game.name, currency: gameCurrency
    })
  } catch (error: any) {
    console.error('Error in house-profit API:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
