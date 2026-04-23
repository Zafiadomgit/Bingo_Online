import { NextResponse } from 'next/server'

/**
 * Returns a 404 response in production to hide debug endpoints.
 * Call this at the start of every /api/debug route.
 * 
 * Usage:
 *   const guard = devOnlyGuard()
 *   if (guard) return guard
 */
export function devOnlyGuard(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }
  return null
}
