import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Admin client not available' }, { status: 500 })
    }

    console.log('🗑️ Eliminando todos los juegos...')

    // Eliminar todos los juegos de la tabla bingo_games
    const { data, error } = await supabase
      .from('bingo_games')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Mantener al menos un registro para evitar problemas

    if (error) {
      console.error('Error deleting games:', error)
      return NextResponse.json(
        { success: false, error: 'Error eliminando los juegos' },
        { status: 500 }
      )
    }

    console.log('✅ Todos los juegos eliminados exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Todos los juegos han sido eliminados exitosamente',
      deletedCount: data ? (data as unknown as any[]).length : 0
    })

  } catch (error) {
    console.error('Error deleting all games:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
