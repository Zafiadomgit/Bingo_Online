import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Administrador de BD no configurado' }, { status: 500 })
    }

    console.log(`📋 Admin solicitando detalles de solicitud: ${id}`)

    const { data: requestData, error } = await supabase
      .from('purchase_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    if (!requestData) {
      return NextResponse.json({ success: false, error: 'Solicitud no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, request: requestData })
  } catch (error: any) {
    console.error(`❌ Error in admin purchase request detail API (${params?.id}):`, error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor', details: error.message }, { status: 500 })
  }
}
