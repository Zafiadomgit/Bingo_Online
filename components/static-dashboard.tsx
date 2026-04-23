"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserCardsModal } from "@/components/user-cards-modal"
import { GameNotifications } from "@/components/game-notifications"
import { Clock, ShoppingCart, CheckCircle, XCircle, AlertCircle, Plus, Calendar, Users, Gamepad2 } from "lucide-react"
import { useCurrency } from "@/hooks/use-currency"

interface PurchaseRequest {
  id: string
  nombres: string
  apellidos: string
  cantidad_cartones: number
  total: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

interface StaticDashboardProps {
  userEmail: string
  onPurchaseClick: () => void
  refreshTrigger?: number
}

export function StaticDashboard({ userEmail, onPurchaseClick, refreshTrigger }: StaticDashboardProps) {
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [nextGameTime, setNextGameTime] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [showUserCards, setShowUserCards] = useState(false)
  const { formatCurrency } = useCurrency()

  useEffect(() => {
    loadUserRequests()
    loadNextGameTime()
  }, [userEmail, refreshTrigger])

  useEffect(() => {
    if (nextGameTime) {
      const interval = setInterval(() => {
        updateTimeLeft()
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [nextGameTime])

  const loadUserRequests = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/purchase/requests?email=${encodeURIComponent(userEmail)}`)
      const data = await response.json()
      
      if (data.success) {
        setRequests(data.requests)
      }
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadNextGameTime = async () => {
    try {
      console.log('🔄 Cargando próximo juego...')
      const response = await fetch('/api/games/next')
      const data = await response.json()
      
      console.log('📊 Respuesta de próximo juego:', data)
      
      if (data.success && data.nextGame) {
        const gameDate = new Date(data.nextGame.scheduled_at)
        console.log('✅ Próximo juego encontrado:', data.nextGame.name, 'para:', gameDate.toLocaleString())
        setNextGameTime(gameDate)
      } else {
        console.log('❌ No hay próximo juego disponible')
        setNextGameTime(null)
      }
    } catch (error) {
      console.error('Error loading next game:', error)
    }
  }

  const updateTimeLeft = () => {
    if (!nextGameTime) return

    const now = new Date()
    const diff = nextGameTime.getTime() - now.getTime()

    if (diff <= 0) {
      setTimeLeft("¡El juego ya comenzó!")
      return
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    if (days > 0) {
      setTimeLeft(`${days}d ${hours}h ${minutes}m`)
    } else if (hours > 0) {
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
    } else {
      setTimeLeft(`${minutes}m ${seconds}s`)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Aprobado</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rechazado</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendiente</Badge>
    }
  }

  const approvedCards = requests.filter(r => r.status === 'approved')
  const pendingRequests = requests.filter(r => r.status === 'pending')
  const totalApprovedCards = approvedCards.reduce((sum, r) => sum + r.cantidad_cartones, 0)

  return (
    <div className="space-y-6">
      {/* Indicador de actualización */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <span className="text-blue-700 font-medium">Actualizando dashboard...</span>
          </div>
        </div>
      )}

      {/* Contador de tiempo para el siguiente juego */}
      {nextGameTime ? (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Clock className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="text-xl font-bold text-purple-800">Próximo Juego</h3>
                  <p className="text-sm text-purple-600">
                    {nextGameTime.toLocaleString('es-CO', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-800">{timeLeft}</div>
                <div className="text-sm text-purple-600">Tiempo restante</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-purple-200 space-y-2">
              <Button 
                onClick={() => {
                  console.log('🛒 Abriendo compra de cartones...')
                  onPurchaseClick()
                }}
                size="sm" 
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold"
              >
                🛒 Comprar Cartones
              </Button>
              <Button 
                onClick={() => {
                  console.log('🔄 Refrescando información del juego...')
                  loadNextGameTime()
                }}
                variant="outline" 
                size="sm" 
                className="w-full text-purple-600 border-purple-300 hover:bg-purple-100"
              >
                🔄 Actualizar Información
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div className="text-center">
                <h3 className="text-xl font-bold text-red-800">No hay juegos disponibles</h3>
                <p className="text-sm text-red-600">
                  Te notificaremos cuando estén por empezar nuevos sorteos
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-red-200">
              <Button 
                onClick={() => {
                  console.log('🔄 Refrescando información del juego...')
                  loadNextGameTime()
                }}
                variant="outline" 
                size="sm" 
                className="w-full text-red-600 border-red-300 hover:bg-red-100"
              >
                🔄 Buscar Nuevos Juegos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón para JUGAR - Solo visible si tiene cartones aprobados */}
      {totalApprovedCards > 0 && (
        <Link href="/game" className="block">
          <Card className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 border-4 border-yellow-400 shadow-2xl transform hover:scale-105 transition-all duration-300 animate-pulse cursor-pointer">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <Gamepad2 className="w-16 h-16 text-white animate-bounce" />
                <h2 className="text-4xl font-black text-white drop-shadow-2xl">
                  🎮 ¡JUGAR AHORA! 🎮
                </h2>
                <p className="text-xl text-white font-bold">
                  Tienes {totalApprovedCards} cartón{totalApprovedCards > 1 ? 'es' : ''} listo{totalApprovedCards > 1 ? 's' : ''} para jugar
                </p>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white font-bold text-lg animate-bounce">
                  👉 CLICK AQUÍ PARA ENTRAR AL JUEGO 👈
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Resumen de cartones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          className="bg-green-50 border-green-200 cursor-pointer hover:bg-green-100 hover:border-green-300 transition-all duration-200"
          onClick={() => {
            console.log('Click en cartones aprobados')
            setShowUserCards(true)
          }}
        >
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">{totalApprovedCards}</div>
            <div className="text-lg text-green-700 font-semibold">Cartones Aprobados</div>
            <div className="text-sm text-green-600 mt-1">Haz clic para ver</div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-yellow-600 mb-2">{pendingRequests.length}</div>
            <div className="text-lg text-yellow-700 font-semibold">Solicitudes Pendientes</div>
            <div className="text-sm text-yellow-600 mt-1">Esperando aprobación</div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{requests.length}</div>
            <div className="text-lg text-blue-700 font-semibold">Total Solicitudes</div>
            <div className="text-sm text-blue-600 mt-1">Historial completo</div>
          </CardContent>
        </Card>
      </div>

      {/* Notificaciones del juego */}
      <GameNotifications userEmail={userEmail} />

      {/* Acciones rápidas */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ShoppingCart className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-xl font-bold text-green-800">¿Necesitas más cartones?</h3>
                <p className="text-green-600">Compra cartones adicionales para el próximo juego</p>
              </div>
            </div>
            <Button
              onClick={onPurchaseClick}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 text-lg font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <Plus className="w-5 h-5 mr-2" />
              Comprar Cartones
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historial de solicitudes */}
      {isLoading ? (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando solicitudes...</p>
          </CardContent>
        </Card>
      ) : requests.length === 0 ? (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-8 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No tienes solicitudes</h3>
            <p className="text-gray-600 mb-4">Compra tus primeros cartones para comenzar a jugar</p>
            <Button
              onClick={onPurchaseClick}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 text-lg font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <Plus className="w-5 h-5 mr-2" />
              Comprar Cartones
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <Calendar className="w-6 h-6" />
              Historial de Solicitudes
            </CardTitle>
            <CardDescription className="text-white/90">
              Estado de todas tus solicitudes de cartones
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(request.status)}
                    <div>
                      <h4 className="font-bold text-gray-800">
                        {request.nombres} {request.apellidos}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {request.cantidad_cartones} cartón{request.cantidad_cartones > 1 ? 'es' : ''} - {formatCurrency(request.total)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.created_at).toLocaleString('es-CO', { hour12: true })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(request.status)}
                    {request.status === 'approved' && (
                      <p className="text-sm text-green-600 mt-1 font-medium">
                        ¡Listos para jugar!
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de cartones del usuario */}
      {showUserCards && (
        <UserCardsModal
          userEmail={userEmail}
          onClose={() => {
            console.log('Cerrando modal de cartones')
            setShowUserCards(false)
          }}
        />
      )}
    </div>
  )
}
