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
    const games = await supabaseFetch('bingo_games?status=in.(WAITING,ACTIVE,FINISHED,waiting,active,finished)&order=created_at.desc&limit=1') || []
    const game = games[0]
    if (!game) return NextResponse.json({ success: true, totalRevenue: 0, totalPrizes: 0, profit: 0, currency: 'USD' })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esrrtfjzxrosytuwfokn.supabase.co'
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const countRes = await fetch(`${supabaseUrl}/rest/v1/bingo_cards?game_id=eq.${game.id}`, {
      method: 'HEAD', headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Prefer': 'count=exact' }, cache: 'no-store'
    })
    const cardsSold = parseInt(countRes.headers.get('content-range')?.split('/')[1] || '0')
    const totalRevenue = cardsSold * parseFloat(String(game.card_price || 0))

    let totalPrizes = 0
    if (game.use_percentage_prizes) {
      totalPrizes = totalRevenue * ((parseFloat(String(game.prize_line_percentage || 0)) + parseFloat(String(game.prize_two_lines_percentage || 0)) + parseFloat(String(game.prize_full_card_percentage || 0))) / 100)
    } else {
      totalPrizes = parseFloat(String(game.prize_line || 0)) + parseFloat(String(game.prize_two_lines || 0)) + parseFloat(String(game.prize_full_card || 0))
    }

    return NextResponse.json({ success: true, totalRevenue, totalPrizes, profit: totalRevenue - totalPrizes, currency: game.currency || 'USD', gameId: game.id, gameName: game.name })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
