import { NextRequest, NextResponse } from 'next/server'
import { checkBingoWin } from '@/lib/bingo-utils'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

const MAX_LINE_WINNERS = 2
const MAX_TWO_LINES_WINNERS = 2

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

async function calculatePrizes(game: any) {
  if (!game.use_percentage_prizes) {
    return {
      line: parseFloat(String(game.prize_line || 0)),
      twoLines: parseFloat(String(game.prize_two_lines || 0)),
      fullCard: parseFloat(String(game.prize_full_card || 0))
    }
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esrrtfjzxrosytuwfokn.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const countRes = await fetch(`${supabaseUrl}/rest/v1/bingo_cards?game_id=eq.${game.id}`, {
    method: 'HEAD',
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Prefer': 'count=exact' },
    cache: 'no-store'
  })
  const cardsSold = parseInt(countRes.headers.get('content-range')?.split('/')[1] || '0')
  const totalRevenue = cardsSold * parseFloat(String(game.card_price || 0))
  return {
    line: totalRevenue * (parseFloat(String(game.prize_line_percentage || 0)) / 100),
    twoLines: totalRevenue * (parseFloat(String(game.prize_two_lines_percentage || 0)) / 100),
    fullCard: totalRevenue * (parseFloat(String(game.prize_full_card_percentage || 0)) / 100)
  }
}

async function saveWinnerNotification(userId: string, gameId: string, gameName: string, prizeType: string, prizeAmount: number, cardNumber: number, currency: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esrrtfjzxrosytuwfokn.supabase.co'
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    
    // 1. Evitar notificaciones duplicadas para el mismo cartón y premio
    const checkRes = await fetch(`${supabaseUrl}/rest/v1/winner_notifications?game_id=eq.${gameId}&prize_type=eq.${prizeType}&card_number=eq.${cardNumber}`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
      cache: 'no-store'
    })
    if (checkRes.ok) {
      const existing = await checkRes.json()
      if (existing && existing.length > 0) return; // Ya existe esta notificación exacta
    }

    // 2. Verificar límites globales para evitar spam si hay concurrencia
    let maxLimit = 999;
    if (prizeType === 'full_card') maxLimit = 1;
    if (prizeType === 'line' || prizeType === 'two_lines') maxLimit = 2;

    if (maxLimit < 999) {
      const limitRes = await fetch(`${supabaseUrl}/rest/v1/winner_notifications?game_id=eq.${gameId}&prize_type=eq.${prizeType}`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
        cache: 'no-store'
      })
      if (limitRes.ok) {
        const existingType = await limitRes.json()
        if (existingType && existingType.length >= maxLimit) return; // Límite alcanzado
      }
    }

    await fetch(`${supabaseUrl}/rest/v1/winner_notifications`, {
      method: 'POST',
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify({ id: uuidv4(), user_id: userId, game_id: gameId, game_name: gameName, prize_type: prizeType, prize_amount: prizeAmount, card_number: cardNumber, currency }),
      cache: 'no-store'
    })
  } catch (e) { console.error('Error saving winner notification:', e) }
}

