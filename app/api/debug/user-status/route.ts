import { NextRequest, NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email es requerido'
      }, { status: 400 })
    }

    // Buscar usuario en la tabla users
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado',
        details: userError.message
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: user,
      isAdmin: user.role === 'admin'
    })

  } catch (error) {
    console.error('Error in user status API:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
