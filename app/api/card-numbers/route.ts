import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!supabase) return NextResponse.json({ success: true, cardNumbers: [] })
    const { data } = await supabase.from('card_numbers').select('*').order('number', { ascending: true })
    return NextResponse.json({ success: true, cardNumbers: data || [] })
  } catch (error: any) {
    console.error('Error fetching card numbers:', error)
    return NextResponse.json({ success: true, cardNumbers: [] }) // Graceful fallback
  }
}

export async function POST(request: Request) {
  try {
    if (!supabase) return NextResponse.json({ success: false, error: 'BD no conf' }, { status: 500 })
    
    const { number, userEmail, gameId } = await request.json()

    console.log('🔢 Reservando número de cartón (REST):', { number, userEmail, gameId })

    if (!number || !userEmail) {
      return NextResponse.json({ success: false, error: 'Número y email requeridos' }, { status: 400 })
    }

    // Verificar disponibilidad 
    const { data: existing } = await supabase.from('card_numbers').select('*').eq('number', number).eq('game_id', gameId).single()

    if (existing) {
      if (existing.user_email === userEmail) {
        return NextResponse.json({ success: true, message: 'Número ya reservado por ti', cardNumber: existing })
      }
      return NextResponse.json({ success: false, error: `Este número ya está ${existing.status}` }, { status: 409 })
    }

    // Reservar
    const { data: inserted, error } = await supabase.from('card_numbers').insert([{
        number, user_email: userEmail, game_id: gameId, status: 'reserved'
    }]).select('*').single()

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Número reservado exitosamente', cardNumber: inserted })
  } catch (error: any) {
    console.error('❌ Error en card-numbers API:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
