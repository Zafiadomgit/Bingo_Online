import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { promoterName, gameId } = await request.json()

    if (!promoterName) {
      return NextResponse.json({ success: false, error: 'Nombre de promotor requerido' }, { status: 400 })
    }

    let query = supabaseAdmin
      .from('purchase_requests')
      .update({ promoter_name: null }) // Desvincula el promotor de estas ventas
      .eq('promoter_name', promoterName)

    if (gameId && gameId !== 'all') {
      query = query.eq('game_id', gameId)
    }

    const { error } = await query

    if (error) {
      console.error('Error clearing promoter sales:', error)
      return NextResponse.json({ success: false, error: 'Error al actualizar base de datos' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Ventas reseteadas con éxito' })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
