import { NextRequest, NextResponse } from 'next/server'
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
    const body = await request.json()
    const { gameId, scheduled_at, display_date, auto_start, start_delay_minutes, max_cards, card_price,
      prize_line, prize_two_lines, prize_full_card, use_percentage_prizes,
      prize_line_percentage, prize_two_lines_percentage, prize_full_card_percentage, currency } = body

    if (!scheduled_at) return NextResponse.json({ success: false, error: 'Fecha programada es requerida' }, { status: 400 })

    const scheduledDate = new Date(scheduled_at)
    const timeDiffMinutes = (scheduledDate.getTime() - Date.now()) / (1000 * 60)
    if (timeDiffMinutes < -5) return NextResponse.json({ success: false, error: `Fecha debe ser futura. Diff: ${timeDiffMinutes.toFixed(1)} min` }, { status: 400 })

    const finalId = gameId || uuidv4()
    // Usar fecha local del usuario (enviada desde el browser) para evitar bug de timezone
    const dateForName = display_date || (() => {
      const parts = scheduled_at.split('T')[0].split('-') // ['YYYY','MM','DD']
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    })()
    const name = `Sorteo Programado - ${dateForName}`

    const gameData = {
      name, max_cards: max_cards || 100, card_price: parseFloat(card_price) || 1.0,
      admin_id: '00000000-0000-0000-0000-000000000000',
      scheduled_at: scheduledDate.toISOString(), auto_start: auto_start || false,
      start_delay_minutes: start_delay_minutes || 0,
      prize_line: parseFloat(prize_line) || 50, prize_two_lines: parseFloat(prize_two_lines) || 100,
      prize_full_card: parseFloat(prize_full_card) || 200,
      use_percentage_prizes: use_percentage_prizes || false,
      prize_line_percentage: parseFloat(prize_line_percentage) || 10,
      prize_two_lines_percentage: parseFloat(prize_two_lines_percentage) || 15,
      prize_full_card_percentage: parseFloat(prize_full_card_percentage) || 25,
      currency: currency || 'USD'
    }

    if (!gameId) {
      await supabaseFetch('bingo_games', {
        method: 'POST',
        body: JSON.stringify({ id: finalId, status: 'WAITING', created_at: new Date().toISOString(), ...gameData })
      })
    } else {
      await supabaseFetch(`bingo_games?id=eq.${gameId}`, {
        method: 'PATCH', body: JSON.stringify({ ...gameData, updated_at: new Date().toISOString() })
      })
    }

    return NextResponse.json({ success: true, gameId: finalId, message: 'Sorteo programado exitosamente' })
  } catch (error: any) {
    console.error('Error scheduling game:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')
    if (!gameId) return NextResponse.json({ success: false, error: 'ID del juego es requerido' }, { status: 400 })

    const games = await supabaseFetch(`bingo_games?id=eq.${gameId}&limit=1`)
    const game = games?.[0]
    if (!game) return NextResponse.json({ success: false, error: 'Juego no encontrado' }, { status: 404 })

    return NextResponse.json({ success: true, game })
  } catch (error: any) {
    console.error('Error getting game:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
