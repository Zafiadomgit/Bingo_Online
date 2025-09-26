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
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simular registro (sin funcionalidad real)
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Función no disponible",
        description: "El sistema de registro estará disponible próximamente",
        variant: "destructive",
      })
    }, 1000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Crear Cuenta</h1>
          <p className="text-slate-600">Únete a la mejor experiencia de bingo online</p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-slate-900">¡Comienza a jugar!</CardTitle>
            <CardDescription>
              Crea tu cuenta y recibe créditos de bienvenida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="rounded-xl"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                ¿Ya tienes cuenta?{" "}
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-800 text-center">
                <strong>¡Bienvenido!</strong> Al registrarte recibirás 1000 créditos gratis para comenzar a jugar.
              </p>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-800 text-center">
                <strong>Nota:</strong> El sistema de registro estará disponible próximamente. 
                Por ahora puedes probar el bingo sin registro.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
