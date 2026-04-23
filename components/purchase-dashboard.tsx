"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { PurchaseForm } from "@/components/purchase-form"
import { UserCardsModal } from "@/components/user-cards-modal"
import { Clock, ShoppingCart, CheckCircle, XCircle, AlertCircle, Plus } from "lucide-react"
import { useCurrency } from "@/hooks/use-currency"

interface PurchaseRequest {
  id: string
  nombres: string
  apellidos: string
  cantidad_cartones: number
  total: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  transfer_image?: string
}

interface PurchaseDashboardProps {
  userEmail: string
  onClose: () => void
}

export function PurchaseDashboard({ userEmail, onClose }: PurchaseDashboardProps) {
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [showUserCards, setShowUserCards] = useState(false)
  const [nextGameTime, setNextGameTime] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [hasAvailableGames, setHasAvailableGames] = useState(false)
  const [nextGame, setNextGame] = useState<any>(null)
  const { toast } = useToast()
  const { formatCurrency } = useCurrency()

  useEffect(() => {
    loadUserRequests()
    loadNextGameTime()
    loadNextGame()
  }, [userEmail])

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

  const loadNextGame = async () => {
    try {
      const response = await fetch('/api/games/next')
      const data = await response.json()
      
      if (data.success && data.nextGame) {
        setNextGame(data.nextGame)
      } else {
        setNextGame(null)
      }
    } catch (error) {
      console.error('Error loading next game:', error)
      setNextGame(null)
    }
  }

  const loadNextGameTime = async () => {
    try {
      const response = await fetch('/api/games/next')
      const data = await response.json()
      
      if (data.success && data.nextGame) {
        setNextGameTime(new Date(data.nextGame.scheduled_at))
        setHasAvailableGames(true)
      } else {
        setHasAvailableGames(false)
      }
    } catch (error) {
      console.error('Error loading next game:', error)
      setHasAvailableGames(false)
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

  const handlePurchaseSuccess = () => {
    setShowPurchaseForm(false)
    loadUserRequests()
    toast({
      title: "¡Solicitud enviada!",
      description: "Tu solicitud de compra ha sido enviada. Espera la confirmación del administrador.",
    })
  }

  const handlePurchaseClick = () => {
    if (!hasAvailableGames) {
      toast({
        title: "No hay juegos disponibles",
        description: "No hay juegos disponibles en este momento, te notificaremos cuando estén por empezar.",
        variant: "destructive",
      })
      return
    }
    setShowPurchaseForm(true)
  }

  const approvedCards = requests.filter(r => r.status === 'approved')
  const pendingRequests = requests.filter(r => r.status === 'pending')
  const totalApprovedCards = approvedCards.reduce((sum, r) => sum + r.cantidad_cartones, 0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-4 border-blue-400 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-3">
                <ShoppingCart className="w-8 h-8" />
                MIS CARTONES
              </CardTitle>
              <CardDescription className="text-white/90 text-lg mt-2">
                Estado de tus solicitudes y cartones disponibles
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePurchaseClick}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
              >
                <Plus className="w-4 h-4 mr-2" />
                Comprar Más
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                ✕
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Contador de tiempo para el siguiente juego */}
          {nextGameTime ? (
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-purple-600" />
                    <div>
                      <h3 className="font-bold text-purple-800">Próximo Juego</h3>
                      <p className="text-sm text-purple-600">
                        {nextGameTime.toLocaleString('es-CO', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-800">{timeLeft}</div>
                    <div className="text-sm text-purple-600">Tiempo restante</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <div className="text-center">
                    <h3 className="font-bold text-red-800">No hay juegos disponibles</h3>
                    <p className="text-sm text-red-600">
                      Te notificaremos cuando estén por empezar nuevos sorteos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resumen de cartones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              className="bg-green-50 border-green-200 cursor-pointer hover:bg-green-100 hover:border-green-300 transition-all duration-200"
              onClick={() => {
                console.log('Click en cartones aprobados')
                alert('Click funcionando!')
                setShowUserCards(true)
              }}
            >
              <CardContent 
                className="p-4 text-center"
                onClick={(e) => {
                  e.stopPropagation()
                  console.log('Click en CardContent')
                  alert('Click en CardContent funcionando!')
                  setShowUserCards(true)
                }}
              >
                <div className="text-3xl font-bold text-green-600">{totalApprovedCards}</div>
                <div className="text-sm text-green-700">Cartones Aprobados</div>
                <div className="text-xs text-green-600 mt-1">Haz clic para ver</div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-yellow-600">{pendingRequests.length}</div>
                <div className="text-sm text-yellow-700">Solicitudes Pendientes</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{requests.length}</div>
                <div className="text-sm text-blue-700">Total Solicitudes</div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de solicitudes */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando solicitudes...</p>
            </div>
          ) : requests.length === 0 ? (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-8 text-center">
                <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">No tienes solicitudes</h3>
                <p className="text-gray-600 mb-4">Compra tus primeros cartones para comenzar a jugar</p>
                <Button
                  onClick={handlePurchaseClick}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Comprar Cartones
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800">Historial de Solicitudes</h3>
              {requests.map((request) => (
                <Card key={request.id} className="border-2 hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de compra */}
      {showPurchaseForm && nextGame && (
        <PurchaseForm
          onClose={() => setShowPurchaseForm(false)}
          onSuccess={handlePurchaseSuccess}
          gameId={nextGame.id}
          maxCards={nextGame.max_cards}
          cardPrice={nextGame.card_price}
          currency={nextGame.currency || 'USD'}
        />
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
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 text-xs">
          showUserCards: {showUserCards.toString()}
        </div>
      )}
    </div>
  )
}
