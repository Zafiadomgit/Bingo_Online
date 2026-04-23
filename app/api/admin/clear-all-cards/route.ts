import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Base de datos no configurada' }, { status: 500 })
    }

    console.log('🗑️ Limpiando todos los cartones comprados (REST)')

    // Obtener el conteo de cartones antes de eliminar
    // Limpiar card_numbers y purchase_requests
    await supabase.from('card_numbers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const { data: reqDeleted } = await supabase.from('purchase_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000').select('id')

    // Eliminar todos los cartones
    const { data: deleted, error: deleteError } = await supabase
      .from('bingo_cards')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select('id')

    if (deleteError) throw deleteError

    const deletedCount = deleted?.length || 0
    const deletedReqCount = reqDeleted?.length || 0
    const totalWiped = deletedCount + deletedReqCount

    console.log(`✅ ${deletedCount} cartones y ${deletedReqCount} solicitudes eliminadas exitosamente`)

    return NextResponse.json({
      success: true,
      message: `Limpieza completada exitosamente`,
      deletedCount: totalWiped
    })

  } catch (error: any) {
    console.error('Error in clear-all-cards API:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor',
    }, { status: 500 })
  }
}
