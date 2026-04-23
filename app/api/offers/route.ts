import { NextRequest, NextResponse } from 'next/server'
import { offerSystem, type CardOffer } from '@/lib/offer-system'

export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')
    const cardPrice = searchParams.get('cardPrice')

    // Obtener ofertas disponibles
    const offers = offerSystem.getAvailableOffers(
      gameId || undefined,
      cardPrice ? parseInt(cardPrice) : undefined
    )

    return NextResponse.json({
      success: true,
      offers,
      total: offers.length
    })

  } catch (error) {
    console.error('Error getting offers:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { offerId, gameId, quantity, userId } = await request.json()

    if (!offerId || !gameId || !quantity || !userId) {
      return NextResponse.json(
        { success: false, error: 'Todos los parámetros son requeridos' },
        { status: 400 }
      )
    }

    // Obtener oferta
    const offers = offerSystem.getAllOffers()
    const offer = offers.find(o => o.id === offerId)

    if (!offer) {
      return NextResponse.json(
        { success: false, error: 'Oferta no encontrada' },
        { status: 404 }
      )
    }

    // Obtener información del juego
    const { data: game, error: gameError } = await supabase
      .from('bingo_games')
      .select('*')
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { success: false, error: 'Juego no encontrado' },
        { status: 404 }
      )
    }

    // Obtener información del usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Validar oferta
    const validation = offerSystem.validateOffer(offer, quantity, user.credits, game.card_price)

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    // Calcular precio con oferta
    const calculation = offerSystem.calculateOfferPrice(offer, game.card_price, quantity)

    // Verificar si el usuario tiene suficientes créditos
    if (user.credits < calculation.discountedPrice) {
      return NextResponse.json(
        { success: false, error: 'Créditos insuficientes' },
        { status: 400 }
      )
    }

    // Crear cartones
    const cards = []
    for (let i = 0; i < quantity; i++) {
      const cardNumber = Math.floor(Math.random() * 10000) + 1
      const numbers = generateBingoNumbers()

      cards.push({
        game_id: gameId,
        user_id: userId,
        card_number: cardNumber,
        numbers,
        marked_positions: new Array(25).fill(false),
        is_winner: false,
        offer_id: offerId
      })
    }

    // Insertar cartones en la base de datos
    const { data: insertedCards, error: cardsError } = await supabase
      .from('bingo_cards')
      .insert(cards)
      .select()

    if (cardsError) {
      console.error('Error inserting cards:', cardsError)
      return NextResponse.json(
        { success: false, error: 'Error creando cartones' },
        { status: 500 }
      )
    }

    // Actualizar créditos del usuario
    const newCredits = user.credits - calculation.discountedPrice
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: newCredits })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user credits:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error actualizando créditos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      cards: insertedCards,
      calculation,
      newCredits,
      message: `Oferta aplicada exitosamente. Ahorraste ${calculation.savings} créditos!`
    })

  } catch (error) {
    console.error('Error processing offer:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función para generar números de bingo
function generateBingoNumbers(): number[] {
  const numbers: number[] = []

  // B column (1-15)
  const bNumbers = generateUniqueNumbers(1, 15, 5)
  // I column (16-30)
  const iNumbers = generateUniqueNumbers(16, 30, 5)
  // N column (31-45) with FREE space in middle
  const nNumbers = generateUniqueNumbers(31, 45, 4)
  // G column (46-60)
  const gNumbers = generateUniqueNumbers(46, 60, 5)
  // O column (61-75)
  const oNumbers = generateUniqueNumbers(61, 75, 5)

  // Arrange numbers in grid format
  for (let row = 0; row < 5; row++) {
    numbers.push(bNumbers[row])
    numbers.push(iNumbers[row])
    if (row === 2) {
      numbers.push(0) // FREE space
    } else {
      const nIndex = row < 2 ? row : row - 1
      numbers.push(nNumbers[nIndex])
    }
    numbers.push(gNumbers[row])
    numbers.push(oNumbers[row])
  }

  return numbers
}

function generateUniqueNumbers(min: number, max: number, count: number): number[] {
  const numbers: number[] = []
  while (numbers.length < count) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min
    if (!numbers.includes(num)) {
      numbers.push(num)
    }
  }
  return numbers.sort((a, b) => a - b)
}
