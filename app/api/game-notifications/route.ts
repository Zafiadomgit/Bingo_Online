import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email es requerido'
      }, { status: 400 })
    }

    // Obtener notificaciones del usuario
    const { data: notifications, error } = await supabase
      .from('game_notifications')
      .select(`
        id,
        game_id,
        user_email,
        notification_type,
        message,
        scheduled_at,
        is_read,
        created_at,
        read_at
      `)
      .eq('user_email', email)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al cargar las notificaciones'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || []
    })

  } catch (error) {
    console.error('Error in game-notifications API:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
