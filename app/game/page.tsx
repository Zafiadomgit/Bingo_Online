"use client"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PurchaseForm } from "@/components/purchase-form"
import { useToast } from "@/hooks/use-toast"
import { BingoCardComponent } from "@/components/bingo-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { useCurrency, formatCurrencyWithSymbol } from "@/hooks/use-currency"
import { Calendar } from "lucide-react"
import { WinnerNotifications } from "@/components/winner-notifications"

export default function GamePage() {
  const { user } = useAuth()
  const { formatCurrency } = useCurrency()
  const [nextGame, setNextGame] = useState<any>(null)
  const [allGames, setAllGames] = useState<any[]>([])

  // Función para formatear moneda usando la moneda del juego específico
  const formatGameCurrency = (amount: number | string, currency?: string) => {
    const gameCurrency = currency || nextGame?.currency || 'USD'
    return formatCurrencyWithSymbol(amount, gameCurrency)
  }
  const [userCards, setUserCards] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [selectedGameForPurchase, setSelectedGameForPurchase] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCards, setIsLoadingCards] = useState(false)
  const [canPurchase, setCanPurchase] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      loadNextGame()
      loadUserCards()
    }
  }, [user])

  // Polling para actualizar automáticamente los datos cuando el admin elimina/modifica juegos
  useEffect(() => {
    if (!user) return

    // Cargar datos iniciales
    const initialLoad = () => {
      loadNextGame()
      loadUserCards()
    }

    // Configurar polling cada 30 segundos
    const pollInterval = setInterval(() => {
      console.log('🔄 Polling: Verificando actualizaciones de juegos...')
      loadNextGame(true) // Mostrar notificaciones durante el polling
      loadUserCards() // También recargar cartones para detectar cambios
    }, 30000) // 30 segundos

    // También escuchar eventos de visibilidad para recargar cuando el usuario vuelve a la pestaña
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Usuario volvió a la pestaña - recargando datos')
        initialLoad()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Limpiar intervalos y listeners al desmontar
    return () => {
      clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  const loadNextGame = async (showNotification = false) => {
    try {
      setIsLoading(true)
      // Agregar timestamp para evitar cache
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/games/next?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      const data = await response.json()
      
      console.log('📡 Respuesta del API:', data)
      
      // Detectar si había un juego y ahora no hay ninguno (juego eliminado)
      const hadGame = nextGame !== null
      const hasGameNow = data.success && data.nextGame
      
      if (hadGame && !hasGameNow && showNotification) {
        console.log('🚨 Juego eliminado detectado')
        toast({
          title: "⚠️ Juego Actualizado",
          description: "El juego que estabas viendo ya no está disponible. Puede haber sido cancelado por el administrador.",
          duration: 5000
        })
      }
      
      if (data.success && data.nextGame) {
        console.log('✅ Juego encontrado:', data.nextGame)
        
        // Detectar si es un juego diferente al anterior
        const isDifferentGame = nextGame && nextGame.id !== data.nextGame.id
        if (isDifferentGame && showNotification) {
          console.log('🔄 Nuevo juego detectado')
          toast({
            title: "🎮 Nuevo Juego Disponible",
            description: `Hay un nuevo juego disponible: ${data.nextGame.name}`,
            duration: 3000
          })
        }
        
        setNextGame(data.nextGame)
        setAllGames(data.games || [data.nextGame])
        setCanPurchase(data.canPurchase !== false) // Por defecto true si no viene
      } else {
        console.log('❌ No hay juegos disponibles')
        setNextGame(null)
        setAllGames([])
        setCanPurchase(false)
      }
    } catch (error) {
      console.error('Error loading next game:', error)
      setNextGame(null)
      setAllGames([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserCards = async () => {
    if (!user?.email) return
    
    try {
      setIsLoadingCards(true)
      // Agregar timestamp para evitar cache
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/user-cards?email=${encodeURIComponent(user.email)}&t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()
      
      console.log('🎴 Cartones del usuario:', data)
      
      if (data.success) {
        setUserCards(data.cards || [])
        setPendingRequests(data.pendingRequests || [])
      }
    } catch (error) {
      console.error('Error loading user cards:', error)
    } finally {
      setIsLoadingCards(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('bingo_token')
    localStorage.removeItem('bingo_user')
    window.location.href = "/"
  }


  if (!user) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #121D40 0%, #143C8C 50%, #123273 100%)'}}>
      <header className="backdrop-blur-sm sticky top-0 z-10 p-4" style={{backgroundColor: 'rgba(242, 227, 148, 0.9)'}}>
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold" style={{color: '#121D40'}}>BINGO FORTUNA</h1>
              <div className="flex gap-4 items-center">
                <span className="font-semibold" style={{color: '#121D40'}}>
                  {user.display_name || user.email}
                </span>
                <Button onClick={() => { 
                  console.log('🔄 Forzando actualización manual...')
                  setNextGame(null)
                  setIsLoading(true)
                  setTimeout(() => {
                    loadNextGame()
                    loadUserCards()
                  }, 100)
                }}>🔄 Actualizar</Button>
                <Button onClick={handleLogout}>SALIR</Button>
              </div>
        </div>
      </header>
      <div className="container mx-auto px-6 py-8">
        {user && <WinnerNotifications userEmail={user.email} />}
        <Tabs defaultValue="next-game" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="next-game">Próximo Juego</TabsTrigger>
            <TabsTrigger value="my-cards">
              Mis Cartones {userCards.length > 0 && `(${userCards.length})`}
              {pendingRequests.length > 0 && ` + ${pendingRequests.length} solicitudes`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="next-game">
            {isLoading ? (
              <Card className="bg-white rounded-lg p-12 max-w-2xl mx-auto shadow-2xl">
                <CardContent className="p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando información de los juegos...</p>
                </CardContent>
              </Card>
            ) : allGames.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {allGames.map((game: any) => (
                  <Card key={game.id} className="bg-white rounded-lg shadow-2xl overflow-hidden hover:scale-[1.02] transition-transform">
                    <div className="bg-blue-900 text-white p-4">
                      <h3 className="text-xl font-bold uppercase tracking-wider">{game.name}</h3>
                      <div className="flex items-center gap-2 text-blue-200 mt-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {new Date(game.scheduled_at).toLocaleString('es-CO', {
                            dateStyle: 'full',
                            timeStyle: 'short'
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                        <div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Precio p/ cartón</span>
                          <div className="text-xl font-bold text-green-600">{formatGameCurrency(game.card_price, game.currency)}</div>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Disponibles</span>
                          <div className="text-xl font-bold text-blue-600">{Math.max(0, (game.max_cards || 0) - parseInt(game.total_cards_sold || '0'))}</div>
                        </div>
                      </div>

                      {/* Premios */}
                      <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
                        <h4 className="font-extrabold text-[#121D40] text-sm uppercase mb-2 flex items-center gap-2">
                           🏆 PREMIOS
                        </h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between border-b border-yellow-200 pb-1">
                            <span className="font-medium">🥇 Cartón Lleno:</span>
                            <span className="font-bold text-green-600">
                              {game.use_percentage_prizes 
                                ? formatGameCurrency((parseInt(game.total_cards_sold || '0') * parseFloat(game.card_price || '0') * parseFloat(game.prize_full_card_percentage || '0') / 100), game.currency) 
                                : formatGameCurrency(game.prize_full_card, game.currency)}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-yellow-200 pb-1">
                            <span className="font-medium">🥈 Dos Líneas:</span>
                            <span className="font-bold text-blue-600">
                              {game.use_percentage_prizes 
                                ? formatGameCurrency((parseInt(game.total_cards_sold || '0') * parseFloat(game.card_price || '0') * parseFloat(game.prize_two_lines_percentage || '0') / 100), game.currency) 
                                : formatGameCurrency(game.prize_two_lines, game.currency)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">🥉 Una Línea:</span>
                            <span className="font-bold text-orange-600">
                              {game.use_percentage_prizes 
                                ? formatGameCurrency((parseInt(game.total_cards_sold || '0') * parseFloat(game.card_price || '0') * parseFloat(game.prize_line_percentage || '0') / 100), game.currency) 
                                : formatGameCurrency(game.prize_line, game.currency)}
                            </span>
                          </div>
                        </div>
                        {/* Disclaimer premios compartidos */}
                        <div className="mt-2 flex items-start gap-1 bg-blue-50 border border-blue-200 rounded-lg p-2">
                          <span className="text-blue-500 text-xs mt-0.5">ℹ️</span>
                          <p className="text-xs text-blue-700">
                            Si dos jugadores ganan el mismo premio simultáneamente, el monto se divide en partes iguales entre los ganadores.
                          </p>
                        </div>
                      </div>

                      <div className="pt-2">
                        {game.status === 'WAITING' || game.status === 'waiting' ? (
                          <div className="space-y-2">
                            <Button 
                              onClick={() => {
                                setSelectedGameForPurchase(game)
                                setShowPurchaseForm(true)
                              }} 
                              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 shadow-md"
                            >
                              💳 COMPRAR CARTONES
                            </Button>
                            <div className="text-center p-2 bg-blue-50 border border-blue-200 rounded text-blue-600 text-sm font-semibold">
                              🕐 Juego por empezar — disponible cuando inicie
                            </div>
                          </div>
                        ) : game.status === 'ACTIVE' || game.status === 'active' ? (
                          <div className="space-y-3">
                            <div className="text-center p-2 bg-orange-100 border border-orange-200 rounded text-orange-800 text-sm font-bold">
                              🎮 JUEGO EN CURSO
                            </div>
                            {userCards.some(c => c.game_id === game.id) && (
                              <Button 
                                onClick={() => router.push('/game/live')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 shadow-md"
                              >
                                IR AL JUEGO EN VIVO
                              </Button>
                            )}
                          </div>
                        ) : game.status === 'ACTIVE_WAITING' ? (
                          <div className="space-y-3">
                            <div className="text-center p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm font-bold animate-pulse">
                              ⏳ JUEGO INICIANDO EN BREVE...
                            </div>
                            <Button
                              onClick={() => router.push('/game/live')}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 shadow-md"
                            >
                              🎮 IR AL JUEGO EN VIVO
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center p-2 bg-gray-100 border border-gray-200 rounded text-gray-500 text-sm">
                            Juego No Disponible
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white rounded-lg p-12 max-w-2xl mx-auto shadow-2xl">
                <CardContent className="p-8">
                  <h2 className="text-4xl font-bold mb-6" style={{color: '#121D40'}}>😴 No hay juegos disponibles</h2>
                  <p className="text-xl mb-4 text-gray-600">Podrás comprar cartones cuando haya juegos programados</p>
                  <p className="text-gray-500">Haz clic en "🔄 Actualizar" para verificar si hay nuevos juegos</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="my-cards">
            {isLoadingCards ? (
              <Card className="bg-white rounded-lg p-12 max-w-4xl mx-auto shadow-2xl">
                <CardContent className="p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando tus cartones...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="max-w-6xl mx-auto space-y-8">
                {/* Solicitudes Pendientes */}
                {pendingRequests.length > 0 && (
                  <div>
                    <h2 className="text-3xl font-bold mb-6 text-center" style={{color: '#F2E394'}}>
                      ⏳ Solicitudes Pendientes ({pendingRequests.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pendingRequests.map((request: any) => (
                        <Card key={request.id} className="bg-yellow-50 border-4 border-yellow-400 shadow-xl">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <span className="animate-pulse">⏳</span>
                              Solicitud #{request.id.slice(-8)}
                            </CardTitle>
                            <div className="text-sm text-gray-600">
                              {new Date(request.created_at).toLocaleString('es-CO')}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="bg-white/80 rounded-lg p-3">
                              <div className="font-semibold text-gray-800">
                                {request.cantidad_cartones} cartón{request.cantidad_cartones > 1 ? 'es' : ''}
                              </div>
                              <div className="text-sm text-gray-600">
                                Total: ${request.total}
                              </div>
                              {request.numero_referencia && (
                                <div className="text-sm text-gray-600">
                                  Ref: {request.numero_referencia}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-center">
                              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold border border-yellow-300">
                                🔄 Esperando Aprobación
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cartones Aprobados */}
                {userCards.length > 0 && (
                  <div>
                    <h2 className="text-3xl font-bold mb-6 text-center" style={{color: '#F2E394'}}>
                      🎴 Tus Cartones Aprobados ({userCards.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userCards.map((card: any) => (
                        <div key={card.id} className="space-y-2">
                          <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">
                                  Cartón #{card.card_number}
                                </CardTitle>
                                {card.is_winner && (
                                  <span className="text-2xl">🏆</span>
                                )}
                              </div>
                              {card.bingo_games?.[0] && (
                                <p className="text-sm text-gray-600">
                                  {new Date(card.bingo_games[0].scheduled_at).toLocaleDateString('es-CO')}
                                </p>
                              )}
                            </CardHeader>
                            <CardContent>
                              <BingoCardComponent
                                card={card}
                                calledNumbers={[]}
                                isInteractive={false}
                              />
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mensaje cuando no hay cartones ni solicitudes */}
                {userCards.length === 0 && pendingRequests.length === 0 && (
                  <Card className="bg-white rounded-lg p-12 max-w-2xl mx-auto shadow-2xl">
                    <CardContent className="p-8">
                      <h2 className="text-4xl font-bold mb-6" style={{color: '#121D40'}}>🎴 No tienes cartones aún</h2>
                      <p className="text-xl mb-4 text-gray-600">Compra cartones para el próximo juego y te aparecerán aquí cuando sean aprobados</p>
                      <Button 
                        onClick={() => {
                          const tabs = document.querySelector('[value="next-game"]') as HTMLElement
                          tabs?.click()
                        }}
                        className="mt-4"
                      >
                        Ver Próximo Juego
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      {showPurchaseForm && selectedGameForPurchase && (
        <PurchaseForm
          onClose={() => {
            setShowPurchaseForm(false)
            setSelectedGameForPurchase(null)
          }}
          onSuccess={() => {
            setShowPurchaseForm(false)
            setSelectedGameForPurchase(null)
            toast({
              title: "✅ Solicitud Enviada",
              description: "Tu solicitud ha sido enviada exitosamente. Recibirás tus cartones cuando sea aprobada."
            })
            loadNextGame()
            loadUserCards()
          }}
          gameId={selectedGameForPurchase.id}
          maxCards={selectedGameForPurchase.max_cards}
          cardPrice={selectedGameForPurchase.card_price}
          gameStatus={selectedGameForPurchase.status}
          gameName={selectedGameForPurchase.name}
          currency={selectedGameForPurchase.currency || 'USD'}
        />
      )}
    </div>
  )
}
