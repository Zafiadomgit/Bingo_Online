import { NextRequest, NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      return NextResponse.json({
        success: false,
        error: 'ID del juego es requerido'
      }, { status: 400 })
    }

    console.log(`🔍 Verificando juego: ${gameId}`)

    // Usar supabaseAdmin para bypass RLS
    const clientToUse = supabaseAdmin || supabase

    // Verificar si el juego existe
    const { data: game, error: gameError } = await clientToUse
      .from('bingo_games')
      .select('*')
      .eq('id', gameId)
      .single()

    if (gameError) {
      console.log(`❌ Error buscando juego:`, gameError)
      return NextResponse.json({
        success: false,
        error: 'Juego no encontrado',
        details: gameError.message
      })
    }

    if (!game) {
      console.log(`❌ Juego no existe: ${gameId}`)
      return NextResponse.json({
        success: false,
        error: 'Juego no encontrado',
        details: 'El juego no existe en la base de datos'
      })
    }

    console.log(`✅ Juego encontrado:`, {
      id: game.id,
      name: game.name,
      status: game.status,
      scheduled_at: game.scheduled_at,
      created_at: game.created_at
    })

    return NextResponse.json({
      success: true,
      game: {
        id: game.id,
        name: game.name,
        status: game.status,
        scheduled_at: game.scheduled_at,
        created_at: game.created_at,
        max_cards: game.max_cards,
        card_price: game.card_price
      }
    })

  } catch (error) {
    console.error('Error checking game:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
