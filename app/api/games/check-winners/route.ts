import { NextRequest, NextResponse } from 'next/server'
import { checkBingoWin } from '@/lib/bingo-utils'

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

export async function POST(request: NextRequest) {
  try {
    const { gameId, userId } = await request.json()
    if (!gameId || !userId) return NextResponse.json({ success: false, error: 'Game ID y User ID son requeridos' }, { status: 400 })

    const games = await supabaseFetch(`bingo_games?id=eq.${gameId}&limit=1`)
    const game = games?.[0]
    if (!game) return NextResponse.json({ success: false, error: 'Juego no encontrado' }, { status: 404 })

    const userCards = await supabaseFetch(`bingo_cards?game_id=eq.${gameId}&user_id=eq.${userId}&is_winner=eq.false`) || []
    const users = await supabaseFetch(`users?id=eq.${userId}&select=display_name,email&limit=1`)
    const user = users?.[0]
    const calledNumbers: number[] = game.called_numbers || []
    const winners = []

    for (const card of userCards) {
      const winTypes: { type: 'line' | 'two-lines' | 'full-card'; field: string }[] = [
        { type: 'full-card', field: 'full_card_winners' },
        { type: 'two-lines', field: 'two_lines_winners' },
        { type: 'line', field: 'line_winners' },
      ]
      for (const { type, field } of winTypes) {
        if ((game[field] || []).length > 0) continue
        const hasWon = checkBingoWin(card.numbers, card.marked_positions, calledNumbers, type)
        if (hasWon) {
          await supabaseFetch(`bingo_cards?id=eq.${card.id}`, { method: 'PATCH', body: JSON.stringify({ is_winner: true }) })
          winners.push({
            id: `${card.id}-${type}-${Date.now()}`,
            cardNumber: card.card_number,
            userName: user?.display_name || user?.email || `Usuario`,
            winType: type, timestamp: new Date().toISOString()
          })
          break
        }
      }
    }

    return NextResponse.json({ success: true, winners, totalWinners: winners.length })
  } catch (error: any) {
    console.error('Error checking winners:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
