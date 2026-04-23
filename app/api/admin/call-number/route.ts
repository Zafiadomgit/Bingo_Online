import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    // Llamar al endpoint de llamada de números
    const callResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/games/call-number`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ gameId })
    })

    const callData = await callResponse.json()

    if (!callData.success) {
      return NextResponse.json(callData, { status: 400 })
    }

    return NextResponse.json(callData)

  } catch (error) {
    console.error('Error calling number from admin:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
