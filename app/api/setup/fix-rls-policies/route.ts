import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log('🔧 Verificando políticas de RLS...')
    
    // Verificar si tenemos admin client
    if (!supabaseAdmin) {
      console.log('⚠️ No hay SUPABASE_SERVICE_ROLE_KEY configurado')
      return NextResponse.json({
        success: false,
        error: 'No hay SUPABASE_SERVICE_ROLE_KEY configurado',
        message: 'Necesitas agregar SUPABASE_SERVICE_ROLE_KEY a tu archivo .env'
      })
    }

    // Crear una política más permisiva para administradores
    const adminPolicy = `
      CREATE OR REPLACE POLICY "Service role can insert cards" ON bingo_cards
        FOR INSERT WITH CHECK (true);
    `

    const { error: policyError } = await supabaseAdmin.rpc('exec_sql', { sql: adminPolicy })
    
    if (policyError) {
      console.error('Error creating policy:', policyError)
      return NextResponse.json({
        success: false,
        error: 'Error creando política',
        details: policyError.message
      })
    }

    console.log('✅ Política de RLS actualizada')

    return NextResponse.json({
      success: true,
      message: 'Políticas de RLS actualizadas exitosamente'
    })

  } catch (error) {
    console.error('Error in fix RLS API:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
