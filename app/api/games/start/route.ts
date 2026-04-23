import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    if (!supabase) return NextResponse.json({ success: false, error: 'BD no conf' }, { status: 500 })
    
    const { gameId } = await request.json()
    if (!gameId) return NextResponse.json({ success: false, error: 'ID del juego es requerido' }, { status: 400 })

    const { data, error } = await supabase.from('bingo_games').update({
       status: 'ACTIVE',
       started_at: new Date().toISOString(),
       current_number: null,
       called_numbers: [],
       updated_at: new Date().toISOString()
    }).eq('id', gameId).select('*').single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Juego no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, game: data, message: 'Juego iniciado' })

  } catch (error: any) {
    console.error('Error starting game:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
