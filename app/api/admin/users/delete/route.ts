import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Base de datos no configurada' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    // Prevent deleting the main admin
    if (userId === '00000000-0000-0000-0000-000000000000') {
      return NextResponse.json({ success: false, error: 'Cannot delete the main administrator' }, { status: 403 })
    }

    // 1. Delete user cards
    const { error: cardsError } = await supabase.from('bingo_cards').delete().eq('user_id', userId)
    if (cardsError) throw cardsError

    // 2. Delete the user
    const { error: userError } = await supabase.from('users').delete().eq('id', userId)
    if (userError) throw userError

    return NextResponse.json({ success: true, message: 'User and associated data deleted successfully' })

  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
