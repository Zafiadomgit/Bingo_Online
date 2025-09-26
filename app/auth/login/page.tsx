"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simular login (sin funcionalidad real)
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Función no disponible",
        description: "El sistema de autenticación estará disponible próximamente",
        variant: "destructive",
      })
    }, 1000)
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Iniciar Sesión</h1>
          <p className="text-slate-600">Accede a tu cuenta para jugar bingo</p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-slate-900">¡Bienvenido de vuelta!</CardTitle>
            <CardDescription>
              Inicia sesión para continuar jugando
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                ¿No tienes cuenta?{" "}
                <Link href="/auth/sign-up" className="text-blue-600 hover:text-blue-700 font-medium">
                  Regístrate aquí
                </Link>
              </p>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-800 text-center">
                <strong>Nota:</strong> El sistema de autenticación estará disponible próximamente. 
                Por ahora puedes probar el bingo sin registro.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
