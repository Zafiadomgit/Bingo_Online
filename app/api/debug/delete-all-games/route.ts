import { NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST() {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    console.log('🗑️ Eliminando todos los juegos...')
    
    // Eliminar todos los juegos
    const { error: deleteError } = await supabase
      .from('bingo_games')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Eliminar todos

    if (deleteError) {
      console.error('Error deleting games:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar juegos',
        details: deleteError.message
      }, { status: 500 })
    }

    console.log('✅ Todos los juegos eliminados')

    return NextResponse.json({
      success: true,
      message: 'Todos los juegos han sido eliminados exitosamente'
    })

  } catch (error: any) {
    console.error('Error in delete all games:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 })
  }
}
