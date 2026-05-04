import { NextResponse } from 'next/server'
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

export async function POST(request: Request) {
  try {
    const { requestId } = await request.json()
    if (!requestId) return NextResponse.json({ success: false, error: 'ID de solicitud requerido' }, { status: 400 })

    const reqs = await supabaseFetch(`purchase_requests?id=eq.${requestId}&limit=1`)
    const purchaseRequest = reqs?.[0]
    if (!purchaseRequest) return NextResponse.json({ success: false, error: 'Solicitud no encontrada' }, { status: 404 })
    if (purchaseRequest.status === 'approved') return NextResponse.json({ success: true, message: 'Solicitud ya aprobada' })

    const users = await supabaseFetch(`users?email=ilike.${encodeURIComponent(purchaseRequest.email)}&limit=1`)
    const user = users?.[0]
    if (!user) return NextResponse.json({ success: false, error: `Usuario ${purchaseRequest.email} no encontrado` }, { status: 404 })

    const cardNumbers = purchaseRequest.card_numbers
      ? (typeof purchaseRequest.card_numbers === 'string' ? JSON.parse(purchaseRequest.card_numbers) : purchaseRequest.card_numbers)
      : []
    if (!cardNumbers || cardNumbers.length === 0) return NextResponse.json({ success: false, error: 'No se encontraron números de cartón' }, { status: 400 })

    let gameId = purchaseRequest.game_id
    if (!gameId) {
      const games = await supabaseFetch('bingo_games?order=created_at.desc&limit=1&select=id')
      if (!games?.[0]) return NextResponse.json({ success: false, error: 'No hay juegos disponibles' }, { status: 500 })
      gameId = games[0].id
    }

    // Verificar duplicados
    const existing = await supabaseFetch(`bingo_cards?game_id=eq.${gameId}&user_id=eq.${user.id}&card_number=in.(${cardNumbers.join(',')})&select=card_number`)
    if (existing && existing.length > 0) {
      const dupes = existing.map((r: any) => r.card_number)
      return NextResponse.json({ success: false, error: `Ya existen cartones: ${dupes.join(', ')}` }, { status: 400 })
    }

    const perCardPrice = parseFloat(purchaseRequest.amount || '0') / cardNumbers.length
    const cardsToInsert = cardNumbers.map((cardNumber: number) => {
      const bingoCard = generateBingoCard()
      return {
        id: uuidv4(), game_id: gameId, user_id: user.id, card_number: cardNumber,
        numbers: bingoCard.numbers, marked_positions: new Array(25).fill(false),
        is_winner: false, promoter_name: purchaseRequest.promoter_name || null,
        purchase_price: perCardPrice
      }
    })

    await supabaseFetch('bingo_cards', { method: 'POST', body: JSON.stringify(cardsToInsert) })
    await supabaseFetch(`purchase_requests?id=eq.${requestId}`, {
      method: 'PATCH', body: JSON.stringify({ status: 'approved', updated_at: new Date().toISOString() })
    })
    // Garantizar que cada cartón aprobado esté en card_numbers como 'confirmed'
    for (const cardNumber of cardNumbers) {
      const existing = await supabaseFetch(`card_numbers?game_id=eq.${gameId}&number=eq.${cardNumber}&limit=1`)
      if (existing && existing.length > 0) {
        // Actualizar el existente a confirmed
        await supabaseFetch(`card_numbers?game_id=eq.${gameId}&number=eq.${cardNumber}`, {
          method: 'PATCH', body: JSON.stringify({ status: 'confirmed', user_email: user.email })
        })
      } else {
        // Insertar nuevo registro confirmed
        await supabaseFetch('card_numbers', {
          method: 'POST',
          body: JSON.stringify({ number: cardNumber, user_email: user.email, game_id: gameId, status: 'confirmed' })
        }).catch(() => {}) // ignorar si ya existe por race condition
      }
    }

    return NextResponse.json({ success: true, message: 'Solicitud aprobada exitosamente', cardsCreated: cardNumbers.length })
  } catch (error: any) {
    console.error('Error in approve request:', error)
    return NextResponse.json({ success: false, error: 'Error interno', details: error.message }, { status: 500 })
  }
}
