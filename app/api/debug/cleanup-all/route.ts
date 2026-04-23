import { NextRequest, NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    console.log('🧹 Iniciando limpieza completa del sistema...')

    let totalCleaned = 0
    const cleanupDetails = []

    // 1. Limpiar TODAS las reservas de números de cartón
    console.log('🗑️ Limpiando todas las reservas de números...')
    const { data: cardNumbers, error: cardNumbersError, count: cardNumbersCount } = await supabase
      .from('card_numbers')
      .delete({ count: 'exact' })

    if (!cardNumbersError) {
      totalCleaned += cardNumbersCount || 0
      cleanupDetails.push(`🎴 ${cardNumbersCount || 0} números de cartón eliminados`)
      console.log(`✅ ${cardNumbersCount || 0} números de cartón eliminados`)
    } else {
      console.error('Error eliminando números de cartón:', cardNumbersError)
      cleanupDetails.push(`❌ Error eliminando números de cartón: ${cardNumbersError.message}`)
    }

    // 2. Limpiar TODOS los cartones de bingo
    console.log('🗑️ Limpiando todos los cartones...')
    const { data: bingoCards, error: bingoCardsError, count: bingoCardsCount } = await supabase
      .from('bingo_cards')
      .delete({ count: 'exact' })

    if (!bingoCardsError) {
      totalCleaned += bingoCardsCount || 0
      cleanupDetails.push(`🎯 ${bingoCardsCount || 0} cartones de bingo eliminados`)
      console.log(`✅ ${bingoCardsCount || 0} cartones de bingo eliminados`)
    } else {
      console.error('Error eliminando cartones de bingo:', bingoCardsError)
      cleanupDetails.push(`❌ Error eliminando cartones de bingo: ${bingoCardsError.message}`)
    }

    // 3. Limpiar TODAS las solicitudes de compra
    console.log('🗑️ Limpiando todas las solicitudes de compra...')
    const { data: purchaseRequests, error: purchaseRequestsError, count: purchaseRequestsCount } = await supabase
      .from('purchase_requests')
      .delete({ count: 'exact' })

    if (!purchaseRequestsError) {
      totalCleaned += purchaseRequestsCount || 0
      cleanupDetails.push(`💰 ${purchaseRequestsCount || 0} solicitudes de compra eliminadas`)
      console.log(`✅ ${purchaseRequestsCount || 0} solicitudes de compra eliminadas`)
    } else {
      console.error('Error eliminando solicitudes de compra:', purchaseRequestsError)
      cleanupDetails.push(`❌ Error eliminando solicitudes de compra: ${purchaseRequestsError.message}`)
    }

    // 4. Limpiar TODAS las notificaciones
    console.log('🗑️ Limpiando todas las notificaciones...')
    const { data: notifications, error: notificationsError, count: notificationsCount } = await supabase
      .from('game_notifications')
      .delete({ count: 'exact' })

    if (!notificationsError) {
      totalCleaned += notificationsCount || 0
      cleanupDetails.push(`🔔 ${notificationsCount || 0} notificaciones eliminadas`)
      console.log(`✅ ${notificationsCount || 0} notificaciones eliminadas`)
    } else {
      console.error('Error eliminando notificaciones:', notificationsError)
      cleanupDetails.push(`❌ Error eliminando notificaciones: ${notificationsError.message}`)
    }

    // 5. Limpiar TODOS los juegos
    console.log('🗑️ Limpiando todos los juegos...')
    const { data: games, error: gamesError, count: gamesCount } = await supabase
      .from('bingo_games')
      .delete({ count: 'exact' })

    if (!gamesError) {
      totalCleaned += gamesCount || 0
      cleanupDetails.push(`🎮 ${gamesCount || 0} juegos eliminados`)
      console.log(`✅ ${gamesCount || 0} juegos eliminados`)
    } else {
      console.error('Error eliminando juegos:', gamesError)
      cleanupDetails.push(`❌ Error eliminando juegos: ${gamesError.message}`)
    }

    console.log(`🎉 Limpieza completa terminada. Total de registros eliminados: ${totalCleaned}`)

    return NextResponse.json({
      success: true,
      message: 'Limpieza completa del sistema realizada exitosamente',
      details: {
        totalRecordsCleaned: totalCleaned,
        cleanupDetails: cleanupDetails
      }
    })

  } catch (error) {
    console.error('Error en limpieza completa:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor durante la limpieza' },
      { status: 500 }
    )
  }
}
