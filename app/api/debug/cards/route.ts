import { NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    const email = 'david@gmail.com'
    
    // Obtener el usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (userError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuario no encontrado',
        details: userError.message 
      })
    }

    // Verificar solicitudes aprobadas
    const { data: approvedRequests, error: requestsError } = await supabase
      .from('purchase_requests')
      .select('*')
      .eq('email', email)
      .eq('status', 'approved')

    if (requestsError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Error obteniendo solicitudes',
        details: requestsError.message 
      })
    }

    // Verificar cartones existentes
    const { data: existingCards, error: cardsError } = await supabase
      .from('bingo_cards')
      .select('*')
      .eq('user_id', user.id)

    if (cardsError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Error obteniendo cartones',
        details: cardsError.message 
      })
    }

    return NextResponse.json({
      success: true,
      user,
      approvedRequests: approvedRequests?.length || 0,
      requests: approvedRequests,
      existingCards: existingCards?.length || 0,
      cards: existingCards
    })

  } catch (error) {
    console.error('Error in debug API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
