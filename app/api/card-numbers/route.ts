import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

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

    // 1. Obtener reservas de card_numbers
    const cardNumbersPath = gameId
      ? `card_numbers?game_id=eq.${gameId}&order=number.asc`
      : `card_numbers?order=number.asc`
    const cardNumbers = await supabaseFetch(cardNumbersPath) || []

    // 2. Obtener cartones ya aprobados de bingo_cards (estos también están ocupados)
    let approvedCards: any[] = []
    if (gameId) {
      const bingoCards = await supabaseFetch(
        `bingo_cards?game_id=eq.${gameId}&select=card_number,user_id,created_at&order=card_number.asc`
      ) || []

      // Obtener emails de los usuarios para los bingo_cards
      const userIds = [...new Set(bingoCards.map((c: any) => c.user_id))]
      const userEmailMap: Record<string, string> = {}
      for (const uid of userIds) {
        const users = await supabaseFetch(`users?id=eq.${uid}&select=id,email&limit=1`)
        if (users?.[0]) userEmailMap[uid] = users[0].email
      }

      // Convertir bingo_cards al mismo formato que card_numbers
      const cardNumbersSet = new Set(cardNumbers.map((cn: any) => cn.number))
      approvedCards = bingoCards
        .filter((bc: any) => !cardNumbersSet.has(bc.card_number)) // evitar duplicados
        .map((bc: any) => ({
          id: `bingo_card_${bc.card_number}`,
          number: bc.card_number,
          user_email: userEmailMap[bc.user_id] || '',
          game_id: gameId,
          status: 'confirmed', // cartón aprobado = confirmed
          created_at: bc.created_at
        }))
    }

    // 3. Combinar ambas listas
    const allNumbers = [...cardNumbers, ...approvedCards]
      .sort((a: any, b: any) => a.number - b.number)

    return NextResponse.json({ success: true, cardNumbers: allNumbers })
  } catch (error: any) {
    console.error('Error fetching card numbers:', error)
    return NextResponse.json({ success: true, cardNumbers: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { number, userEmail, gameId } = await request.json()
    if (!number || !userEmail) return NextResponse.json({ success: false, error: 'Número y email requeridos' }, { status: 400 })

    // Verificar si ya existe en card_numbers
    const existingReservation = await supabaseFetch(
      `card_numbers?number=eq.${number}&game_id=eq.${gameId}&limit=1`
    )
    if (existingReservation?.length > 0) {
      const record = existingReservation[0]
      if (record.user_email === userEmail) return NextResponse.json({ success: true, message: 'Número ya reservado por ti', cardNumber: record })
      return NextResponse.json({ success: false, error: `Este número ya está ${record.status}` }, { status: 409 })
    }

    // Verificar si ya existe en bingo_cards (aprobado)
    const existingApproved = await supabaseFetch(
      `bingo_cards?game_id=eq.${gameId}&card_number=eq.${number}&select=card_number&limit=1`
    )
    if (existingApproved?.length > 0) {
      return NextResponse.json({ success: false, error: 'Este número ya está confirmado por otro usuario' }, { status: 409 })
    }

    // Reservar
    const inserted = await supabaseFetch('card_numbers', {
      method: 'POST',
      body: JSON.stringify({ number, user_email: userEmail, game_id: gameId, status: 'reserved' })
    })
    return NextResponse.json({ success: true, message: 'Número reservado exitosamente', cardNumber: inserted?.[0] })
  } catch (error: any) {
    console.error('❌ Error en card-numbers API:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const number = searchParams.get('number')
    const gameId = searchParams.get('gameId')
    const userEmail = searchParams.get('userEmail')
    if (!number || !gameId) return NextResponse.json({ success: false, error: 'Número y gameId requeridos' }, { status: 400 })
    let path = `card_numbers?number=eq.${number}&game_id=eq.${gameId}`
    if (userEmail) path += `&user_email=eq.${encodeURIComponent(userEmail)}`
    await supabaseFetch(path, { method: 'DELETE' })
    return NextResponse.json({ success: true, message: 'Reserva eliminada' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
