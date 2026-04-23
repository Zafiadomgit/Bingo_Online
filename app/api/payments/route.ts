import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
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

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const gameId = searchParams.get('gameId')

    // Construir filtros
    const where: any = {}
    
    if (userId && userId !== userData.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      )
    }

    if (userId) {
      where.user_id = userId
    }

    if (gameId) {
      where.game_id = gameId
    }

    // Obtener pagos
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Error al obtener pagos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      payments: payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        payment_method: payment.payment_method,
        receipt_url: payment.receipt_url,
        created_at: payment.created_at,
        completed_at: payment.completed_at
      }))
    })

  } catch (error) {
    console.error('Error getting payments:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
