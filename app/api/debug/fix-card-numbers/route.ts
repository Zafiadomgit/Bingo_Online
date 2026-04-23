import { NextRequest, NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    console.log('🔧 Iniciando limpieza de números de cartón...')

    // Buscar números duplicados usando una consulta más simple
    const { data: allRecords, error: allRecordsError } = await supabase
      .from('card_numbers')
      .select('id, number, game_id, created_at')
      .order('number, game_id, created_at')

    if (allRecordsError) {
      console.error('Error obteniendo registros:', allRecordsError)
      return NextResponse.json(
        { success: false, error: 'Error obteniendo registros' },
        { status: 500 }
      )
    }

    // Agrupar por número y juego para encontrar duplicados
    const groupedRecords = new Map<string, any[]>()
    for (const record of allRecords || []) {
      const key = `${record.number}-${record.game_id}`
      if (!groupedRecords.has(key)) {
        groupedRecords.set(key, [])
      }
      groupedRecords.get(key)!.push(record)
    }

    const duplicates = Array.from(groupedRecords.values()).filter(group => group.length > 1)

    console.log(`🔍 Encontrados ${duplicates.length} grupos de números duplicados`)

    let fixedCount = 0
    const fixDetails = []

    // Procesar cada grupo de duplicados
    for (const duplicateGroup of duplicates) {
      const firstRecord = duplicateGroup[0]
      console.log(`🔧 Procesando duplicados para número ${firstRecord.number} en juego ${firstRecord.game_id}`)

      // Los registros ya están en el grupo, ordenados por created_at
      const records = duplicateGroup.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

      if (records.length <= 1) {
        continue
      }

      // Mantener el más reciente y eliminar los anteriores
      const keepRecord = records[records.length - 1]
      const deleteRecords = records.slice(0, -1)

      console.log(`🗑️ Eliminando ${deleteRecords.length} registros duplicados, manteniendo el más reciente`)

      for (const record of deleteRecords) {
        const { error: deleteError } = await supabase
          .from('card_numbers')
          .delete()
          .eq('id', record.id)

        if (deleteError) {
          console.error(`Error eliminando registro ${record.id}:`, deleteError)
        } else {
          fixedCount++
          fixDetails.push(`Eliminado duplicado ID: ${record.id}, Número: ${record.number}`)
        }
      }
    }

    // Limpiar registros huérfanos (sin juego asociado)
    console.log('🧹 Limpiando registros huérfanos...')
    
    // Obtener todos los IDs de juegos existentes
    const { data: existingGames, error: gamesError } = await supabase
      .from('bingo_games')
      .select('id')

    if (!gamesError && existingGames) {
      const gameIds = existingGames.map(game => game.id)
      
      // Obtener registros que no pertenecen a juegos existentes
      const { data: orphanRecords, error: orphanError } = await supabase
        .from('card_numbers')
        .select('id, number, game_id')
        .not('game_id', 'in', `(${gameIds.map(id => `'${id}'`).join(',')})`)

      if (!orphanError && orphanRecords && orphanRecords.length > 0) {
        console.log(`🗑️ Encontrados ${orphanRecords.length} registros huérfanos`)
        
        for (const orphan of orphanRecords) {
          const { error: deleteOrphanError } = await supabase
            .from('card_numbers')
            .delete()
            .eq('id', orphan.id)

          if (!deleteOrphanError) {
            fixedCount++
            fixDetails.push(`Eliminado huérfano ID: ${orphan.id}, Número: ${orphan.number}`)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Limpieza completada',
      details: {
        duplicatesFound: duplicates?.length || 0,
        recordsFixed: fixedCount,
        fixDetails: fixDetails.slice(0, 20) // Limitar a 20 detalles para evitar respuesta muy larga
      }
    })

  } catch (error) {
    console.error('Error en limpieza de números de cartón:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
