import { NextRequest, NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    const { gameId } = await request.json()
    
    if (!gameId) {
      return NextResponse.json({
        success: false,
        error: 'ID del juego es requerido'
      }, { status: 400 })
    }

    console.log(`🔍 DEBUG - Intentando eliminar juego: ${gameId}`)

    // Usar supabaseAdmin para bypass RLS
    const clientToUse = supabaseAdmin || supabase

    // 1. Verificar que el juego existe ANTES de intentar eliminar
    console.log('🔍 Paso 1: Verificando que el juego existe...')
    const { data: game, error: gameError } = await clientToUse
      .from('bingo_games')
      .select('id, name, status, created_at, scheduled_at')
      .eq('id', gameId)
      .single()

    if (gameError) {
      console.log('❌ Error buscando juego:', gameError)
      return NextResponse.json({
        success: false,
        error: 'Juego no encontrado',
        details: gameError.message,
        gameId: gameId
      })
    }

    if (!game) {
      console.log('❌ Juego no existe en la base de datos')
      return NextResponse.json({
        success: false,
        error: 'Juego no encontrado',
        details: 'El juego no existe en la base de datos',
        gameId: gameId
      })
    }

    console.log('✅ Juego encontrado:', {
      id: game.id,
      name: game.name,
      status: game.status,
      created_at: game.created_at,
      scheduled_at: game.scheduled_at
    })

    // 2. Intentar eliminar el juego
    console.log('🗑️ Paso 2: Intentando eliminar el juego...')
    const { error: deleteError } = await clientToUse
      .from('bingo_games')
      .delete()
      .eq('id', gameId)

    if (deleteError) {
      console.log('❌ Error eliminando juego:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar el juego',
        details: deleteError.message
      })
    }

    console.log('✅ Juego eliminado exitosamente')

    // 3. Verificar que realmente se eliminó
    console.log('🔍 Paso 3: Verificando que el juego se eliminó...')
    const { data: deletedGame, error: verifyError } = await clientToUse
      .from('bingo_games')
      .select('id')
      .eq('id', gameId)
      .single()

    if (verifyError && verifyError.code === 'PGRST116') {
      // PGRST116 = no rows found, que es lo que queremos
      console.log('✅ Confirmado: El juego ya no existe en la base de datos')
    } else if (deletedGame) {
      console.log('❌ El juego todavía existe después de la eliminación')
      return NextResponse.json({
        success: false,
        error: 'El juego no se eliminó correctamente'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Juego eliminado exitosamente',
      deletedGame: {
        id: game.id,
        name: game.name,
        status: game.status
      }
    })

  } catch (error) {
    console.error('❌ Error en debug delete-game:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
