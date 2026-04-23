import { NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { generateBingoCard } from '@/lib/bingo-utils'

export const dynamic = 'force-dynamic'

export async function POST() {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    const email = 'david@gmail.com'
    const requestId = 'e7d28a02-8de3-4f87-9795-99be1e82fd78'
    
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

    // Obtener la solicitud
    const { data: purchaseRequest, error: requestError } = await supabase
      .from('purchase_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (requestError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Solicitud no encontrada',
        details: requestError.message 
      })
    }

    // Si no hay game_id, obtener el juego más reciente
    let gameId = purchaseRequest.game_id
    if (!gameId) {
      const { data: recentGame, error: gameError } = await supabase
        .from('bingo_games')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (gameError) {
        return NextResponse.json({ 
          success: false, 
          error: 'No hay juegos disponibles',
          details: gameError.message 
        })
      }
      
      gameId = recentGame.id
      console.log('🎮 Usando juego más reciente:', gameId)
    }

    // Obtener los números de cartón
    const cardNumbers = purchaseRequest.card_numbers ? JSON.parse(purchaseRequest.card_numbers) : []
    
    console.log('🔧 Creando cartones manualmente:', {
      user: user.email,
      gameId: gameId,
      cardNumbers,
      userId: user.id
    })

    // Crear los cartones
    const cardsToCreate = []
    for (const cardNumber of cardNumbers) {
      const bingoCard = generateBingoCard()
      cardsToCreate.push({
        game_id: gameId,
        user_id: user.id,
        card_number: cardNumber,
        numbers: bingoCard.numbers,
        marked_positions: new Array(25).fill(false),
        is_winner: false
      })
    }

    console.log('🎯 Cartones a crear:', cardsToCreate.length)

    // Insertar los cartones usando admin client para bypassear RLS
    const adminClient = supabaseAdmin || supabase
    const { data: createdCards, error: cardsError } = await adminClient
      .from('bingo_cards')
      .insert(cardsToCreate)
      .select()

    if (cardsError) {
      console.error('❌ Error creating cards:', cardsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al crear cartones',
        details: cardsError.message 
      })
    }

    console.log('✅ Cartones creados exitosamente:', createdCards?.length)

    return NextResponse.json({
      success: true,
      message: 'Cartones creados exitosamente',
      cardsCreated: createdCards?.length || 0,
      cards: createdCards?.map(c => ({ id: c.id, card_number: c.card_number }))
    })

  } catch (error) {
    console.error('Error in debug create cards API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
