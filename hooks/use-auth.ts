import { useState, useEffect } from 'react'
import { AuthUser } from '@/lib/auth'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay un usuario guardado en localStorage
    const savedUser = localStorage.getItem('bingo_user')
    const token = localStorage.getItem('bingo_token')

    console.log('[useAuth] Checking auth state:', {
      savedUser: !!savedUser,
      token: !!token,
      savedUserContent: savedUser ? savedUser.substring(0, 100) + '...' : 'null',
      tokenContent: token ? token.substring(0, 20) + '...' : 'null'
    })

    if (savedUser && token) {
      try {
        const userData = JSON.parse(savedUser)
        console.log('[useAuth] User found:', userData)
        setUser(userData)
      } catch (error) {
        console.error('Error parsing saved user:', error)
        // Limpiar datos corruptos
        localStorage.removeItem('bingo_user')
        localStorage.removeItem('bingo_token')
        // También limpiar cookies
        document.cookie = 'bingo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      }
    } else {
      console.log('[useAuth] No user data found - redirecting to login')
    }

    setIsLoading(false)
  }, [])

  const login = (userData: AuthUser, token: string) => {
    setUser(userData)
    localStorage.setItem('bingo_user', JSON.stringify(userData))
    localStorage.setItem('bingo_token', token)
    // También guardar en cookie para verificación server-side
    document.cookie = `bingo_token=${token}; path=/; max-age=86400; SameSite=Lax`
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('bingo_user')
    localStorage.removeItem('bingo_token')
    // También limpiar cookies
    document.cookie = 'bingo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }

  const updateUser = (userData: AuthUser) => {
    setUser(userData)
    localStorage.setItem('bingo_user', JSON.stringify(userData))
  }

  return {
    user,
    isLoading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user
  }
}
