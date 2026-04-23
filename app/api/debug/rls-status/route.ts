import { NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin client not available' 
      }, { status: 500 });
    }

    console.log('🔍 Verificando estado de RLS...');

    // Verificar estado de RLS en las tablas principales
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .rpc('check_rls_status');

    if (rlsError) {
      console.error('Error checking RLS status:', rlsError);
      
      // Fallback: verificar manualmente
      const { data: tablesData, error: tablesError } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['users', 'bingo_cards', 'bingo_games', 'purchase_requests', 'card_numbers']);

      if (tablesError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Error verificando tablas',
          details: tablesError.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'RLS status check completed (fallback mode)',
        tables: tablesData?.map(t => t.table_name) || [],
        note: 'Para verificar RLS, ejecuta el script SQL en Supabase'
      });
    }

    return NextResponse.json({
      success: true,
      rlsStatus,
      message: 'RLS status verified successfully'
    });

  } catch (error: any) {
    console.error('Error in RLS status API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
