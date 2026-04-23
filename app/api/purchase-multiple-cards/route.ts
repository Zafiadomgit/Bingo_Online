import { NextRequest, NextResponse } from 'next/server'
import { SupabaseService } from '@/lib/supabase-service'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { generateBingoCard } from '@/lib/bingo-utils'

export const dynamic = 'force-dynamic'

const supabaseService = new SupabaseService()

export async function POST(request: NextRequest) {
  try {
    const { gameId, quantity } = await request.json()
    
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticación requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const userData = verifyToken(token)
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      )
    }

    if (!gameId || !quantity || quantity < 1) {
      return NextResponse.json(
        { success: false, error: 'ID del juego y cantidad son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el juego existe y está en estado waiting
    const game = await supabaseService.getGame(gameId)

    if (!game) {
      return NextResponse.json(
        { success: false, error: "Juego no encontrado" },
        { status: 404 }
      )
    }

    if (game.status !== 'WAITING') {
      return NextResponse.json(
        { success: false, error: "El juego ya ha comenzado o terminado" },
        { status: 400 }
      )
    }

    // Verificar que el usuario tiene suficientes créditos
    const user = await supabaseService.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Calcular costo total
    const totalCost = quantity * game.card_price

    if (user.credits < totalCost) {
      return NextResponse.json(
        { success: false, error: "Créditos insuficientes" },
        { status: 400 }
      )
    }

    // Verificar límite de cartones
    const cardCount = await supabaseService.getGameCardCount(gameId)
    if (cardCount + quantity > game.max_cards) {
      return NextResponse.json(
        { success: false, error: "No hay suficientes cartones disponibles" },
        { status: 400 }
      )
    }

    // Crear múltiples cartones
    const cards = []
    for (let i = 0; i < quantity; i++) {
      const bingoCard = generateBingoCard()
      
      const { data: card, error: cardError } = await supabase
        .from('bingo_cards')
        .insert({
          game_id: gameId,
          user_id: userData.id,
          card_number: cardCount + i + 1,
          numbers: bingoCard.numbers,
          marked_positions: bingoCard.marked_positions,
          is_winner: false
        })
        .select()
        .single()

      if (cardError || !card) {
        return NextResponse.json(
          { success: false, error: "Error al crear cartón" },
          { status: 500 }
        )
      }

      cards.push(card)
    }

    // Descontar créditos del usuario
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: user.credits - totalCost })
      .eq('id', userData.id)

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Error al actualizar créditos" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      cards,
      totalCost,
      quantity
    })

  } catch (error) {
    console.error('Error purchasing multiple cards:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

