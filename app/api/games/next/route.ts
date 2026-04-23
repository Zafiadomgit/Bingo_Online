import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Base de datos no configurada' }, { status: 500 })
    }

    const nowStr = new Date().toISOString()
    const nowTime = Date.now()

    // WAITING → ACTIVE solo si NO hay ya un juego ACTIVE andando recientemente
    try {
      const fourHoursAgo = new Date(nowTime - 4 * 60 * 60000).toISOString()
      const { data: activeGames } = await supabase
        .from('bingo_games')
        .select('id, started_at')
        .in('status', ['ACTIVE', 'active', 'ACTIVE_WAITING'])
        .is('finished_at', null)
        .gte('started_at', fourHoursAgo) // Solo considerar juegos activos RECIENTES

      if (!activeGames || activeGames.length === 0) {
        // No hay activos recientes — activar solo el próximo WAITING cuya hora ya llegó
        const { data: toActivate } = await supabase
          .from('bingo_games')
          .select('id')
          .in('status', ['WAITING', 'waiting'])
          .eq('auto_start', true)
          .lte('scheduled_at', nowStr)
          .not('scheduled_at', 'is', null)
          .order('scheduled_at', { ascending: true })
          .limit(1)

        if (toActivate && toActivate.length > 0) {
          await supabase
            .from('bingo_games')
            .update({ status: 'ACTIVE', started_at: nowStr, updated_at: nowStr })
            .eq('id', toActivate[0].id)
        }
      }
    } catch (e) {
      console.error('⚠️ Error en transición WAITING→ACTIVE:', e)
    }

    try {
      // ACTIVE_WAITING → ACTIVE si ya pasaron 90+ segundos
      const ninetySecsAgo = new Date(nowTime - 90000).toISOString()
      const { data: toActiveWaiting } = await supabase
        .from('bingo_games')
        .select('id')
        .eq('status', 'ACTIVE_WAITING')
        .lte('started_at', ninetySecsAgo)
        .not('started_at', 'is', null)

      if (toActiveWaiting && toActiveWaiting.length > 0) {
        await supabase
          .from('bingo_games')
          .update({ status: 'ACTIVE', updated_at: nowStr })
          .in('id', toActiveWaiting.map((g: any) => g.id))
      }
    } catch (e) {
      console.error('⚠️ Error en transición ACTIVE_WAITING→ACTIVE:', e)
    }

    // Obtener juegos — excluye terminados con finished_at
    // Filtramos juegos muy antiguos (más de 24h) para no mostrar "basura"
    const oneDayAgo = new Date(nowTime - 24 * 60 * 60000).toISOString()
    const { data: rawGames, error } = await supabase
      .from('bingo_games')
      .select(`
        *,
        admin:admin_id (id, email, display_name),
        bingo_cards (count)
      `)
      .in('status', ['WAITING', 'ACTIVE', 'waiting', 'active', 'SCHEDULED', 'ACTIVE_WAITING'])
      .is('finished_at', null)
      .gte('created_at', oneDayAgo) // Ocultar juegos zombis de hace más de 1 día
      .not('name', 'ilike', '[ELIMINADO]%')
      .order('scheduled_at', { ascending: true })

    if (error) throw error

    const games = (rawGames || []).map((g: any) => {
      const adminObj = Array.isArray(g.admin) ? g.admin[0] : g.admin
      return {
        ...g,
        admin_id_val: adminObj?.id,
        admin_email: adminObj?.email,
        admin_name: adminObj?.display_name,
        total_cards_sold: Array.isArray(g.bingo_cards) ? (g.bingo_cards[0]?.count || 0) : 0,
        admin: adminObj || undefined
      }
    })

    if (games.length === 0) {
      const response = NextResponse.json({
        success: false,
        nextGame: null,
        games: [],
        message: 'No hay juegos disponibles'
      })
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      return response
    }

    // Prioridad: ACTIVE > ACTIVE_WAITING > WAITING (el más próximo) - Solo si son RECIENTES
    const now = new Date()
    const activeThreshold = new Date(now.getTime() - 4 * 60 * 60 * 1000) // 4 horas

    const nextGame =
      games.find((g: any) => (g.status === 'ACTIVE' || g.status === 'active') && (!g.started_at || new Date(g.started_at) > activeThreshold)) ||
      games.find((g: any) => g.status === 'ACTIVE_WAITING') ||
      games.find((g: any) => g.status === 'WAITING' || g.status === 'waiting') ||
      games[0]

    const canPurchase = nextGame.status === 'WAITING' || nextGame.status === 'waiting'

    const response = NextResponse.json({
      success: true,
      nextGame,
      games,
      canPurchase
    })

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response

  } catch (error: any) {
    console.error('❌ Error getting next game:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}
