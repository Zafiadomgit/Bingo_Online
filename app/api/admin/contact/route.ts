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

export async function GET() {
  try {
    const settings = await supabaseFetch('admin_settings?key=eq.contact&limit=1')
    const contact = settings?.[0]?.value || ''
    return NextResponse.json({ success: true, contact })
  } catch {
    return NextResponse.json({ success: true, contact: '' })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { contact } = await request.json()
    const existing = await supabaseFetch('admin_settings?key=eq.contact&limit=1')
    if (existing?.length > 0) {
      await supabaseFetch('admin_settings?key=eq.contact', { method: 'PATCH', body: JSON.stringify({ value: contact }) })
    } else {
      await supabaseFetch('admin_settings', { method: 'POST', body: JSON.stringify({ key: 'contact', value: contact }) })
    }
    return NextResponse.json({ success: true, message: 'Contacto actualizado' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
