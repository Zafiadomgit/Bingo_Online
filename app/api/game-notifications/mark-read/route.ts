import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { notificationId } = await request.json()

    if (!notificationId) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID de notificación es requerido' 
      }, { status: 400 })
    }

    // Marcar notificación como leída
    const { data, error } = await supabase
      .from('game_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) {
      console.error('Error marking notification as read:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al marcar la notificación como leída' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      notification: data 
    })

  } catch (error) {
    console.error('Error in mark-read API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
