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
    const formData = await request.formData()

    const cardNumbersString = formData.get('cardNumbers') as string
    const cardNumbers = cardNumbersString ? JSON.parse(cardNumbersString) : []
    const gameId = formData.get('gameId') as string

    // Validar estado del juego
    if (gameId) {
      const games = await supabaseFetch(`bingo_games?id=eq.${gameId}&select=status,name,card_price&limit=1`)
      const game = games?.[0]

      if (!game) return NextResponse.json({ success: false, error: 'El juego no fue encontrado' }, { status: 404 })

      if (game.status !== 'WAITING' && game.status !== 'waiting') {
        const statusMessages: Record<string, string> = {
          'ACTIVE': 'El juego ya ha comenzado. No se pueden comprar más cartones.',
          'active': 'El juego ya ha comenzado. No se pueden comprar más cartones.',
          'FINISHED': 'El juego ya terminó.',
          'finished': 'El juego ya terminó.'
        }
        return NextResponse.json({ success: false, error: statusMessages[game.status] || 'El juego no está disponible' }, { status: 400 })
      }
    }

    const nombres = formData.get('nombres') as string
    const apellidos = formData.get('apellidos') as string
    const email = formData.get('email') as string
    const telefono = formData.get('telefono') as string
    const cedula = formData.get('cedula') as string
    const cantidadCartones = parseInt(formData.get('cantidadCartones') as string)
    const numeroReferencia = formData.get('numeroReferencia') as string
    const promoter_name = formData.get('promoter') as string

    if (!nombres || !apellidos || !email || !telefono || !cedula || !numeroReferencia) {
      return NextResponse.json({ success: false, error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    // Obtener precio del cartón
    let cardPrice = 1.00
    if (gameId) {
      const games = await supabaseFetch(`bingo_games?id=eq.${gameId}&select=card_price&limit=1`)
      if (games?.[0]) cardPrice = parseFloat(games[0].card_price || '1.00')
    }
    const total = cantidadCartones * cardPrice

    // Procesar imagen
    let imageData = null
    const transferImage = formData.get('transferImage') as File
    if (transferImage && transferImage.size > 0) {
      try {
        const bytes = await transferImage.arrayBuffer()
        const base64 = Buffer.from(bytes).toString('base64')
        imageData = { name: transferImage.name, type: transferImage.type, size: transferImage.size, data: `data:${transferImage.type};base64,${base64}` }
      } catch (error) {
        console.error('Error procesando imagen:', error)
      }
    }

    // Reservar números de cartón
    const reservationErrors: string[] = []
    for (const cardNumber of cardNumbers) {
      try {
        // Verificar si ya está reservado en card_numbers
        const existingReservation = await supabaseFetch(`card_numbers?number=eq.${cardNumber}&game_id=eq.${gameId}&limit=1`)
        if (existingReservation?.length > 0) {
          if (existingReservation[0].user_email !== email) {
            reservationErrors.push(`Número ${cardNumber} ya está reservado`)
          }
          continue
        }

        // Verificar si ya está aprobado en bingo_cards
        const existingApproved = await supabaseFetch(`bingo_cards?game_id=eq.${gameId}&card_number=eq.${cardNumber}&select=card_number&limit=1`)
        if (existingApproved?.length > 0) {
          reservationErrors.push(`Número ${cardNumber} ya fue comprado`)
          continue
        }

        await supabaseFetch('card_numbers', {
          method: 'POST',
          body: JSON.stringify([{ number: cardNumber, user_email: email, game_id: gameId, status: 'reserved' }])
        })
      } catch (error: any) {
        console.error(`Error reservando ${cardNumber}:`, error)
        reservationErrors.push(`Error en número ${cardNumber}`)
      }
    }

    if (reservationErrors.length > 0) {
      return NextResponse.json({ success: false, error: reservationErrors.join(', ') }, { status: 400 })
    }

    // Guardar solicitud de compra
    const inserted = await supabaseFetch('purchase_requests', {
      method: 'POST',
      body: JSON.stringify({
        id: uuidv4(), email, game_id: gameId,
        card_number: cardNumbers[0], amount: total, status: 'pending',
        receipt_url: imageData ? JSON.stringify(imageData) : null,
        promoter_name, nombres, apellidos, telefono, cedula,
        cantidad_cartones: cantidadCartones,
        card_numbers: JSON.stringify(cardNumbers),
        numero_referencia: numeroReferencia
      })
    })

    if (!inserted?.[0]) {
      return NextResponse.json({ success: false, error: 'Error guardando la solicitud' }, { status: 500 })
    }

    console.log('✅ Solicitud de compra guardada:', inserted[0].id)
    return NextResponse.json({ success: true, message: 'Solicitud enviada exitosamente', purchaseId: inserted[0].id })

  } catch (error: any) {
    console.error('❌ Error en solicitud de compra:', error)
    return NextResponse.json({ success: false, error: `Error interno: ${error.message}` }, { status: 500 })
  }
}
