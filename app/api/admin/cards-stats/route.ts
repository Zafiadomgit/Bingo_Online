import { NextRequest, NextResponse } from 'next/server'

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

export async function GET(request: NextRequest) {
  try {
    const games = await supabaseFetch('bingo_games?order=created_at.desc&limit=1&select=id,name,card_price,currency,status')
    const latestGame = games?.[0]

    if (!latestGame) {
      return NextResponse.json({ success: true, totalCardsSold: 0, totalRevenue: 0, gameId: null, gameName: null, currency: 'USD' })
    }

    // Contar cartones usando HEAD request con Prefer: count=exact
    const countUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esrrtfjzxrosytuwfokn.supabase.co'}/rest/v1/bingo_cards?game_id=eq.${latestGame.id}`
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const countRes = await fetch(countUrl, {
      method: 'HEAD',
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Prefer': 'count=exact' },
      cache: 'no-store'
    })
    const totalCardsSold = parseInt(countRes.headers.get('content-range')?.split('/')[1] || '0')
    const totalRevenue = totalCardsSold * parseFloat(String(latestGame.card_price || 0))

    return NextResponse.json({
      success: true, totalCardsSold, totalRevenue,
      gameId: latestGame.id, gameName: latestGame.name, currency: latestGame.currency || 'USD'
    })
  } catch (error: any) {
    console.error('Error in cards-stats:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
