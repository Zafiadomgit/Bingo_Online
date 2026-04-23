import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function supabaseFetch(path: string, options: any = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esrrtfjzxrosytuwfokn.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {})
    },
    cache: 'no-store'
  })
  if (!res.ok) { const err = await res.text(); throw new Error(`Supabase: ${err}`) }
  const text = await res.text(); return text ? JSON.parse(text) : null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      return NextResponse.json({ success: false, error: 'gameId es requerido' }, { status: 400 })
    }

    // 1. Obtener el juego
    const games = await supabaseFetch(`bingo_games?id=eq.${gameId}&limit=1`)
    const game = games?.[0]

    if (!game) {
      return NextResponse.json({ success: false, error: 'Juego no encontrado' }, { status: 404 })
    }

    // 2. Contar cartones vendidos (aprobados)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esrrtfjzxrosytuwfokn.supabase.co'
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    const countRes = await fetch(
      `${supabaseUrl}/rest/v1/bingo_cards?game_id=eq.${gameId}`,
      {
        method: 'HEAD',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Prefer': 'count=exact'
        },
        cache: 'no-store'
      }
    )
    const cardsSold = parseInt(countRes.headers.get('content-range')?.split('/')[1] || '0')

    // 3. Calcular ingresos totales
    const cardPrice = parseFloat(String(game.card_price || 0))
    const totalRevenue = cardsSold * cardPrice

    // 4. Calcular premios según configuración
    let prizes = {
      fullCard: 0,
      twoLines: 0,
      line: 0
    }

    if (game.use_percentage_prizes) {
      // Premios por porcentaje de ingresos
      prizes.fullCard = totalRevenue * (parseFloat(String(game.prize_full_card_percentage || 0)) / 100)
      prizes.twoLines = totalRevenue * (parseFloat(String(game.prize_two_lines_percentage || 0)) / 100)
      prizes.line = totalRevenue * (parseFloat(String(game.prize_line_percentage || 0)) / 100)
    } else {
      // Premios fijos
      prizes.fullCard = parseFloat(String(game.prize_full_card || 0))
      prizes.twoLines = parseFloat(String(game.prize_two_lines || 0))
      prizes.line = parseFloat(String(game.prize_line || 0))
    }

    const totalPrizes = prizes.fullCard + prizes.twoLines + prizes.line
    const houseProfit = totalRevenue - totalPrizes

    return NextResponse.json({
      success: true,
      game: {
        id: game.id,
        name: game.name,
        status: game.status,
        cardsSold,
        cardPrice,
        totalRevenue,
        currency: game.currency || 'USD',
        usePercentagePrizes: game.use_percentage_prizes,
        prizeFullCardPct: game.prize_full_card_percentage,
        prizeTwoLinesPct: game.prize_two_lines_percentage,
        prizeLinePct: game.prize_line_percentage,
      },
      prizes,
      totalPrizes,
      houseProfit
    })

  } catch (error: any) {
    console.error('Error calculating prizes:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}
