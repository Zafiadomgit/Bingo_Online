import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST() {
    try {
        const now = new Date()
        console.log('🔄 [TRANSITION] Verificando juegos en espera...', now.toISOString())

        // Buscar juegos que terminaron su período de espera
        const { data: waitingGames, error } = await supabase
            .from('bingo_games')
            .select('*')
            .eq('status', 'ACTIVE_WAITING')
            .lte('waiting_until', now.toISOString())

        if (error) {
            console.error('[TRANSITION] Error getting waiting games:', error)
            return NextResponse.json({
                success: false,
                error: 'Error obteniendo juegos en espera'
            }, { status: 500 })
        }

        if (!waitingGames || waitingGames.length === 0) {
            console.log('✅ [TRANSITION] No hay juegos para transicionar')
            return NextResponse.json({
                success: true,
                message: 'No hay juegos para transicionar',
                transitioned: 0
            })
        }

        console.log(`🎮 [TRANSITION] Encontrados ${waitingGames.length} juegos para activar`)

        // Transicionar a ACTIVE
        const results = []
        for (const game of waitingGames) {
            const { error: updateError } = await supabase
                .from('bingo_games')
                .update({
                    status: 'ACTIVE',
                    updated_at: new Date().toISOString()
                })
                .eq('id', game.id)

            if (!updateError) {
                console.log(`✅ [TRANSITION] Juego ${game.id} (${game.name}) activado`)
                results.push({ gameId: game.id, name: game.name, success: true })
            } else {
                console.error(`❌ [TRANSITION] Error activando juego ${game.id}:`, updateError)
                results.push({ gameId: game.id, success: false, error: updateError.message })
            }
        }

        const successCount = results.filter(r => r.success).length
        console.log(`✅ [TRANSITION] Proceso completado: ${successCount}/${waitingGames.length} juegos activados`)

        return NextResponse.json({
            success: true,
            message: `${successCount} juegos transicionados a ACTIVE`,
            transitioned: successCount,
            results
        })
    } catch (error) {
        console.error('[TRANSITION] Error in transition job:', error)
        return NextResponse.json({
            success: false,
            error: 'Error interno del servidor',
            details: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}

// También permitir GET para testing
export async function GET() {
    return POST()
}