export async function POST(request: NextRequest) {
  try {
    const { gameId } = await request.json()
    if (!gameId) return NextResponse.json({ success: false, error: 'gameId requerido' }, { status: 400 })

    const games = await supabaseFetch(`bingo_games?id=eq.${gameId}&limit=1`)
    const game = games?.[0]
    if (!game) return NextResponse.json({ success: false, error: 'Juego no encontrado' }, { status: 404 })
    if (game.status !== 'ACTIVE') return NextResponse.json({ success: false, error: 'El juego no está activo', gameFinished: game.status === 'FINISHED' })

    const calledNumbers = game.called_numbers || []
    let availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1).filter(n => !calledNumbers.includes(n))
    if (availableNumbers.length === 0) availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1)

    const newNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)]
    const updatedCalledNumbers = calledNumbers.includes(newNumber)
      ? calledNumbers : [...calledNumbers, newNumber].sort((a, b) => a - b)

    const allCards = await supabaseFetch(`bingo_cards?game_id=eq.${gameId}`) || []

    const lineWinners: any[] = []
    const twoLinesWinners: any[] = []
    const fullCardWinners: any[] = []

    const existingLineWinners = game.line_winners || []
    const existingTwoLinesWinners = game.two_lines_winners || []
    const hasFullCardWinner = (game.full_card_winners || []).length > 0

    // Verificar si ya se alcanzó el máximo de ganadores para línea y dos líneas
    const lineSlots = MAX_LINE_WINNERS - existingLineWinners.length
    const twoLinesSlots = MAX_TWO_LINES_WINNERS - existingTwoLinesWinners.length

    for (const card of allCards) {
      if (card.numbers.includes(newNumber)) {
        const updatedMarked = [...card.marked_positions]
        updatedMarked[card.numbers.indexOf(newNumber)] = true

        await supabaseFetch(`bingo_cards?id=eq.${card.id}`, {
          method: 'PATCH', body: JSON.stringify({ marked_positions: updatedMarked })
        })

        if (!hasFullCardWinner) {
          // Cartón lleno — solo 1 ganador, termina el juego
          const hasFullCard = fullCardWinners.length === 0 &&
            checkBingoWin(card.numbers, updatedMarked, updatedCalledNumbers, 'full-card')

          // Dos líneas — máximo 2 ganadores, no puede ganar si ya ganó este cartón
          const alreadyWonTwoLines = existingTwoLinesWinners.some((w: any) => w.card_id === card.id)
          const hasTwoLines = !hasFullCard && !alreadyWonTwoLines && twoLinesSlots > twoLinesWinners.length &&
            checkBingoWin(card.numbers, updatedMarked, updatedCalledNumbers, 'two-lines')

          // Línea — máximo 2 ganadores, no puede ganar si ya ganó este cartón
          const alreadyWonLine = existingLineWinners.some((w: any) => w.card_id === card.id)
          const hasLine = !hasFullCard && !hasTwoLines && !alreadyWonLine && lineSlots > lineWinners.length &&
            checkBingoWin(card.numbers, updatedMarked, updatedCalledNumbers, 'line')

          if (hasFullCard) {
            fullCardWinners.push({ ...card, updatedMarked })
            await supabaseFetch(`bingo_cards?id=eq.${card.id}`, { method: 'PATCH', body: JSON.stringify({ is_winner: true }) })
          } else if (hasTwoLines) {
            twoLinesWinners.push({ ...card, updatedMarked })
            await supabaseFetch(`bingo_cards?id=eq.${card.id}`, { method: 'PATCH', body: JSON.stringify({ is_winner: true }) })
          } else if (hasLine) {
            lineWinners.push({ ...card, updatedMarked })
            await supabaseFetch(`bingo_cards?id=eq.${card.id}`, { method: 'PATCH', body: JSON.stringify({ is_winner: true }) })
          }
        }
      }
    }

    const prizes = await calculatePrizes(game)
    const newWinners: any[] = []

    const allWinnerIds = [...new Set([...lineWinners, ...twoLinesWinners, ...fullCardWinners].map(w => w.user_id))]
    const userInfoMap: Record<string, any> = {}
    for (const uid of allWinnerIds) {
      const users = await supabaseFetch(`users?id=eq.${uid}&select=id,email,display_name&limit=1`)
      const u = users?.[0]
      if (u) {
        const reqs = await supabaseFetch(`purchase_requests?email=ilike.${encodeURIComponent(u.email)}&telefono=not.is.null&order=created_at.desc&limit=1&select=telefono`)
        userInfoMap[uid] = { email: u.email, display_name: u.display_name, telefono: reqs?.[0]?.telefono || '' }
      }
    }

    const updateData: any = { current_number: newNumber, called_numbers: updatedCalledNumbers }

    if (lineWinners.length > 0) {
      const newLineWinners = lineWinners.map(w => ({ user_id: w.user_id, user_email: userInfoMap[w.user_id]?.email || '', user_name: userInfoMap[w.user_id]?.display_name || '', user_phone: userInfoMap[w.user_id]?.telefono || '', card_id: w.id, card_number: w.card_number, prize_amount: prizes.line, won_at: new Date().toISOString() }))
      updateData.line_winners = [...existingLineWinners, ...newLineWinners]
      for (const w of lineWinners) await saveWinnerNotification(w.user_id, game.id, game.name, 'line', prizes.line, w.card_number, game.currency || 'USD')
      newWinners.push(...lineWinners.map(w => ({ ...w, prize_type: 'line', prize_amount: prizes.line })))
    }
    if (twoLinesWinners.length > 0) {
      const newTwoLinesWinners = twoLinesWinners.map(w => ({ user_id: w.user_id, user_email: userInfoMap[w.user_id]?.email || '', user_name: userInfoMap[w.user_id]?.display_name || '', user_phone: userInfoMap[w.user_id]?.telefono || '', card_id: w.id, card_number: w.card_number, prize_amount: prizes.twoLines, won_at: new Date().toISOString() }))
      updateData.two_lines_winners = [...existingTwoLinesWinners, ...newTwoLinesWinners]
      for (const w of twoLinesWinners) await saveWinnerNotification(w.user_id, game.id, game.name, 'two_lines', prizes.twoLines, w.card_number, game.currency || 'USD')
      newWinners.push(...twoLinesWinners.map(w => ({ ...w, prize_type: 'two_lines', prize_amount: prizes.twoLines })))
    }
    if (fullCardWinners.length > 0 && !hasFullCardWinner) {
      const newFullCardWinners = fullCardWinners.map(w => ({ user_id: w.user_id, user_email: userInfoMap[w.user_id]?.email || '', user_name: userInfoMap[w.user_id]?.display_name || '', user_phone: userInfoMap[w.user_id]?.telefono || '', card_id: w.id, card_number: w.card_number, prize_amount: prizes.fullCard, won_at: new Date().toISOString() }))
      updateData.full_card_winners = [...(game.full_card_winners || []), ...newFullCardWinners]
      for (const w of fullCardWinners) await saveWinnerNotification(w.user_id, game.id, game.name, 'full_card', prizes.fullCard, w.card_number, game.currency || 'USD')
      updateData.status = 'FINISHED'
      updateData.finished_at = new Date().toISOString()
      newWinners.push(...fullCardWinners.map(w => ({ ...w, prize_type: 'full_card', prize_amount: prizes.fullCard })))
    }

    await supabaseFetch(`bingo_games?id=eq.${gameId}`, { method: 'PATCH', body: JSON.stringify(updateData) })

    return NextResponse.json({
      success: true, number: newNumber, calledNumbers: updatedCalledNumbers,
      winners: newWinners, gameFinished: updateData.status === 'FINISHED'
    })
  } catch (error: any) {
    console.error('❌ Error in auto-call:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor', details: error.message }, { status: 500 })
  }
}
