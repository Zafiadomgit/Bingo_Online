import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Middleware simplificado sin autenticación
  // Redirigir a /test-bingo si no es una ruta válida
  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone()
    url.pathname = "/test-bingo"
    return Response.redirect(url)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
