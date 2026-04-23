"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ArrowLeft, AlertCircle, X, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<'email' | 'password' | 'general' | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setErrorType(null)

    try {
      // Intentar primero con la API principal de Supabase Auth
      let response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
      })

      let data = await response.json()

      // Si falla con error 401, intentar con la API directa
      if (!data.success && response.status === 401) {
        console.log('Intentando login directo...')
        response = await fetch('/api/auth/login-direct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password
          }),
        })
        data = await response.json()
      }

          if (data.success) {
            // Guardar token en localStorage
            localStorage.setItem('bingo_token', data.token)
            localStorage.setItem('bingo_user', JSON.stringify(data.user))
            
            // También guardar en cookies para el middleware
            document.cookie = `bingo_token=${data.token}; path=/; max-age=86400; SameSite=Lax`
            
            toast({
              title: "¡Login exitoso!",
              description: `Bienvenido, ${data.user.display_name || data.user.email}`,
            })
            
            // Redirigir según el rol del usuario
            if (data.user.role === 'admin') {
              window.location.href = '/admin'
            } else {
              window.location.href = '/game'
            }
          } else {
        // Mostrar error específico de la API
        setError(data.error || "❌ ¡Algo salió mal! Inténtalo de nuevo.")
        
        // Determinar tipo de error basado en el mensaje
        if (data.error?.includes('contraseña') || data.error?.includes('password') || data.error?.includes('Contraseña incorrecta')) {
          setErrorType('password')
        } else if (data.error?.includes('usuario') || data.error?.includes('email') || data.error?.includes('no encontrado') || data.error?.includes('Usuario no encontrado')) {
          setErrorType('email')
        } else {
          setErrorType('general')
        }
        
        // También mostrar toast con detalles si están disponibles
        toast({
          title: data.error || "Error de login",
          description: data.details || "Por favor, verifica tus credenciales e intenta nuevamente",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      setError("🌐 ¡Error de conexión! Verifica tu internet e inténtalo de nuevo.")
      setErrorType('general')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{background: 'linear-gradient(135deg, #121D40 0%, #143C8C 50%, #123273 100%)'}}>
      {/* Floating animated circles */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" style={{backgroundColor: '#F2E394'}}></div>
      <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" style={{backgroundColor: '#D9A13B'}}></div>
      <div className="absolute bottom-1/4 left-1/3 w-40 h-40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" style={{backgroundColor: '#F2E394'}}></div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-md mx-auto">
          <div className="mb-8 text-center">
            <Button variant="ghost" asChild className="mb-6 hover:bg-white/20" style={{color: '#F2E394'}}>
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio
              </Link>
            </Button>
            <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg animate-bounce-slow" style={{color: '#F2E394'}}>
              🔑 INICIAR SESIÓN 🔑
            </h1>
            <p className="text-xl font-semibold animate-pulse-slow" style={{color: '#F2E394'}}>
              ¡ACCEDE A TU CUENTA!
            </p>
          </div>

          <Card className="backdrop-blur-sm shadow-2xl transform hover:scale-105 transition-all duration-300 animate-fade-in" style={{backgroundColor: 'rgba(242, 227, 148, 0.9)', border: '4px solid #D9A13B'}}>
            <CardHeader className="p-6 rounded-t-lg" style={{backgroundColor: '#143C8C'}}>
              <CardTitle className="text-3xl text-center font-bold uppercase" style={{color: '#F2E394'}}>
                🎯 ¡BIENVENIDO DE VUELTA!
              </CardTitle>
              <CardDescription className="text-center text-lg" style={{color: '#F2E394'}}>
                Inicia sesión para continuar jugando
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {/* Error Message */}
              {error && (
                <div className={`mb-6 p-4 rounded-xl border-2 shadow-lg animate-bounce-in ${
                  errorType === 'email' ? 'bg-red-50 border-red-300 text-red-800' :
                  errorType === 'password' ? 'bg-orange-50 border-orange-300 text-orange-800' :
                  'bg-red-50 border-red-300 text-red-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-6 h-6 flex-shrink-0" />
                      <p className="font-bold text-lg">{error}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setError(null)
                        setErrorType(null)
                      }}
                      className="text-gray-500 hover:text-gray-700 hover:bg-transparent"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-lg font-bold" style={{color: '#121D40'}}>Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errorType === 'email') {
                        setError(null)
                        setErrorType(null)
                      }
                    }}
                    required
                    className={`rounded-xl border-2 text-lg py-3 transition-all duration-300 ${
                      errorType === 'email' 
                        ? 'border-red-400 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:border-green-500'
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-lg font-bold" style={{color: '#121D40'}}>Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (errorType === 'password') {
                          setError(null)
                          setErrorType(null)
                        }
                      }}
                      required
                      className={`rounded-xl border-2 text-lg py-3 pr-12 transition-all duration-300 ${
                        errorType === 'password' 
                          ? 'border-orange-400 focus:border-orange-500 bg-orange-50' 
                          : 'border-gray-300 focus:border-green-500'
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full rounded-xl py-4 text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 animate-pulse"
                  style={{background: 'linear-gradient(90deg, #D9A13B 0%, #F2E394 100%)', color: '#121D40'}}
                  disabled={isLoading}
                >
                  {isLoading ? "🎯 INICIANDO SESIÓN..." : "🎯 ¡INICIAR SESIÓN!"}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-lg" style={{color: '#121D40'}}>
                  ¿No tienes cuenta?{" "}
                  <Link href="/auth/sign-up" className="font-bold text-xl" style={{color: '#143C8C'}}>
                    🚀 REGÍSTRATE AQUÍ
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
