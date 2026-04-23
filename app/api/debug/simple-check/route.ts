import { NextRequest, NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    console.log('🔍 Verificación simple del sistema...')

    // 1. Verificar juegos
    const { data: games, error: gamesError } = await supabase
      .from('bingo_games')
      .select('id, name, status')
      .order('created_at', { ascending: false })
      .limit(5)

    if (gamesError) {
      return NextResponse.json({ success: false, error: `Error juegos: ${gamesError.message}` }, { status: 500 })
    }

    // 2. Verificar cartones
    const { data: cards, error: cardsError } = await supabase
      .from('bingo_cards')
      .select('id, game_id, card_number')
      .order('created_at', { ascending: false })
      .limit(10)

    if (cardsError) {
      return NextResponse.json({ success: false, error: `Error cartones: ${cardsError.message}` }, { status: 500 })
    }

    // 3. Verificar solicitudes
    const { data: requests, error: requestsError } = await supabase
      .from('purchase_requests')
      .select('id, email, game_id, status')
      .order('created_at', { ascending: false })
      .limit(10)

    if (requestsError) {
      return NextResponse.json({ success: false, error: `Error solicitudes: ${requestsError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      summary: {
        games: games?.length || 0,
        cards: cards?.length || 0,
        requests: requests?.length || 0
      },
      data: {
        games: games || [],
        cards: cards || [],
        requests: requests || []
      }
    })

  } catch (error) {
    console.error('Error simple check:', error)
    return NextResponse.json(
      { success: false, error: `Error interno: ${error}` },
      { status: 500 }
    )
  }
}
