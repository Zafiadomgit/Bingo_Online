import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Base de datos no configurada' }, { status: 500 })
    }

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, users: users || [] })
  } catch (error) {
    console.error('Error in admin users API:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor', details: String(error) }, { status: 500 })
  }
}
