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

    // Verificar si el usuario ya existe en la tabla users
    const { data: existingUser, error: userCheckError } = await supabaseAdmin?.from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('Error checking existing user:', userCheckError)
      return NextResponse.json({
        success: false,
        error: 'Error al verificar usuario existente',
        details: userCheckError.message
      }, { status: 500 })
    }

    let authUserId = existingUser?.id

    // Si no existe en la tabla users, crear en Supabase Auth primero
    if (!existingUser) {
      console.log('Usuario no existe, creando en Supabase Auth...')
      
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
          error: 'No se pudo crear el usuario en autenticación'
        }, { status: 500 })
      }

      authUserId = authData.user.id
    }

    // Crear o actualizar usuario en la tabla users con rol admin
    const userData: any = {
      id: authUserId,
      email: email,
      display_name: displayName,
      credits: 1000,
      role: 'admin',
      updated_at: new Date().toISOString()
    }

    let result
    if (existingUser) {
      // Actualizar usuario existente
      console.log('Actualizando usuario existente con rol admin...')
      result = await supabaseAdmin?.from('users')
        .update(userData)
        .eq('email', email)
        .select()
        .single()
    } else {
      // Crear nuevo usuario
      console.log('Creando nuevo usuario admin...')
      userData.created_at = new Date().toISOString()
      result = await supabaseAdmin?.from('users')
        .insert(userData)
        .select()
        .single()
    }

    if (result?.error) {
      console.error('Error creating/updating user in database:', result.error)
      return NextResponse.json({
        success: false,
        error: 'Error al crear/actualizar usuario en la base de datos',
        details: result.error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: existingUser ? 'Usuario actualizado como administrador' : 'Usuario administrador creado exitosamente',
      user: result?.data
    })

  } catch (error) {
    console.error('Error in ensure admin API:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
