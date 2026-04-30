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
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')
    if (!gameId) return NextResponse.json({ success: false, error: 'gameId requerido' }, { status: 400 })

    const cards = await supabaseFetch(`bingo_cards?game_id=eq.${gameId}&order=card_number.asc`) || []
    const userIds = [...new Set(cards.map((c: any) => c.user_id))]

    const userMap: Record<string, any> = {}
    for (const uid of userIds) {
      const users = await supabaseFetch(`users?id=eq.${uid}&select=id,email,display_name&limit=1`)
      if (users?.[0]) userMap[uid] = users[0]
    }

    const cardsWithUsers = cards.map((card: any) => ({
      ...card,
      user: userMap[card.user_id] || { id: card.user_id, email: 'Desconocido', display_name: 'Desconocido' }
    }))

    return NextResponse.json({ success: true, cards: cardsWithUsers, totalCards: cards.length, totalPlayers: userIds.length })
  } catch (error: any) {
    console.error('Error in all-cards:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
