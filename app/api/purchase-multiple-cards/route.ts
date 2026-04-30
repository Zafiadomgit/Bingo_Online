import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { generateBingoCard } from '@/lib/bingo-utils'
import { v4 as uuidv4 } from 'uuid'

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
    const { gameId, quantity } = await request.json()

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: 'Token requerido' }, { status: 401 })

    const userData = verifyToken(authHeader.substring(7))
    if (!userData) return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 })
    if (!gameId || !quantity || quantity < 1) return NextResponse.json({ success: false, error: 'gameId y quantity requeridos' }, { status: 400 })

    const games = await supabaseFetch(`bingo_games?id=eq.${gameId}&limit=1`)
    const game = games?.[0]
    if (!game) return NextResponse.json({ success: false, error: 'Juego no encontrado' }, { status: 404 })
    if (game.status !== 'WAITING') return NextResponse.json({ success: false, error: 'El juego ya comenzó o terminó' }, { status: 400 })

    const users = await supabaseFetch(`users?id=eq.${userData.id}&limit=1`)
    const user = users?.[0]
    if (!user) return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })

    const totalCost = quantity * parseFloat(String(game.card_price))
    if (user.credits < totalCost) return NextResponse.json({ success: false, error: 'Créditos insuficientes' }, { status: 400 })

    // Contar cartones actuales
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esrrtfjzxrosytuwfokn.supabase.co'
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const countRes = await fetch(`${supabaseUrl}/rest/v1/bingo_cards?game_id=eq.${gameId}`, {
      method: 'HEAD', headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Prefer': 'count=exact' }, cache: 'no-store'
    })
    const cardCount = parseInt(countRes.headers.get('content-range')?.split('/')[1] || '0')
    if (cardCount + quantity > game.max_cards) return NextResponse.json({ success: false, error: 'No hay suficientes cartones disponibles' }, { status: 400 })

    // Crear cartones
    const cardsToInsert = []
    for (let i = 0; i < quantity; i++) {
      const bingoCard = generateBingoCard()
      cardsToInsert.push({ id: uuidv4(), game_id: gameId, user_id: userData.id, card_number: cardCount + i + 1, numbers: bingoCard.numbers, marked_positions: bingoCard.marked_positions, is_winner: false })
    }
    const cards = await supabaseFetch('bingo_cards', { method: 'POST', body: JSON.stringify(cardsToInsert) })

    // Descontar créditos
    await supabaseFetch(`users?id=eq.${userData.id}`, { method: 'PATCH', body: JSON.stringify({ credits: user.credits - totalCost }) })

    return NextResponse.json({ success: true, cards, totalCost, quantity })
  } catch (error: any) {
    console.error('Error purchasing multiple cards:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
