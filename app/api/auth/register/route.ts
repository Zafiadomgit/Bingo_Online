import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

async function supabaseFetch(path: string, options: any = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esrrtfjzxrosytuwfokn.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation', ...(options.headers || {}) },
    cache: 'no-store'
  })
  if (!res.ok) { const err = await res.text(); throw new Error(`Supabase: ${err}`) }
  const text = await res.text(); return text ? JSON.parse(text) : null
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, display_name, telefono } = await request.json()
    if (!email || !password) return NextResponse.json({ success: false, error: 'Email y contraseña son requeridos' }, { status: 400 })
    if (password.length < 6) return NextResponse.json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })

    const cleanEmail = email.toLowerCase().trim()
    const existing = await supabaseFetch(`users?email=eq.${encodeURIComponent(cleanEmail)}&select=id&limit=1`)
    if (existing?.length > 0) return NextResponse.json({ success: false, error: 'El email ya está registrado' }, { status: 400 })

    const hashedPassword = await bcrypt.hash(password, 12)
    const newUsers = await supabaseFetch('users', {
      method: 'POST',
      body: JSON.stringify({ id: uuidv4(), email: cleanEmail, password: hashedPassword, display_name: display_name || cleanEmail, credits: 1000, role: 'user', telefono: telefono || null })
    })

    const newUser = newUsers?.[0]
    if (!newUser) return NextResponse.json({ success: false, error: 'Error al crear usuario' }, { status: 500 })

    const { password: _, ...safeUser } = newUser
    return NextResponse.json({ success: true, message: 'Usuario creado exitosamente', user: safeUser })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
