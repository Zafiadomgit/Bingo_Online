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

export async function GET() {
  try {
    const rates = await supabaseFetch('exchange_rates?order=updated_at.desc&limit=10') || []
    return NextResponse.json({ success: true, rates })
  } catch {
    // Si la tabla no existe, devolver tasas por defecto
    return NextResponse.json({ success: true, rates: [{ from: 'USD', to: 'VES', rate: 36.5 }, { from: 'USD', to: 'COP', rate: 4200 }] })
  }
}

export async function POST(request: Request) {
  try {
    const { from, to, rate } = await request.json()
    const existing = await supabaseFetch(`exchange_rates?from=eq.${from}&to=eq.${to}&limit=1`)
    if (existing?.length > 0) {
      await supabaseFetch(`exchange_rates?from=eq.${from}&to=eq.${to}`, { method: 'PATCH', body: JSON.stringify({ rate, updated_at: new Date().toISOString() }) })
    } else {
      await supabaseFetch('exchange_rates', { method: 'POST', body: JSON.stringify({ from, to, rate }) })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
