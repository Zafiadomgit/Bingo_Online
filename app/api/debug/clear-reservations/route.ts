import { NextRequest, NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    console.log('🧹 Iniciando limpieza de reservas...')

    const { gameId, userEmail } = await request.json()

    if (!gameId && !userEmail) {
      return NextResponse.json(
        { success: false, error: 'Se requiere gameId o userEmail para limpiar reservas' },
        { status: 400 }
      )
    }

    let whereClause = ''
    let params: any = {}

    if (gameId && userEmail) {
      whereClause = 'game_id = @gameId AND user_email = @userEmail'
      params = { gameId, userEmail }
    } else if (gameId) {
      whereClause = 'game_id = @gameId'
      params = { gameId }
    } else if (userEmail) {
      whereClause = 'user_email = @userEmail'
      params = { userEmail }
    }

    // Obtener registros a eliminar
    const { data: recordsToDelete, error: selectError } = await supabase
      .from('card_numbers')
      .select('id, number, user_email, game_id, status')
      .eq('game_id', gameId || '')
      .eq('user_email', userEmail || '')

    if (selectError) {
      console.error('Error obteniendo registros:', selectError)
      return NextResponse.json(
        { success: false, error: 'Error obteniendo registros' },
        { status: 500 }
      )
    }

    console.log(`🔍 Encontrados ${recordsToDelete?.length || 0} registros para eliminar`)

    if (!recordsToDelete || recordsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay reservas para limpiar',
        details: {
          recordsDeleted: 0
        }
      })
    }

    // Eliminar registros
    let deletedCount = 0
    const deletedDetails = []

    for (const record of recordsToDelete) {
      const { error: deleteError } = await supabase
        .from('card_numbers')
        .delete()
        .eq('id', record.id)

      if (deleteError) {
        console.error(`Error eliminando registro ${record.id}:`, deleteError)
      } else {
        deletedCount++
        deletedDetails.push({
          id: record.id,
          number: record.number,
          user_email: record.user_email,
          game_id: record.game_id,
          status: record.status
        })
      }
    }

    console.log(`✅ Eliminados ${deletedCount} registros de reserva`)

    return NextResponse.json({
      success: true,
      message: 'Reservas limpiadas exitosamente',
      details: {
        recordsDeleted: deletedCount,
        deletedRecords: deletedDetails
      }
    })

  } catch (error) {
    console.error('Error limpiando reservas:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
