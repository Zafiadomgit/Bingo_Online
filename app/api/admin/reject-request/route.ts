import { NextResponse } from 'next/server'

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

export async function POST(request: Request) {
  try {
    const { requestId } = await request.json()
    if (!requestId) return NextResponse.json({ success: false, error: 'ID de solicitud requerido' }, { status: 400 })

    const updated = await supabaseFetch(`purchase_requests?id=eq.${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'rejected', updated_at: new Date().toISOString() })
    })

    if (!updated || updated.length === 0) return NextResponse.json({ success: false, error: 'Solicitud no encontrada' }, { status: 404 })

    return NextResponse.json({ success: true, message: 'Solicitud rechazada exitosamente', updatedRequest: updated[0] })
  } catch (error: any) {
    console.error('Error in reject request:', error)
    return NextResponse.json({ success: false, error: 'Error interno', details: error.message }, { status: 500 })
  }
}
