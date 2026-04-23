import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function supabaseFetch(path: string, options: any = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esrrtfjzxrosytuwfokn.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {})
    },
    cache: 'no-store'
  })
  if (!res.ok) { const err = await res.text(); throw new Error(`Supabase: ${err}`) }
  const text = await res.text(); return text ? JSON.parse(text) : null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    // Obtener TODAS las solicitudes con promotor (approved y pending)
    // Si viene gameId, filtrar por juego; si no, mostrar todos
    let path = `purchase_requests?promoter_name=not.is.null&select=promoter_name,amount,status,game_id`
    if (gameId) {
      path += `&game_id=eq.${gameId}`
    }

    const requests = await supabaseFetch(path) || []

    // Agrupar por promotor — contar todas las ventas (approved + pending)
    const statsMap: Record<string, { promoter_name: string; total_sales: number; total_revenue: number; pending: number; approved: number }> = {}

    requests.forEach((req: any) => {
      const name = req.promoter_name
      if (!name || name === '' || name === 'none') return

      if (!statsMap[name]) {
        statsMap[name] = { promoter_name: name, total_sales: 0, total_revenue: 0, pending: 0, approved: 0 }
      }

      statsMap[name].total_sales += 1

      if (req.status === 'approved') {
        statsMap[name].approved += 1
        statsMap[name].total_revenue += Number(req.amount) || 0
      } else if (req.status === 'pending') {
        statsMap[name].pending += 1
      }
    })

    const rows = Object.values(statsMap).sort((a, b) => b.total_sales - a.total_sales)

    return NextResponse.json({ success: true, stats: rows, gameId: gameId || 'all' })

  } catch (error: any) {
    console.error('Error fetching promoter stats:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
