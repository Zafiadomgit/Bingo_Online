import { NextRequest, NextResponse } from 'next/server'
import { dataService } from '@/lib/data-service'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { gameId } = await request.json()

    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticación requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const userData = verifyToken(token)
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      )
    }

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: 'ID del juego requerido' },
        { status: 400 }
      )
    }

    // Comprar cartón
    const result = await dataService.purchaseCard(gameId, userData.id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      card: result.card
    })

  } catch (error) {
    console.error('Error purchasing card:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
