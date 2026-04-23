import { NextRequest, NextResponse } from 'next/server'
import { SupabaseService } from '@/lib/supabase-service'

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

    const supabaseService = new SupabaseService()
    const requests = await supabaseService.getPurchaseRequestsByEmail(email)

    return NextResponse.json({
      success: true,
      requests
    })

  } catch (error) {
    console.error('Error getting purchase requests:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
