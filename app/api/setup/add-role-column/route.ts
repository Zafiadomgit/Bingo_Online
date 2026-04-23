import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Supabase Admin no está configurado'
      }, { status: 500 })
    }

    console.log('Verificando estructura de la tabla users...')

    // Intentar hacer un select que incluya la columna role para verificar si existe
    const { data: testData, error: testError } = await supabaseAdmin
      .from('users')
      .select('id, email, display_name, role')
      .limit(1)

    if (testError && testError.message.includes('column "role" does not exist')) {
      console.log('La columna role no existe. Necesitas agregarla manualmente.')
      return NextResponse.json({
        success: false,
        error: 'La columna "role" no existe en la tabla users',
        instructions: [
          '1. Ve a tu dashboard de Supabase',
          '2. Ve a Table Editor → users',
          '3. Haz clic en "Add Column"',
          '4. Nombre: role, Tipo: text, Valor por defecto: user',
          '5. O ejecuta este SQL en SQL Editor:',
          '   ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT \'user\';'
        ],
        sqlCommand: "ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';"
      }, { status: 400 })
    }

    if (testError) {
      return NextResponse.json({
        success: false,
        error: 'Error al verificar la tabla',
        details: testError.message
      }, { status: 500 })
    }

    // Si llegamos aquí, la columna role existe
    return NextResponse.json({
      success: true,
      message: 'La columna role ya existe en la tabla users',
      sampleData: testData
    })

  } catch (error) {
    console.error('Error in add role column API:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
