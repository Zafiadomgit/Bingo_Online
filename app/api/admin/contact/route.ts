import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ success: true, contact: '04121980898' })
    }

    // Obtener información de contacto del admin
    const { data: admin, error } = await supabase
      .from('users')
      .select('email, phone, display_name')
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (error || !admin) {
      return NextResponse.json({
        success: true,
        contact: '04121980898' // Contacto por defecto
      })
    }

    // Formatear contacto
    const contact = admin.phone || admin.email || 'contacto@bingo.com'

    return NextResponse.json({
      success: true,
      contact,
      adminName: admin.display_name || 'Administrador'
    })

  } catch (error) {
    console.error('Error getting admin contact:', error)
    return NextResponse.json({
      success: true,
      contact: '04121980898'
    })
  }
}

