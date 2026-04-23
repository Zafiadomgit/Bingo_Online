import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json()

    if (!email || !password || !displayName) {
      return NextResponse.json({
        success: false,
        error: 'Email, password y displayName son requeridos'
      }, { status: 400 })
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin?.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        role: 'admin'
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json({
        success: false,
        error: 'Error al crear usuario en autenticación',
        details: authError.message
      }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo crear el usuario'
      }, { status: 500 })
    }

    // Crear usuario en la tabla users
    const { data: userData, error: userError } = await supabaseAdmin?.from('users')
      .insert({
        id: authData.user.id,
        email: email,
        display_name: displayName,
        credits: 1000,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user in database:', userError)
      // Intentar eliminar el usuario de auth si falla la creación en la DB
      await supabaseAdmin?.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json({
        success: false,
        error: 'Error al crear usuario en la base de datos',
        details: userError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario administrador creado exitosamente',
      user: {
        id: userData.id,
        email: userData.email,
        display_name: userData.display_name,
        role: userData.role
      }
    })

  } catch (error) {
    console.error('Error in create admin API:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
