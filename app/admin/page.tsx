"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { GameScheduler } from "@/components/game-scheduler"
import { PendingRequestsSummary } from "@/components/pending-requests-summary"
import { PendingRequestsAlert } from "@/components/pending-requests-alert"
import { GameViewButtons } from "@/components/game-view-buttons"
import Link from "next/link"
import { ArrowLeft, Settings, Users, Gamepad2, DollarSign, Calendar, Trash2 } from "lucide-react"
import { useCurrency, formatCurrencyWithSymbol } from "@/hooks/use-currency"
import { PrizePoolDisplay } from "@/components/prize-pool-display"
import { HouseProfitCard } from "@/components/house-profit-card"

export default function AdminPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { formatCurrency } = useCurrency()
  const [games, setGames] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)
  const [selectedGameForSchedule, setSelectedGameForSchedule] = useState<any>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0) // Para actualizar notificaciones
  const [totalCardsSold, setTotalCardsSold] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [currentGameInfo, setCurrentGameInfo] = useState<{gameId: string | null, gameName: string | null, currency: string}>({
    gameId: null,
    gameName: null,
    currency: 'USD'
  })
  const [promoters, setPromoters] = useState<any[]>([])
  const [promoterStats, setPromoterStats] = useState<any[]>([])
  const [newPromoterName, setNewPromoterName] = useState("")
  const [users, setUsers] = useState<any[]>([])
  const [isAddingPromoter, setIsAddingPromoter] = useState(false)
  const [activeGameForAdmin, setActiveGameForAdmin] = useState<{ id: string; name: string } | null>(null)
  const { toast } = useToast()


  const loadGames = async () => {
    try {
      const response = await fetch('/api/games')
      const data = await response.json()
      if (data.success) {
        setGames(data.games)
      }
    } catch (error) {
      console.error('Error loading games:', error)
    }
  }

  const loadCardsStats = async () => {
    try {
      const response = await fetch('/api/admin/cards-stats')
      const data = await response.json()
      if (data.success) {
        setTotalCardsSold(data.totalCardsSold || 0)
        setTotalRevenue(data.totalRevenue || 0)
        setCurrentGameInfo({
          gameId: data.gameId,
          gameName: data.gameName,
          currency: data.currency || 'USD'
        })
      }
    } catch (error) {
      console.error('Error loading cards stats:', error)
    }
  }

  const loadPromoters = async () => {
    try {
      const response = await fetch('/api/admin/promoters')
      const data = await response.json()
      if (data.success) {
        setPromoters(data.promoters)
      }
    } catch (error) {
      console.error('Error loading promoters:', error)
    }
  }

  const loadPromoterStats = async () => {
    try {
      const response = await fetch('/api/admin/promoter-stats')
      const data = await response.json()
      if (data.success) {
        setPromoterStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading promoter stats:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  // Protección de autenticación - CRÍTICO
  useEffect(() => {
    if (authLoading) return
    
    if (!user || user.role !== 'admin') {
      toast({
        title: "Acceso Denegado",
        description: "Debes iniciar sesión como administrador para acceder al panel",
        variant: "destructive"
      })
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router, toast])

  useEffect(() => {
    if (!user) return // No cargar datos hasta tener usuario autenticado
    
    loadGames()
    loadCardsStats()
    loadPromoters()
    loadPromoterStats()
    loadUsers()
    
    // Actualizar estadísticas cada 15 segundos
    const interval = setInterval(() => {
      loadCardsStats()
      loadPromoterStats()
      loadUsers()
    }, 15000)
    
    return () => clearInterval(interval)
  }, [user])

  // Detectar juego activo para mostrar botón de acceso rápido
  useEffect(() => {
    if (!user) return
    const checkActiveGame = async () => {
      try {
        const res = await fetch('/api/games/next', { cache: 'no-store' })
        const data = await res.json()
        if (data.success && data.nextGame) {
          const g = data.nextGame
          const isActive = g.status === 'ACTIVE' || g.status === 'active'
          setActiveGameForAdmin(isActive ? { id: g.id, name: g.name } : null)
        } else {
          setActiveGameForAdmin(null)
        }
      } catch { setActiveGameForAdmin(null) }
    }
    checkActiveGame()
    const interval = setInterval(checkActiveGame, 10000)
    return () => clearInterval(interval)
  }, [user])

  const handleScheduleGame = (game: any) => {
    setSelectedGameForSchedule(game)
    setShowScheduler(true)
  }

  const handleScheduleComplete = () => {
    setShowScheduler(false)
    setSelectedGameForSchedule(null)
    loadGames()
  }

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm('¿Seguro que deseas eliminar este juego?')) {
      return
    }

    try {
      const response = await fetch('/api/games', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Juego Eliminado",
          description: "El juego ha sido eliminado exitosamente",
        })
        loadGames()
      } else {
        toast({
          title: "Error",
          description: data.error || "Error eliminando el juego",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting game:', error)
      toast({
        title: "Error",
        description: "Error de conexión al eliminar el juego",
        variant: "destructive",
      })
    }
  }

  const handleClearAllCards = async () => {
    if (!confirm('⚠️ ¿Estás seguro de que quieres eliminar TODOS los cartones comprados?\n\nEsta acción eliminará todos los cartones de todos los juegos y NO se puede deshacer.')) {
      return
    }

    try {
      const response = await fetch('/api/admin/clear-all-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Cartones Eliminados",
          description: `Se eliminaron ${data.deletedCount} cartones exitosamente`,
        })
        loadCardsStats() // Recargar estadísticas
      } else {
        toast({
          title: "Error",
          description: data.error || "Error eliminando los cartones",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error clearing cards:', error)
      toast({
        title: "Error",
        description: "Error de conexión al eliminar los cartones",
        variant: "destructive",
      })
    }
  }

  const handleCleanupDatabase = async () => {
    if (!confirm('🚨 ¡ATENCIÓN! Esta acción es IRREVERSIBLE!\n\n¿Estás seguro de que quieres limpiar TODA la base de datos?\n\nEsto eliminará:\n- Todos los usuarios (excepto admin)\n- Todos los juegos\n- Todos los cartones\n- Todas las solicitudes\n- Todas las notificaciones\n\nSolo se mantendrá el usuario admin activo.\n\n¿Continuar?')) {
      return
    }

    // Confirmación adicional
    if (!confirm('⚠️ ÚLTIMA CONFIRMACIÓN\n\nEsta acción NO se puede deshacer.\n¿Realmente quieres limpiar toda la base de datos?')) {
      return
    }

    try {
      const response = await fetch('/api/admin/cleanup-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Base de Datos Limpiada",
          description: `Limpieza completada. Admin preservado: ${data.results.adminPreserved.email}`,
        })
        
        // Recargar datos
        loadGames()
        loadCardsStats()
        
        // Mostrar resumen de limpieza
        console.log('Limpieza completada:', data.results)
      } else {
        toast({
          title: "Error",
          description: data.error || "Error limpiando la base de datos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error cleaning database:', error)
      toast({
        title: "Error",
        description: "Error de conexión al limpiar la base de datos",
        variant: "destructive",
      })
    }
  }

  const handleAddPromoter = async () => {
    if (!newPromoterName.trim()) return

    setIsAddingPromoter(true)
    try {
      const response = await fetch('/api/admin/promoters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPromoterName.trim() })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "✅ Promotor añadido",
          description: `El promotor "${newPromoterName}" ha sido creado`,
        })
        setNewPromoterName("")
        loadPromoters()
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al añadir promotor",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error adding promoter:', error)
    } finally {
      setIsAddingPromoter(false)
    }
  }

  const handleClearPromoterSales = async (promoterName: string) => {
    if (!confirm(`¿Estás seguro de que quieres resetear TODAS las ventas del promotor "${promoterName}" a cero?`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/clear-promoter-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoterName })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "✅ Ventas reseteadas",
          description: `Las ventas de ${promoterName} han vuelto a cero`,
        })
        loadPromoterStats()
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al resetear ventas",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error clearing promoter sales:', error)
      toast({
        title: "Error",
        description: "Error de conexión al resetear ventas",
        variant: "destructive",
      })
    }
  }

  const handleDeletePromoter = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al promotor "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/promoters?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "✅ Promotor eliminado",
          description: "El promotor ha sido eliminado de la lista",
        })
        loadPromoters()
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al eliminar promotor",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting promoter:', error)
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`🚨 ¡ATENCIÓN!\n\n¿Estás seguro de que quieres eliminar la cuenta de "${email}"?\n\nEsta acción eliminará todos sus cartones y es IRREVERSIBLE.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/delete?userId=${userId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "✅ Usuario eliminado",
          description: `La cuenta de ${email} ha sido eliminada`,
        })
        loadUsers()
        loadCardsStats()
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al eliminar usuario",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const handleForceDeleteGame = async (gameId: string, gameName: string) => {
    if (!confirm(`🚨 ELIMINACIÓN FORZADA\n\n¿Estás seguro de que quieres forzar la eliminación del juego "${gameName}"?\n\nEsta acción es más agresiva y eliminará el juego incluso si tiene restricciones.`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/force-delete-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Juego Eliminado Forzadamente",
          description: `Juego "${gameName}" eliminado exitosamente`,
        })
        loadGames()
      } else {
        toast({
          title: "Error",
          description: data.error || "Error eliminando el juego",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error force deleting game:', error)
      toast({
        title: "Error",
        description: "Error de conexión al eliminar el juego",
        variant: "destructive",
      })
    }
  }

  if (authLoading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-2xl font-bold animate-pulse">
          Verificando credenciales...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{background: 'linear-gradient(135deg, #121D40 0%, #143C8C 50%, #123273 100%)'}}>
      {/* Floating animated circles */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" style={{backgroundColor: '#F2E394'}}></div>
      <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" style={{backgroundColor: '#D9A13B'}}></div>
      <div className="absolute bottom-1/4 left-1/3 w-40 h-40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" style={{backgroundColor: '#F2E394'}}></div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <Button variant="ghost" asChild className="mb-6 hover:bg-white/20" style={{color: '#F2E394'}}>
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio
              </Link>
            </Button>
            <h1 className="text-6xl font-extrabold mb-4 drop-shadow-lg animate-bounce-slow" style={{color: '#F2E394'}}>
              ⚙️ PANEL ADMINISTRATIVO ⚙️
            </h1>
            <p className="text-2xl font-semibold animate-pulse-slow" style={{color: '#F2E394'}}>
              ¡GESTIONA TU CASA DE APUESTAS!
            </p>
          </div>

          {/* Banner de JUEGO EN VIVO - aparece automáticamente cuando hay un juego activo */}
          {activeGameForAdmin && (
            <div style={{
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              border: '3px solid #fca5a5',
              borderRadius: '16px',
              padding: '20px 28px',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 0 40px rgba(220,38,38,0.5)',
            }}>
              <div>
                <div style={{ color: '#fff', fontSize: '22px', fontWeight: 900, marginBottom: '4px' }}>
                  🔴 ¡JUEGO EN VIVO AHORA!
                </div>
                <div style={{ color: '#fca5a5', fontSize: '14px' }}>
                  {activeGameForAdmin.name} — Los jugadores están esperando
                </div>
              </div>
              <button
                onClick={() => router.push('/game/live?admin=true')}
                style={{
                  background: '#fff',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 28px',
                  fontSize: '16px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                🎮 ENTRAR AL JUEGO →
              </button>
            </div>
          )}

          {/* Alerta de Solicitudes Pendientes */}
          <PendingRequestsAlert 
            refreshTrigger={refreshTrigger}
            onViewDetails={() => {
              // Scroll hacia el resumen de solicitudes
              const summaryElement = document.querySelector('[data-component="pending-requests-summary"]')
              if (summaryElement) {
                summaryElement.scrollIntoView({ behavior: 'smooth' })
              }
            }}
          />

          {/* Resumen de Solicitudes Pendientes */}
          <div className="mb-12" data-component="pending-requests-summary">
            <PendingRequestsSummary 
              onRequestProcessed={() => {
                // Actualizar el trigger para refrescar las notificaciones
                setRefreshTrigger(prev => prev + 1)
              }}
            />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <Card className="backdrop-blur-sm shadow-2xl transform hover:scale-105 transition-all duration-300 animate-fade-in" style={{backgroundColor: 'rgba(242, 227, 148, 0.9)', border: '4px solid #143C8C'}}>
              <CardHeader className="p-6 rounded-t-lg" style={{backgroundColor: '#143C8C'}}>
                <CardTitle className="text-2xl text-center font-bold uppercase flex items-center justify-center gap-2" style={{color: '#F2E394'}}>
                  <Gamepad2 className="w-8 h-8" />
                  JUEGOS
                </CardTitle>
                <CardDescription className="text-center text-lg" style={{color: '#F2E394'}}>
                  Gestiona sorteos y partidas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-extrabold mb-2" style={{color: '#143C8C'}}>{games.length}</div>
                <div className="font-semibold" style={{color: '#121D40'}}>Juegos Activos</div>
              </CardContent>
            </Card>


            <Card className="backdrop-blur-sm shadow-2xl transform hover:scale-105 transition-all duration-300 animate-fade-in animation-delay-400" style={{backgroundColor: 'rgba(242, 227, 148, 0.9)', border: '4px solid #D9A13B'}}>
              <CardHeader className="p-6 rounded-t-lg" style={{backgroundColor: '#D9A13B'}}>
                <CardTitle className="text-2xl text-center font-bold uppercase flex items-center justify-center gap-2" style={{color: '#121D40'}}>
                  <Users className="w-8 h-8" />
                  CARTONES COMPRADOS
                </CardTitle>
                <CardDescription className="text-center text-lg" style={{color: '#121D40'}}>
                  {currentGameInfo.gameName ? `Cartones vendidos - ${currentGameInfo.gameName}` : 'Total de cartones vendidos'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-extrabold mb-2" style={{color: '#D9A13B'}}>{totalCardsSold}</div>
                <div className="text-lg font-semibold mb-4" style={{color: '#121D40'}}>
                  Cartones Totales
                </div>
                <div className="text-sm mb-4" style={{color: '#121D40'}}>
                  Ingresos: {currentGameInfo.currency ? formatCurrencyWithSymbol(totalRevenue, currentGameInfo.currency as 'USD' | 'VES') : formatCurrency(totalRevenue)}
                </div>
                <Button 
                  onClick={handleClearAllCards}
                  variant="destructive"
                  size="sm"
                  className="w-full mb-2"
                >
                  🗑️ Limpiar Todos los Cartones
                </Button>
                <Button 
                  onClick={handleCleanupDatabase}
                  variant="destructive"
                  size="sm"
                  className="w-full bg-red-800 hover:bg-red-900 border-2 border-red-600"
                >
                  🚨 LIMPIAR BASE DE DATOS COMPLETA
                </Button>
              </CardContent>
            </Card>

            {/* Ganancia de la Banca */}
            <HouseProfitCard />
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Gestión de Promotores */}
            <Card className="backdrop-blur-sm shadow-2xl animate-fade-in" style={{backgroundColor: 'rgba(242, 227, 148, 0.9)', border: '4px solid #143C8C'}}>
              <CardHeader className="p-6 rounded-t-lg" style={{backgroundColor: '#143C8C'}}>
                <CardTitle className="text-2xl text-center font-bold uppercase flex items-center justify-center gap-2" style={{color: '#F2E394'}}>
                  <Users className="w-8 h-8" />
                  GESTIÓN DE PROMOTORES
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex gap-2 mb-6">
                  <input 
                    type="text" 
                    value={newPromoterName}
                    onChange={(e) => setNewPromoterName(e.target.value)}
                    placeholder="Nombre del nuevo promotor"
                    className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPromoter()}
                  />
                  <Button 
                    onClick={handleAddPromoter}
                    disabled={isAddingPromoter || !newPromoterName.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    Añadir
                  </Button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {promoters.length === 0 ? (
                    <p className="text-center text-gray-600 py-4">No hay promotores registrados</p>
                  ) : (
                    promoters.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-gray-200">
                        <span className="font-bold text-blue-900">{p.name}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeletePromoter(p.id, p.name)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          Eliminar
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ventas por Promotor */}
            <Card className="backdrop-blur-sm shadow-2xl animate-fade-in animation-delay-400" style={{backgroundColor: 'rgba(242, 227, 148, 0.9)', border: '4px solid #D9A13B'}}>
              <CardHeader className="p-6 rounded-t-lg" style={{backgroundColor: '#D9A13B'}}>
                <CardTitle className="text-2xl text-center font-bold uppercase flex items-center justify-center gap-2" style={{color: '#121D40'}}>
                  <DollarSign className="w-8 h-8" />
                  VENTAS POR PROMOTOR
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="max-h-[300px] overflow-y-auto">
                  {promoterStats.length === 0 ? (
                    <p className="text-center text-gray-600 py-4">No hay ventas registradas con promotores</p>
                  ) : (
                    <table className="w-full">
                      <thead className="text-left border-b-2 border-orange-200">
                        <tr>
                          <th className="py-2 text-blue-900">Promotor</th>
                          <th className="py-2 text-blue-900 text-center">Ventas</th>
                          <th className="py-2 text-blue-900 text-right">Monto</th>
                          <th className="py-2 text-blue-900 text-center w-12">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-orange-100">
                        {promoterStats.map((stat, idx) => (
                          <tr key={idx} className="hover:bg-orange-50/50 transition-colors">
                            <td className="py-3 font-bold text-gray-800">{stat.promoter_name}</td>
                            <td className="py-3 text-center text-gray-700">{stat.total_sales}</td>
                            <td className="py-3 text-right font-extrabold text-green-700">
                              {formatCurrencyWithSymbol(stat.total_revenue, currentGameInfo.currency as any)}
                            </td>
                            <td className="py-3 text-center">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Resetear ventas de este promotor a cero"
                                onClick={() => handleClearPromoterSales(stat.promoter_name)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botón para Programar Nuevo Juego */}
          <div className="mb-8 flex justify-center">
            <Button
              onClick={() => setShowScheduler(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Calendar className="w-5 h-5 mr-2" />
              PROGRAMAR NUEVO JUEGO
            </Button>
          </div>

          {/* Scheduler Modal */}
          {showScheduler && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="relative max-w-2xl w-full mx-4">
                <GameScheduler
                  gameId={selectedGameForSchedule?.id || undefined}
                  onSchedule={handleScheduleComplete}
                  onCancel={() => setShowScheduler(false)}
                />
              </div>
            </div>
          )}

          {/* Juegos Activos */}
          {/* Juegos Activos */}
          <Card className="backdrop-blur-sm shadow-2xl transition-all duration-300 animate-fade-in relative hover:z-50" style={{backgroundColor: 'rgba(242, 227, 148, 0.9)', border: '4px solid #143C8C'}}>
            <CardHeader className="p-4 rounded-t-lg" style={{backgroundColor: '#143C8C'}}>
              <CardTitle className="text-xl text-center font-bold uppercase" style={{color: '#F2E394'}}>
                🎲 JUEGOS ACTIVOS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {games.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-lg font-bold mb-2" style={{color: '#121D40'}}>No hay juegos activos</div>
                  <div className="text-sm" style={{color: '#121D40'}}>Programa tu primer sorteo para comenzar</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {games.map((game: any) => (
                    <div key={game.id} className="p-3 rounded-lg shadow-md relative group hover:z-10" style={{background: 'linear-gradient(90deg, #F2E394 0%, #D9A13B 100%)'}}>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold truncate pr-2" style={{color: '#121D40'}}>{game.name}</h3>
                        <Badge variant={game.status === "waiting" ? "secondary" : "default"} className="rounded-full px-2 py-0.5 text-xs font-bold shrink-0" style={{backgroundColor: game.status === "waiting" ? '#123273' : '#143C8C', color: '#F2E394'}}>
                          {game.status === "waiting" ? "⏳ ESPERA" : game.status === "scheduled" ? "📅 PROG" : "🎯 VIVO"}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-4 text-xs mb-2">
                        <div>
                          <span className="font-bold" style={{color: '#121D40'}}>Precio:</span>
                          <span className="font-extrabold ml-1" style={{color: '#143C8C'}}>{formatCurrencyWithSymbol(game.card_price, game.currency || 'USD')}</span>
                        </div>
                        <div>
                          <span className="font-bold" style={{color: '#121D40'}}>Máx:</span>
                          <span className="font-extrabold ml-1" style={{color: '#123273'}}>{game.max_cards}</span>
                        </div>
                        {game.scheduled_at && (
                          <div className="truncate">
                             <span className="font-bold" style={{color: '#121D40'}}>Hora:</span>
                             <span className="font-extrabold ml-1" style={{color: '#143C8C'}}>
                               {new Date(game.scheduled_at).toLocaleTimeString('es-CO', {hour: '2-digit', minute:'2-digit', hour12: true})}
                             </span>
                          </div>
                        )}
                      </div>

                      {/* POZO ACUMULADO - Compacto */}
                      {game.use_percentage_prizes && (
                        <div className="mb-2 scale-90 origin-left">
                          <PrizePoolDisplay gameId={game.id} showForClient={false} />
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-orange-300/50">
                        {/* BOTONES DE VISTA DEL JUEGO - Ahora compactos */}
                        <GameViewButtons gameId={game.id} gameName={game.name} />
                        
                        {/* BOTONES DE ELIMINAR */}
                        <div className="flex gap-1">
                          <Button
                            onClick={() => handleDeleteGame(game.id)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-full"
                          >
                            🗑️
                          </Button>
                          <Button
                            onClick={() => handleForceDeleteGame(game.id, game.name)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-800 hover:bg-red-200 hover:text-red-900 rounded-full"
                          >
                            💥
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Últimos Juegos Terminados */}
          <Card className="backdrop-blur-sm shadow-2xl transition-all duration-300 animate-fade-in relative hover:z-50 mb-12" style={{backgroundColor: 'rgba(242, 227, 148, 0.9)', border: '4px solid #D9A13B'}}>
            <CardHeader className="p-4 rounded-t-lg" style={{backgroundColor: '#D9A13B'}}>
              <CardTitle className="text-xl text-center font-bold uppercase" style={{color: '#121D40'}}>
                🏆 ÚLTIMOS JUEGOS TERMINADOS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {games.filter(g => g.status === 'FINISHED').length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-lg font-bold mb-2" style={{color: '#121D40'}}>No hay juegos terminados</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {games
                    .filter(g => g.status === 'FINISHED')
                    .sort((a, b) => new Date(b.finished_at || b.created_at).getTime() - new Date(a.finished_at || a.created_at).getTime())
                    .slice(0, 3)
                    .map((game: any) => (
                    <div key={game.id} className="p-4 rounded-lg shadow-md relative group hover:z-10" style={{background: 'white', border: '2px solid #D9A13B'}}>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold truncate pr-2" style={{color: '#121D40'}}>{game.name}</h3>
                        <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs font-bold shrink-0 border-gray-400 text-gray-600">
                          TERMINADO
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-4">
                         Terminado: {new Date(game.finished_at || game.created_at).toLocaleString('es-CO', {hour12: true})}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                        <Button
                          onClick={() => handleDeleteGame(game.id)}
                          size="sm"
                          variant="destructive"
                          className="w-full font-bold bg-red-600 hover:bg-red-700"
                        >
                          🗑️ Borrar Historial
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-1 gap-8 mb-12">
            {/* Gestión de Usuarios */}
            <Card className="backdrop-blur-sm shadow-2xl animate-fade-in" style={{backgroundColor: 'rgba(242, 227, 148, 0.9)', border: '4px solid #143C8C'}}>
              <CardHeader className="p-6 rounded-t-lg" style={{backgroundColor: '#143C8C'}}>
                <CardTitle className="text-2xl text-center font-bold uppercase flex items-center justify-center gap-2" style={{color: '#F2E394'}}>
                  <Users className="w-8 h-8" />
                  GESTIÓN DE USUARIOS
                </CardTitle>
                <CardDescription className="text-center text-lg" style={{color: '#F2E394'}}>
                  Administra las cuentas de los jugadores
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="text-left border-b-2 border-blue-200">
                      <tr>
                        <th className="py-2 text-blue-900">Usuario</th>
                        <th className="py-2 text-blue-900">Email</th>
                        <th className="py-2 text-blue-900 text-center">Teléfono</th>
                        <th className="py-2 text-blue-900 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100">
                      {users.filter(u => u.role !== 'admin').map((u) => (
                        <tr key={u.id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="py-3 font-bold text-gray-800">{u.display_name}</td>
                          <td className="py-3 text-gray-600">{u.email}</td>
                          <td className="py-3 text-center font-bold text-blue-700">{(u as any).telefono || '—'}</td>
                          <td className="py-3 text-right">
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="bg-red-500 hover:bg-red-600 font-bold"
                            >
                              Eliminar Cuenta
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {users.filter(u => u.role !== 'admin').length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-500 font-medium">
                            No hay jugadores registrados aún
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}
