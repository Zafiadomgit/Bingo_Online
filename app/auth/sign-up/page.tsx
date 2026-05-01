"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    telefono: "",
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validaciones del frontend
    if (!formData.nombre.trim()) {
      setError("El nombre es requerido")
      return
    }
    if (!formData.apellido.trim()) {
      setError("El apellido es requerido")
      return
    }
    if (!formData.telefono.trim()) {
      setError("El número de teléfono es requerido")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "❌ Contraseñas no coinciden",
        description: "Las contraseñas ingresadas no son iguales. Por favor, verifica e intenta nuevamente.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "❌ Formato de correo inválido",
        description: "Por favor, ingresa un correo electrónico válido (ejemplo: usuario@dominio.com)",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      // Intentar primero con la API principal de Supabase Auth
      let response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          display_name: `${formData.nombre} ${formData.apellido}`.trim(),
          telefono: formData.telefono
        }),
      })

      let data = await response.json()

      // No intentar con API directa - mantener seguridad con emails reales

      if (data.success) {
        toast({
          title: "¡Registro exitoso!",
          description: "Tu cuenta ha sido creada exitosamente",
        })
        // Redirigir al onboarding para nuevos usuarios
        window.location.href = '/onboarding'
      } else {
        toast({
          title: data.error || "Error al crear la cuenta",
          description: data.details || "Por favor, revisa los datos e intenta nuevamente",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
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
              🎰 CREAR CUENTA 🎰
            </h1>
            <p className="text-xl font-semibold animate-pulse-slow" style={{color: '#F2E394'}}>
              ¡ÚNETE A LA DIVERSIÓN!
            </p>
          </div>

          <Card className="backdrop-blur-sm shadow-2xl transform hover:scale-105 transition-all duration-300 animate-fade-in" style={{backgroundColor: 'rgba(242, 227, 148, 0.9)', border: '4px solid #D9A13B'}}>
            <CardHeader className="p-6 rounded-t-lg" style={{backgroundColor: '#143C8C'}}>
              <CardTitle className="text-3xl text-center font-bold uppercase" style={{color: '#F2E394'}}>
                🚀 ¡COMENZAR A JUGAR!
              </CardTitle>
              <CardDescription className="text-center text-lg" style={{color: '#F2E394'}}>
                Crea tu cuenta y recibe créditos de bienvenida
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre" className="text-lg font-bold" style={{color: '#121D40'}}>Nombre *</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      type="text"
                      placeholder="Tu nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                      className="rounded-xl border-2 border-gray-300 focus:border-yellow-500 text-lg py-3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido" className="text-lg font-bold" style={{color: '#121D40'}}>Apellido *</Label>
                    <Input
                      id="apellido"
                      name="apellido"
                      type="text"
                      placeholder="Tu apellido"
                      value={formData.apellido}
                      onChange={handleChange}
                      required
                      className="rounded-xl border-2 border-gray-300 focus:border-yellow-500 text-lg py-3"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono" className="text-lg font-bold" style={{color: '#121D40'}}>Número de Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    placeholder="+58 412 0000000"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    required
                    className="rounded-xl border-2 border-gray-300 focus:border-green-500 h-12 text-lg"
                  />
                  <Label htmlFor="email" className="text-lg font-bold" style={{color: '#121D40'}}>Correo electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="rounded-xl border-2 border-gray-300 focus:border-yellow-500 text-lg py-3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-lg font-bold" style={{color: '#121D40'}}>Contraseña</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="rounded-xl border-2 border-gray-300 focus:border-yellow-500 text-lg py-3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-lg font-bold" style={{color: '#121D40'}}>Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="rounded-xl border-2 border-gray-300 focus:border-yellow-500 text-lg py-3"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full rounded-xl py-4 text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 animate-pulse"
                  style={{background: 'linear-gradient(90deg, #D9A13B 0%, #F2E394 100%)', color: '#121D40'}}
                  disabled={isLoading}
                >
                  {isLoading ? "🎯 CREANDO CUENTA..." : "🎯 ¡CREAR CUENTA!"}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-lg" style={{color: '#121D40'}}>
                  ¿Ya tienes cuenta?{" "}
                  <Link href="/auth/login" className="font-bold text-xl" style={{color: '#143C8C'}}>
                    🔑 INICIAR SESIÓN AQUÍ
                  </Link>
                </p>
              </div>

              <div className="mt-8 p-6 rounded-xl shadow-xl" style={{background: 'linear-gradient(90deg, #143C8C 0%, #123273 100%)', border: '4px solid #143C8C'}}>
                <p className="text-lg text-center font-bold" style={{color: '#F2E394'}}>
                  <strong>🎁 ¡BIENVENIDO!</strong><br/>
                  Únete a la diversión y comienza a jugar Bingo Fortuna.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
