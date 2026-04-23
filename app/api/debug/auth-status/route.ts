import { NextRequest, NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    // Verificar localStorage del cliente (esto no funcionará en el servidor)
    // Pero podemos verificar cookies
    const cookies = request.cookies.getAll()

    // Buscar cookies relacionadas con autenticación
    const authCookies = cookies.filter(cookie =>
      cookie.name.includes('bingo') ||
      cookie.name.includes('auth') ||
      cookie.name.includes('token')
    )

    return NextResponse.json({
      success: true,
      message: 'Auth status check',
      cookies: authCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
      totalCookies: cookies.length,
      instructions: 'Revisa la consola del navegador para ver el estado de localStorage'
    })

  } catch (error) {
    console.error('Error checking auth status:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
