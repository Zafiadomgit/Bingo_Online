import { NextRequest, NextResponse } from 'next/server'
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

export async function GET() {
  try {
    const promoters = await supabaseFetch('promoters?order=name.asc') || []
    return NextResponse.json({ success: true, promoters })
  } catch (error: any) {
    console.error('Error fetching promoters:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()
    if (!name) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })

    const id = uuidv4()
    await supabaseFetch('promoters', { method: 'POST', body: JSON.stringify({ id, name }) })
    return NextResponse.json({ success: true, message: 'Promotor añadido exitosamente', id })
  } catch (error: any) {
    if (error.message?.includes('23505')) {
      return NextResponse.json({ success: false, error: 'El promotor ya existe' }, { status: 400 })
    }
    console.error('Error adding promoter:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })

    await supabaseFetch(`promoters?id=eq.${id}`, { method: 'DELETE' })
    return NextResponse.json({ success: true, message: 'Promotor eliminado exitosamente' })
  } catch (error: any) {
    console.error('Error deleting promoter:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
