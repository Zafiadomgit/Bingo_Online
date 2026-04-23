"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search,
  UserCheck,
  UserX,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Hash,
  FileText,
  Download,
  Gamepad2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/hooks/use-currency"
import { GameScheduler } from "./game-scheduler"
import { AutoGameController } from "./auto-game-controller"
import { GameViewButtons } from "./game-view-buttons"

interface User {
  id: string
  email: string
  display_name: string
  created_at: string
  credits: number
}

interface PurchaseRequest {
  id: string
  nombres: string
  apellidos: string
  email: string
  telefono: string
  cedula: string
  cantidad_cartones: number
  total: number
  status: 'pending' | 'approved' | 'rejected'
  transfer_image: string
  created_at: string
  updated_at: string
}

interface AdminPanelProps {
  onClose: () => void
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([])
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([])
  const [earnings, setEarnings] = useState<any>(null)
  const [games, setGames] = useState<any[]>([]) // New state for games
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null)
  const [showReprogramModal, setShowReprogramModal] = useState(false)
  const [selectedGameForReprogram, setSelectedGameForReprogram] = useState<any>(null)
  const { toast } = useToast()

  const formatGameCurrency = (amount: number | string, currency?: string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency || 'COP',
      minimumFractionDigits: 0
    }).format(numAmount);
  };

  useEffect(() => {
    loadData()
    
    // Actualizaciones en tiempo real cada 30 segundos
    const interval = setInterval(() => {
      console.log('🔄 Actualizando datos del admin en tiempo real...')
      loadData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Agregar timestamp para evitar cache
      const timestamp = new Date().getTime()
      
      // Cargar usuarios
      const usersResponse = await fetch(`/api/admin/users?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const usersData = await usersResponse.json()
      if (usersData.success) {
        setUsers(usersData.users)
      }

      // Cargar solicitudes de compra
      const requestsResponse = await fetch(`/api/admin/purchase-requests?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const requestsData = await requestsResponse.json()
      if (requestsData.success) {
        setPurchaseRequests(requestsData.requests)
      }

      // Cargar estadísticas de ganancias
      const earningsResponse = await fetch(`/api/admin/earnings?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const earningsData = await earningsResponse.json()
      if (earningsData.success) {
        setEarnings(earningsData.earnings)
      }

      // Cargar juegos
      const gamesResponse = await fetch(`/api/games?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const gamesData = await gamesResponse.json()
      if (gamesData.success) {
        // Filtrar juegos eliminados como respaldo adicional
        const filteredGames = gamesData.games?.filter((game: any) => 
          game.status !== 'deleted' && 
          !game.name?.startsWith('[ELIMINADO]')
        ) || []
        setGames(filteredGames)
      }
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/admin/approve-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      })

      const data = await response.json()
      if (data.success) {
        // Recargar datos completos para evitar problemas de sincronización
        await loadData()
        setSelectedRequest(null)
        
        toast({
          title: "✅ Solicitud Aprobada",
          description: "La solicitud ha sido aprobada exitosamente",
          duration: 3000
        })
      } else {
        toast({
          title: "❌ Error",
          description: data.error || "No se pudo aprobar la solicitud",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error approving request:', error)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/admin/reject-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      })

      const data = await response.json()
      if (data.success) {
        // Actualizar inmediatamente el estado local para eliminar la solicitud rechazada
        setPurchaseRequests(prev => prev.filter(req => req.id !== requestId))
        setSelectedRequest(null)
        
        // También recargar datos completos para asegurar sincronización
        await loadData()
        
        toast({
          title: "✅ Solicitud Rechazada",
          description: "La solicitud ha sido rechazada y removida de la lista",
          duration: 3000
        })
      } else {
        toast({
          title: "❌ Error",
          description: data.error || "No se pudo rechazar la solicitud",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast({
        title: "❌ Error",
        description: "Error de conexión al rechazar solicitud",
        variant: "destructive",
      })
    }
  }

  const handleReprogramGame = (game: any) => {
    setSelectedGameForReprogram(game)
    setShowReprogramModal(true)
  }

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm('🗑️ ELIMINACIÓN COMPLETA DEL JUEGO\n\n⚠️ Esta acción eliminará PERMANENTEMENTE:\n• El juego completo\n• Todos los cartones\n• Todos los números de cartón\n• Todas las notificaciones\n• Todas las solicitudes de compra\n\n❌ ESTA ACCIÓN NO SE PUEDE DESHACER\n\n¿Estás seguro de continuar?')) {
      return
    }

    try {
      console.log('🗑️ Intentando eliminar juego:', gameId)
      
      // Estrategia múltiple: intentar todos los métodos disponibles
      let success = false
      let lastError = null
      
      // Método 1: Endpoint normal
      try {
        const response = await fetch('/api/games', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gameId }),
        })
        const data = await response.json()
        console.log('📡 Método 1 (normal) respuesta:', data)
        
        if (data.success) {
          success = true
          const details = data.details
          const summary = details ? 
            `🗑️ Juego: ${details.game}\n🎴 Cartones: ${details.deletedCards}\n🔢 Números: ${details.deletedNumbers}\n🔔 Notificaciones: ${details.deletedNotifications}\n💰 Solicitudes: ${details.deletedRequests}` : 
            "El juego ha sido eliminado exitosamente"
          
          toast({
            title: "✅ Juego Eliminado Completamente",
            description: summary,
            duration: 8000
          })
        } else {
          lastError = data.error
        }
      } catch (error) {
        console.log('❌ Método 1 falló:', error)
        lastError = error
      }
      
      // Método 2: Force delete si el primero falló
      if (!success) {
        try {
          console.log('🔄 Intentando método 2 (force-delete)...')
          const forceResponse = await fetch('/api/debug/force-delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gameId }),
          })
          const forceData = await forceResponse.json()
          console.log('📡 Método 2 (force-delete) respuesta:', forceData)
          
          if (forceData.success) {
            success = true
            toast({
              title: "✅ Juego Eliminado (Forzado)",
              description: "El juego ha sido eliminado usando método alternativo",
              duration: 8000
            })
          } else {
            lastError = forceData.error
          }
        } catch (error) {
          console.log('❌ Método 2 falló:', error)
          lastError = error
        }
      }
      
      if (success) {
        // Actualizar inmediatamente el estado local para eliminar el juego
        setGames(prev => prev.filter(game => game.id !== gameId))
        
        // También recargar datos completos para asegurar sincronización
        await loadData()
      } else {
        // Si ambos métodos fallaron, mostrar error
        console.error('❌ Todos los métodos de eliminación fallaron:', lastError)
        toast({
          title: "❌ Error",
          description: `No se pudo eliminar el juego: ${lastError || 'Error desconocido'}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    }
  }

  const handleReprogramSuccess = () => {
    setShowReprogramModal(false)
    setSelectedGameForReprogram(null)
    loadData()
    toast({
      title: "✅ Juego Re-programado",
      description: "El juego ha sido re-programado exitosamente",
    })
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingRequests = purchaseRequests.filter(req => req.status === 'pending')
  const approvedRequests = purchaseRequests.filter(req => req.status === 'approved')
  const rejectedRequests = purchaseRequests.filter(req => req.status === 'rejected')

  const totalRevenue = approvedRequests.reduce((sum, req) => sum + req.total, 0)
  const totalCards = approvedRequests.reduce((sum, req) => sum + req.cantidad_cartones, 0)

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <Card className="bg-white/95 backdrop-blur-lg border-4 border-blue-400 shadow-2xl rounded-xl p-8">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-lg font-medium">Cargando panel de administración...</span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="bg-white/95 backdrop-blur-lg border-4 border-blue-400 shadow-2xl rounded-xl">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-t-lg flex flex-row items-center justify-between">
            <CardTitle className="text-3xl font-bold flex items-center gap-3">
              <UserCheck className="w-8 h-8" />
              Panel de Administración
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <XCircle className="w-6 h-6" />
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="games">Juegos</TabsTrigger>
                <TabsTrigger value="users">Usuarios</TabsTrigger>
                <TabsTrigger value="requests">Solicitudes</TabsTrigger>
                <TabsTrigger value="past-events">Eventos Pasados</TabsTrigger>
              </TabsList>

              {/* Resumen General */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-6 text-center">
                      <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {earnings ? earnings.registeredUsers : users.length}
                      </div>
                      <div className="text-sm text-blue-700">Usuarios Registrados</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-6 text-center">
                      <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-yellow-600 mb-1">{pendingRequests.length}</div>
                      <div className="text-sm text-yellow-700">Solicitudes Pendientes</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {earnings ? earnings.totalCardsSold : approvedRequests.length}
                      </div>
                      <div className="text-sm text-green-700">Cartones Vendidos</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-6 text-center">
                      <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-purple-600 mb-1">
                        ${earnings ? earnings.totalRevenue.toLocaleString() : totalRevenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-purple-700">Ingresos Totales</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Estadísticas adicionales de ganancias */}
                {earnings && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-red-50 border-red-200">
                      <CardContent className="p-6 text-center">
                        <DollarSign className="w-8 h-8 text-red-600 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-red-600 mb-1">
                          ${earnings.totalPrizesPaid.toLocaleString()}
                        </div>
                        <div className="text-sm text-red-700">Premios Pagados</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-6 text-center">
                        <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-green-600 mb-1">
                          ${earnings.netEarnings.toLocaleString()}
                        </div>
                        <div className="text-sm text-green-700">Ganancias Netas</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-6 text-center">
                        <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-blue-600 mb-1">
                          {earnings.activeGames}
                        </div>
                        <div className="text-sm text-blue-700">Juegos Activos</div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <h3 className="text-xl font-bold text-green-800">Cartones Aprobados</h3>
                      </div>
                      <div className="text-4xl font-bold text-green-600 mb-2">{totalCards}</div>
                      <div className="text-sm text-green-700">Cartones listos para jugar</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <XCircle className="w-6 h-6 text-red-600" />
                        <h3 className="text-xl font-bold text-red-800">Solicitudes Rechazadas</h3>
                      </div>
                      <div className="text-4xl font-bold text-red-600 mb-2">{rejectedRequests.length}</div>
                      <div className="text-sm text-red-700">Solicitudes no aprobadas</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Juegos Activos - Gestión Unificada */}
              <TabsContent value="games" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Todos los Juegos */}
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-800 flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5" />
                        JUEGOS ACTIVOS ({games.length})
                      </CardTitle>
                      <div className="text-xs text-blue-600 font-bold">
                        🎮 Gestiona todos los juegos: programados, activos y terminados
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {games.length === 0 ? (
                        <p className="text-gray-600 text-center py-4">No hay juegos creados</p>
                      ) : (
                        games.map((game) => {
                          console.log('🎮 Rendering game:', game.name, 'Status:', game.status)
                          return (
                          <div key={game.id} className="space-y-4">
                            <div className="bg-white p-3 rounded-lg border">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-bold text-green-800">{game.name}</h4>
                                  <p className="text-sm text-gray-600">
                                    Precio: {formatGameCurrency(game.card_price, game.currency)}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Máx: {game.max_cards}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Programado para: {new Date(game.scheduled_at).toLocaleString('es-CO', { hour12: true })}
                                  </p>
                                  {game.status === 'ACTIVE' && game.started_at && (
                                    <p className="text-sm text-green-600">
                                      Iniciado: {new Date(game.started_at).toLocaleString('es-CO', { hour12: true })}
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Badge variant="outline" className={
                                    game.status === 'ACTIVE' 
                                      ? "text-green-600 border-green-300" 
                                      : "text-blue-600 border-blue-300"
                                  }>
                                    {game.status === 'ACTIVE' ? 'Activo' : 'Programado'}
                                  </Badge>
                                  <Badge variant="outline">
                                    {formatGameCurrency(game.total_revenue || 0, game.currency)} recaudado
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* BOTONES DE VISTA DEL JUEGO - SIEMPRE VISIBLES */}
                              <GameViewButtons gameId={game.id} gameName={game.name} />
                              
                              {/* BOTONES DE ACCIÓN */}
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteGame(game.id)}
                                  className="text-red-600 border-red-300 hover:bg-red-100"
                                >
                                  🗑️ Eliminar Completamente
                                </Button>
                              </div>
                            </div>
                            
                            {/* Controlador Automático de Juego - SOLO PARA ACTIVOS */}
                            {game.status === 'ACTIVE' && (
                              <AutoGameController 
                                gameId={game.id} 
                                onGameUpdate={loadData}
                              />
                            )}
                          </div>
                          )
                        })
                      )}
                    </CardContent>
                  </Card>

                  {/* Juegos Programados */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-blue-800 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Juegos Programados ({games.filter(g => g.status === 'WAITING').length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {games.filter(g => g.status === 'WAITING').length === 0 ? (
                        <p className="text-gray-600 text-center py-4">No hay juegos programados</p>
                      ) : (
                        games.filter(g => g.status === 'WAITING').map((game) => (
                          <div key={game.id} className="bg-white p-3 rounded-lg border">
                            <h4 className="font-bold text-blue-800">{game.name}</h4>
                            <p className="text-sm text-gray-600">
                              Programado para: {new Date(game.scheduled_at).toLocaleString('es-CO', { hour12: true })}
                            </p>
                            <p className="text-sm text-gray-600">
                              Máximo cartones: {game.max_cards}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-blue-600 border-blue-300">
                                Esperando
                              </Badge>
                              <Badge variant="outline">
                                {formatGameCurrency(game.card_price, game.currency)} por cartón
                              </Badge>
                            </div>
                            <div className="mt-2">
                              <div className="text-xs text-gray-500">Premios:</div>
                              <div className="text-xs">
                                🥇 Cartón lleno: ${game.prize_full_card || 0} | 
                                🥈 Dos líneas: ${game.prize_two_lines || 0} | 
                                🥉 Una línea: ${game.prize_line || 0}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReprogramGame(game)}
                                className="text-blue-600 border-blue-300 hover:bg-blue-100"
                              >
                                📅 Re-programar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteGame(game.id)}
                                className="text-red-600 border-red-300 hover:bg-red-100"
                              >
                                🗑️ Eliminar Completamente
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Botón para refrescar juegos */}
                <div className="flex justify-center">
                  <Button 
                    onClick={() => {
                      console.log('🔄 Refrescando juegos...')
                      loadData()
                    }}
                    variant="outline"
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    🔄 Actualizar Juegos
                  </Button>
                </div>
              </TabsContent>

              {/* Lista de Usuarios */}
              <TabsContent value="users" className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar usuarios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className="bg-white border-2 border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {user.display_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-800">{user.display_name}</h3>
                              <p className="text-gray-600">{user.email}</p>
                              <p className="text-sm text-gray-500">
                                Registrado: {new Date(user.created_at).toLocaleDateString('es-CO')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">{user.credits}</div>
                            <div className="text-sm text-gray-600">Créditos</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Solicitudes de Compra */}
              <TabsContent value="requests" className="space-y-6">
                <div className="space-y-4">
                  {purchaseRequests.map((request) => (
                    <Card key={request.id} className={`border-2 ${
                      request.status === 'pending' ? 'border-yellow-200 bg-yellow-50' :
                      request.status === 'approved' ? 'border-green-200 bg-green-50' :
                      'border-red-200 bg-red-50'
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {request.nombres.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-800">
                                {request.nombres} {request.apellidos}
                              </h3>
                              <p className="text-gray-600">{request.email}</p>
                              <p className="text-sm text-gray-500">
                                {request.cantidad_cartones} cartón{request.cantidad_cartones > 1 ? 'es' : ''} - ${request.total}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(request.created_at).toLocaleString('es-CO', { hour12: true })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              request.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                              'bg-red-100 text-red-800 border-red-200'
                            }>
                              {request.status === 'pending' ? 'Pendiente' :
                               request.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Transferencias */}
              <TabsContent value="transfers" className="space-y-6">
                <div className="space-y-4">
                  {purchaseRequests.filter(req => req.transfer_image).map((request) => (
                    <Card key={request.id} className="bg-white border-2 border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-800">
                                {request.nombres} {request.apellidos}
                              </h3>
                              <p className="text-gray-600">{request.email}</p>
                              <p className="text-sm text-gray-500">
                                ${request.total} - {request.cantidad_cartones} cartón{request.cantidad_cartones > 1 ? 'es' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              size="sm"
                              onClick={() => window.open(request.transfer_image, '_blank')}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Ver Comprobante
                            </Button>
                            <Badge className={
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              request.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                              'bg-red-100 text-red-800 border-red-200'
                            }>
                              {request.status === 'pending' ? 'Pendiente' :
                               request.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Eventos Pasados */}
              <TabsContent value="past-events" className="space-y-6">
                <Card className="bg-gray-50 border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-800 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Juegos Terminados ({games.filter(g => g.status === 'FINISHED').length})
                    </CardTitle>
                    <CardDescription>
                      Historial de sorteos completados con información de ganadores
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {games.filter(g => g.status === 'FINISHED').length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No hay eventos pasados</h3>
                        <p className="text-gray-600">Los juegos terminados aparecerán aquí con información de ganadores</p>
                      </div>
                    ) : (
                      games.filter(g => g.status === 'FINISHED').map((game) => (
                        <Card key={game.id} className="bg-white border-2 border-gray-200">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-gray-800">{game.name}</CardTitle>
                                <CardDescription>
                                  Terminado el {new Date(game.finished_at).toLocaleString('es-ES')}
                                </CardDescription>
                              </div>
                              <Badge variant="outline" className="text-gray-600 border-gray-300">
                                Terminado
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <div className="text-sm text-blue-600 font-medium">Cartones Vendidos</div>
                                <div className="text-2xl font-bold text-blue-800">{game.cards_sold || 0}</div>
                              </div>
                              <div className="bg-green-50 p-3 rounded-lg">
                                <div className="text-sm text-green-600 font-medium">Total Recaudado</div>
                                <div className="text-2xl font-bold text-green-800">${game.total_revenue || 0}</div>
                              </div>
                              <div className="bg-purple-50 p-3 rounded-lg">
                                <div className="text-sm text-purple-600 font-medium">Premios Pagados</div>
                                <div className="text-2xl font-bold text-purple-800">
                                  ${((game.line_winners?.length || 0) * (game.prize_line || 0) + 
                                      (game.two_lines_winners?.length || 0) * (game.prize_two_lines || 0) + 
                                      (game.full_card_winners?.length || 0) * (game.prize_full_card || 0))}
                                </div>
                              </div>
                            </div>

                            {/* Ganadores */}
                            <div className="space-y-3">
                              <h4 className="font-bold text-gray-800">🏆 Ganadores</h4>
                              
                              {/* Ganadores de Cartón Lleno */}
                              {game.full_card_winners && game.full_card_winners.length > 0 && (
                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                  <div className="text-sm font-bold text-yellow-800 mb-2">
                                    🥇 Ganadores de Cartón Lleno (${game.prize_full_card || 0} cada uno)
                                  </div>
                                  <div className="space-y-1">
                                    {game.full_card_winners.map((winner: any, index: number) => (
                                      <div key={index} className="text-sm text-yellow-700">
                                        • {winner.display_name || winner.email} - ${game.prize_full_card || 0}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Ganadores de Dos Líneas */}
                              {game.two_lines_winners && game.two_lines_winners.length > 0 && (
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                  <div className="text-sm font-bold text-gray-800 mb-2">
                                    🥈 Ganadores de Dos Líneas (${game.prize_two_lines || 0} cada uno)
                                  </div>
                                  <div className="space-y-1">
                                    {game.two_lines_winners.map((winner: any, index: number) => (
                                      <div key={index} className="text-sm text-gray-700">
                                        • {winner.display_name || winner.email} - ${game.prize_two_lines || 0}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Ganadores de Una Línea */}
                              {game.line_winners && game.line_winners.length > 0 && (
                                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                  <div className="text-sm font-bold text-orange-800 mb-2">
                                    🥉 Ganadores de Una Línea (${game.prize_line || 0} cada uno)
                                  </div>
                                  <div className="space-y-1">
                                    {game.line_winners.map((winner: any, index: number) => (
                                      <div key={index} className="text-sm text-orange-700">
                                        • {winner.display_name || winner.email} - ${game.prize_line || 0}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Sin ganadores */}
                              {(!game.full_card_winners || game.full_card_winners.length === 0) &&
                               (!game.two_lines_winners || game.two_lines_winners.length === 0) &&
                               (!game.line_winners || game.line_winners.length === 0) && (
                                <div className="text-center py-4 text-gray-600">
                                  No se registraron ganadores en este juego
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalles de Solicitud */}
      {selectedRequest && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="bg-white/95 backdrop-blur-lg border-4 border-blue-400 shadow-2xl rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-blue-400 text-white p-6 rounded-t-lg flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-bold">
                Detalles de Solicitud
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedRequest(null)} className="text-white hover:bg-white/20">
                <XCircle className="w-6 h-6" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Información Personal */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nombres</Label>
                    <p className="text-lg font-semibold">{selectedRequest.nombres}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Apellidos</Label>
                    <p className="text-lg font-semibold">{selectedRequest.apellidos}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {selectedRequest.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Teléfono</Label>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {selectedRequest.telefono}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Cédula</Label>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      {selectedRequest.cedula}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de Compra */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Información de Compra
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Cantidad de Cartones</Label>
                    <p className="text-2xl font-bold text-blue-600">{selectedRequest.cantidad_cartones}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Total a Pagar</Label>
                    <p className="text-2xl font-bold text-green-600">${selectedRequest.total}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Estado</Label>
                    <Badge className={
                      selectedRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      selectedRequest.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                      'bg-red-100 text-red-800 border-red-200'
                    }>
                      {selectedRequest.status === 'pending' ? 'Pendiente' :
                       selectedRequest.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Fecha de Solicitud</Label>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(selectedRequest.created_at).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comprobante de Transferencia */}
              {selectedRequest.transfer_image && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Comprobante de Transferencia
                  </h3>
                  <div className="border-2 border-gray-200 rounded-lg p-4">
                    <img 
                      src={selectedRequest.transfer_image} 
                      alt="Comprobante de transferencia"
                      className="max-w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                  <Button
                    onClick={() => window.open(selectedRequest.transfer_image, '_blank')}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar Comprobante
                  </Button>
                </div>
              )}

              {/* Acciones */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => handleApproveRequest(selectedRequest.id)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprobar Solicitud
                  </Button>
                  <Button
                    onClick={() => handleRejectRequest(selectedRequest.id)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rechazar Solicitud
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Re-programación */}
      {showReprogramModal && selectedGameForReprogram && (
        <GameScheduler
          gameId={selectedGameForReprogram.id}
          onSchedule={handleReprogramSuccess}
          onCancel={() => {
            setShowReprogramModal(false)
            setSelectedGameForReprogram(null)
          }}
        />
      )}
    </div>
  )
}
