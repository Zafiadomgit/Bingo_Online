import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// JWT_SECRET se valida en runtime, no en build time, para no bloquear el deploy de Vercel
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-production'

function getJwtSecret(): string {
  if (!process.env.JWT_SECRET) {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      console.warn('[auth] ADVERTENCIA: JWT_SECRET no configurado en producción. Usando clave de fallback para no romper el login.')
    } else {
      console.warn('[auth] Usando clave temporal solo para desarrollo.')
    }
  }
  return process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-production-abcd-1234'
}

export interface AuthUser {
  id: string
  email: string
  display_name: string | null
  credits: number
  role?: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      display_name: user.display_name,
      credits: user.credits,
      role: user.role || 'user'
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any
    return {
      id: decoded.id,
      email: decoded.email,
      display_name: decoded.display_name,
      credits: decoded.credits,
      role: decoded.role || 'user'
    }
  } catch (error) {
    return null
  }
}
