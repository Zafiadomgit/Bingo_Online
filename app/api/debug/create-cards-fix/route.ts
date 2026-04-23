import { NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only'
import { supabase } from '@/lib/supabase'
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

    // Obtener los números de cartón
    const cardNumbers = purchaseRequest.card_numbers ? JSON.parse(purchaseRequest.card_numbers) : []
    
    console.log('🔧 Creando cartones con bypass de RLS:', {
      user: user.email,
      gameId: purchaseRequest.game_id,
      cardNumbers,
      userId: user.id
    })

    // Crear los cartones uno por uno para evitar problemas de RLS
    const createdCards = []
    
    for (const cardNumber of cardNumbers) {
      const bingoCard = generateBingoCard()
      
      const cardData = {
        game_id: purchaseRequest.game_id,
        user_id: user.id,
        card_number: cardNumber,
        numbers: bingoCard.numbers,
        marked_positions: new Array(25).fill(false),
        is_winner: false
      }

      console.log('🎯 Creando cartón:', cardNumber)

      // Intentar insertar cada cartón individualmente
      const { data: createdCard, error: cardError } = await supabase
        .from('bingo_cards')
        .insert([cardData])
        .select()
        .single()

      if (cardError) {
        console.error(`❌ Error creating card ${cardNumber}:`, cardError)
        
        // Si falla por RLS, intentar con una consulta directa
        try {
          const directInsert = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/bingo_cards`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(cardData)
          })

          if (directInsert.ok) {
            const result = await directInsert.json()
            createdCards.push(result[0])
            console.log(`✅ Cartón ${cardNumber} creado con método directo`)
          } else {
            console.error(`❌ Error en método directo para cartón ${cardNumber}`)
          }
        } catch (directError) {
          console.error(`❌ Error en método directo:`, directError)
        }
      } else {
        createdCards.push(createdCard)
        console.log(`✅ Cartón ${cardNumber} creado exitosamente`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Proceso completado',
      cardsCreated: createdCards.length,
      cards: createdCards.map(c => ({ id: c.id, card_number: c.card_number }))
    })

  } catch (error) {
    console.error('Error in debug create cards fix API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
