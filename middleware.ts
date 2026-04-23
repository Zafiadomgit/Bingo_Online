import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('bingo_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '')

    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)

    if (!token) {
      return NextResponse.redirect(loginUrl)
    }

    // Verificar estructura JWT (header.payload.signature)
    const parts = token.split('.')
    if (parts.length !== 3) {
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('bingo_token')
      return response
    }

    try {
      // Usar atob para Edge Runtime (más seguro que Buffer en middleware)
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const payloadJson = atob(payloadBase64)
      const payload = JSON.parse(payloadJson)

      console.log(`[Middleware] Token validado para ${payload.email}. Role: ${payload.role}`)

      // Verificar expiración
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp && payload.exp < now) {
        console.warn(`[Middleware] Token expirado para ${payload.email}`)
        const response = NextResponse.redirect(loginUrl)
        response.cookies.delete('bingo_token')
        return response
      }

      // Verificar rol admin (Case insensitive)
      const userRole = (payload.role || '').toLowerCase()
      if (userRole !== 'admin') {
        console.warn(`[Middleware] Acceso denegado: rol ${userRole} no tiene privilegios admin`)
        const response = NextResponse.redirect(loginUrl)
        // Solo borrar token si no queremos que sigan logueados como user en el admin
        response.cookies.delete('bingo_token') 
        return response
      }

    } catch (e) {
      console.error('[Middleware] Error decodificando token:', e)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('bingo_token')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
