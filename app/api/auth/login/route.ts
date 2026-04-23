import { NextRequest, NextResponse } from 'next/server'
import { generateToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

async function supabaseFetch(path: string, options: any = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esrrtfjzxrosytuwfokn.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation', ...(options.headers || {}) },
    cache: 'no-store'
  })
  if (!res.ok) { const err = await res.text(); throw new Error(`REST Error: ${err}`) }
  const text = await res.text(); return text ? JSON.parse(text) : null
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email y contraseña son requeridos' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()

    // Buscar usuario por email con REST directo
    // IMPORTANTE: NO usar encodeURIComponent ya que convierte @ en %40 y rompe PostgREST
    const users = await supabaseFetch(`users?email=eq.${cleanEmail}&limit=1`)
    const user = users?.[0]

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuario no registrado' }, { status: 401 })
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ success: false, error: 'Contraseña incorrecta' }, { status: 401 })
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      credits: user.credits,
      role: user.role || 'user'
    })

    const { password: _, ...safeUser } = user

    const response = NextResponse.json({
      success: true,
      message: 'Login exitoso',
      user: safeUser,
      token
    })

    response.cookies.set('bingo_token', token, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}
