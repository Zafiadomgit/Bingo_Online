import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verificar si hay token en las cookies
    const token = request.cookies.get('bingo_token')?.value

    // Verificar si hay token en el header Authorization
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    return NextResponse.json({
      success: true,
      hasCookieToken: !!token,
      hasBearerToken: !!bearerToken,
      cookieToken: token ? 'exists' : 'missing',
      bearerToken: bearerToken ? 'exists' : 'missing',
      message: 'Auth check completed'
    })

  } catch (error) {
    console.error('Error checking auth:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
