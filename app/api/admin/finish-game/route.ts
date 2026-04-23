import { NextRequest, NextResponse } from 'next/server'
import { dataService } from '@/lib/data-service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { gameId } = await request.json()

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: 'ID del juego es requerido' },
        { status: 400 }
      )
    }

    const result = await dataService.finishGame(gameId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Juego finalizado exitosamente'
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Error al finalizar el juego' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in finish-game API:', error)
    return NextResponse.json(
      { success: false, error: `Error interno: ${error.message}` },
      { status: 500 }
    )
  }
}
