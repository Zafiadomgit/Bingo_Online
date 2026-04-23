"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Shield, User, Mail, Lock, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AdminSetupPage() {
  const [formData, setFormData] = useState({
    email: "admin@bingo.com",
    password: "admin123",
    displayName: "Administrador"
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/ensure-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Usuario Admin Creado",
          description: `Administrador ${data.user.email} creado exitosamente`,
        })
        
        // Redirigir al login
        setTimeout(() => {
          window.location.href = '/auth/login'
        }, 2000)
      } else {
        toast({
          title: "❌ Error",
          description: data.error || "Error al crear el usuario administrador",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating admin:', error)
      toast({
        title: "❌ Error de Conexión",
        description: "No se pudo crear el usuario administrador",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{background: 'linear-gradient(135deg, #121D40 0%, #143C8C 50%, #123273 100%)'}}>
      {/* Floating animated circles */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" style={{backgroundColor: '#F2E394'}}></div>
      <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" style={{backgroundColor: '#D9A13B'}}></div>
      <div className="absolute bottom-1/4 left-1/3 w-40 h-40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" style={{backgroundColor: '#F2E394'}}></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-4 border-yellow-400 shadow-2xl">
          <CardHeader className="bg-yellow-400 text-white p-6 rounded-t-lg text-center">
            <CardTitle className="text-3xl font-bold uppercase flex items-center justify-center gap-2">
              <Shield className="w-8 h-8" />
              Crear Admin
            </CardTitle>
            <CardDescription className="text-yellow-100 text-lg mt-1">
              Configurar usuario administrador
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-gray-700 font-semibold">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    required 
                    className="rounded-xl border-2 border-gray-300 focus:border-yellow-500 text-lg py-3"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="flex items-center gap-2 text-gray-700 font-semibold">
                    <User className="w-4 h-4" />
                    Nombre
                  </Label>
                  <Input 
                    id="displayName" 
                    name="displayName" 
                    value={formData.displayName} 
                    onChange={handleInputChange} 
                    required 
                    className="rounded-xl border-2 border-gray-300 focus:border-yellow-500 text-lg py-3"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2 text-gray-700 font-semibold">
                    <Lock className="w-4 h-4" />
                    Contraseña
                  </Label>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    required 
                    className="rounded-xl border-2 border-gray-300 focus:border-yellow-500 text-lg py-3"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white py-4 text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? "CREANDO ADMIN..." : "CREAR ADMINISTRADOR"}
                  </Button>
                  
                  <Button 
                    type="button"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/setup/add-role-column', {
                          method: 'POST'
                        })
                        const data = await response.json()
                        
                        if (data.success) {
                          toast({
                            title: "✅ Columna role existe",
                            description: data.message,
                          })
                        } else {
                          toast({
                            title: "❌ Problema con la tabla",
                            description: data.error,
                            variant: "destructive",
                          })
                          
                          // Mostrar instrucciones si la columna no existe
                          if (data.instructions) {
                            console.log('Instrucciones:', data.instructions)
                            console.log('Comando SQL:', data.sqlCommand)
                          }
                        }
                      } catch (error) {
                        console.error('Error:', error)
                        toast({
                          title: "Error",
                          description: "No se pudo verificar la tabla",
                          variant: "destructive",
                        })
                      }
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 text-lg font-bold shadow-xl"
                  >
                    🔍 Verificar Estructura de Tabla
                  </Button>
                </div>
                
                <Link href="/auth/login">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2 py-3 text-lg border-2 border-gray-300 hover:border-yellow-500"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al Login
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
