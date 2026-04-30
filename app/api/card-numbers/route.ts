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

    // Si viene gameId filtrar por juego, si no traer todos
    const path = gameId
      ? `card_numbers?game_id=eq.${gameId}&order=number.asc`
      : `card_numbers?order=number.asc`

    const data = await supabaseFetch(path) || []
    return NextResponse.json({ success: true, cardNumbers: data })
  } catch (error: any) {
    console.error('Error fetching card numbers:', error)
    return NextResponse.json({ success: true, cardNumbers: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { number, userEmail, gameId } = await request.json()

    if (!number || !userEmail) {
      return NextResponse.json({ success: false, error: 'Número y email requeridos' }, { status: 400 })
    }

    // Verificar si ya existe
    const existing = await supabaseFetch(
      `card_numbers?number=eq.${number}&game_id=eq.${gameId}&limit=1`
    )

    if (existing && existing.length > 0) {
      const record = existing[0]
      if (record.user_email === userEmail) {
        return NextResponse.json({ success: true, message: 'Número ya reservado por ti', cardNumber: record })
      }
      return NextResponse.json({ success: false, error: `Este número ya está ${record.status}` }, { status: 409 })
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

    if (!number || !gameId) {
      return NextResponse.json({ success: false, error: 'Número y gameId requeridos' }, { status: 400 })
    }

    let path = `card_numbers?number=eq.${number}&game_id=eq.${gameId}`
    if (userEmail) path += `&user_email=eq.${encodeURIComponent(userEmail)}`

    await supabaseFetch(path, { method: 'DELETE' })
    return NextResponse.json({ success: true, message: 'Reserva eliminada' })
  } catch (error: any) {
    console.error('Error deleting card number:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
