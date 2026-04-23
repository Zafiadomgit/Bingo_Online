import { NextRequest, NextResponse } from 'next/server'

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

// GET: obtener notificaciones no descartadas del usuario
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    if (!email) return NextResponse.json({ success: false, error: 'Email requerido' }, { status: 400 })

    // Obtener user_id por email (sin encodeURIComponent que rompe el @)
    const cleanEmail = email.toLowerCase().trim()
    const users = await supabaseFetch(`users?email=eq.${cleanEmail}&select=id&limit=1`)
    const userId = users?.[0]?.id
    if (!userId) return NextResponse.json({ success: true, notifications: [] })

    // Obtener notificaciones no descartadas (dismissed_at IS NULL)
    const notifications = await supabaseFetch(
      `winner_notifications?user_id=eq.${userId}&dismissed_at=is.null&order=won_at.desc`
    ) || []

    return NextResponse.json({ success: true, notifications })
  } catch (error: any) {
    console.error('Error fetching winner notifications:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE: descartar una notificación (marcar dismissed_at)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    if (!notificationId) return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })

    await supabaseFetch(`winner_notifications?id=eq.${notificationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ dismissed_at: new Date().toISOString() })
    })

    return NextResponse.json({ success: true, message: 'Notificación descartada' })
  } catch (error: any) {
    console.error('Error dismissing notification:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
