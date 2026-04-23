import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password, display_name } = await request.json()

    if (!email || !password) return NextResponse.json({ success: false, error: 'Email y contraseña son requeridos' }, { status: 400 })
    if (password.length < 6) return NextResponse.json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })

    const cleanEmail = email.toLowerCase().trim()

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .limit(1)

    if (existing && existing.length > 0) return NextResponse.json({ success: false, error: 'El email ya está registrado' }, { status: 400 })

    const hashedPassword = await bcrypt.hash(password, 12)
    const newId = uuidv4()
    
    const { data: newUsers, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: newId, 
        email: cleanEmail, 
        password: hashedPassword,
        display_name: display_name || cleanEmail, 
        credits: 1000, 
        role: 'user'
      }])
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ success: false, error: 'Error al crear usuario' }, { status: 500 })
    }

    const newUser = newUsers?.[0]
    if (!newUser) return NextResponse.json({ success: false, error: 'Error al crear usuario' }, { status: 500 })

    const { password: _, ...safeUser } = newUser
    return NextResponse.json({ success: true, message: 'Usuario creado exitosamente', user: safeUser })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
