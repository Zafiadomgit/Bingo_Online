import { NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    console.log('🧪 Probando funcionalidad después de habilitar RLS...');

    const results = {
      timestamp: new Date().toISOString(),
      tests: [] as any[]
    };

    // Test 1: Verificar acceso a usuarios
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .limit(1);

      results.tests.push({
        test: 'Users table access',
        success: !usersError,
        error: usersError?.message || null,
        data: users?.length || 0
      });
    } catch (error: any) {
      results.tests.push({
        test: 'Users table access',
        success: false,
        error: error.message
      });
    }

    // Test 2: Verificar acceso a bingo_cards
    try {
      const { data: cards, error: cardsError } = await supabase
        .from('bingo_cards')
        .select('id, card_number')
        .limit(1);

      results.tests.push({
        test: 'Bingo cards table access',
        success: !cardsError,
        error: cardsError?.message || null,
        data: cards?.length || 0
      });
    } catch (error: any) {
      results.tests.push({
        test: 'Bingo cards table access',
        success: false,
        error: error.message
      });
    }

    // Test 3: Verificar acceso a bingo_games
    try {
      const { data: games, error: gamesError } = await supabase
        .from('bingo_games')
        .select('id, name')
        .limit(1);

      results.tests.push({
        test: 'Bingo games table access',
        success: !gamesError,
        error: gamesError?.message || null,
        data: games?.length || 0
      });
    } catch (error: any) {
      results.tests.push({
        test: 'Bingo games table access',
        success: false,
        error: error.message
      });
    }

    // Test 4: Verificar acceso a purchase_requests
    try {
      const { data: requests, error: requestsError } = await supabase
        .from('purchase_requests')
        .select('id, email')
        .limit(1);

      results.tests.push({
        test: 'Purchase requests table access',
        success: !requestsError,
        error: requestsError?.message || null,
        data: requests?.length || 0
      });
    } catch (error: any) {
      results.tests.push({
        test: 'Purchase requests table access',
        success: false,
        error: error.message
      });
    }

    // Test 5: Verificar que supabaseAdmin siga funcionando
    try {
      if (supabaseAdmin) {
        const { data: adminTest, error: adminError } = await supabaseAdmin
          .from('users')
          .select('id')
          .limit(1);

        results.tests.push({
          test: 'Admin client access',
          success: !adminError,
          error: adminError?.message || null,
          data: adminTest?.length || 0
        });
      } else {
        results.tests.push({
          test: 'Admin client access',
          success: false,
          error: 'Admin client not available'
        });
      }
    } catch (error: any) {
      results.tests.push({
        test: 'Admin client access',
        success: false,
        error: error.message
      });
    }

    // Resumen de resultados
    const successCount = results.tests.filter(t => t.success).length;
    const totalTests = results.tests.length;
    const allPassed = successCount === totalTests;

    return NextResponse.json({
      success: allPassed,
      message: `RLS Test Results: ${successCount}/${totalTests} tests passed`,
      summary: {
        total: totalTests,
        passed: successCount,
        failed: totalTests - successCount,
        allPassed
      },
      results
    });

  } catch (error: any) {
    console.error('Error in RLS test API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
