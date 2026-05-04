"use client"
import { useState, useEffect, useMemo, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BingoCardComponent } from "@/components/bingo-card"
import { AutoGameController } from "@/components/auto-game-controller"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { GameNotifications } from "@/components/game-notifications"
import { GameWaitingScreen } from "@/components/game-waiting-screen"
import { formatCurrencyWithSymbol } from "@/hooks/use-currency"

// Helper para obtener la moneda del juego, nunca asumir USD
const getGameCurrency = (game: any) => {
  const c = game?.currency
  if (!c || c === '' || c === 'undefined') return 'VES' // Bingo Fortuna opera en Bs por defecto
  return c
}

interface GameState {
  id: string
  name: string
  status: 'WAITING' | 'ACTIVE' | 'ACTIVE_WAITING' | 'FINISHED' | 'waiting' | 'active' | 'finished' | 'scheduled'
  current_number: number | null
  called_numbers: number[]
  totalPlayers: number
  totalCards: number
  winners: number
  scheduled_at: string
  started_at: string | null
  finished_at: string | null
  waiting_until?: string | null
  line_winners?: any[]
  two_lines_winners?: any[]
  full_card_winners?: any[]
  prize_line: number
  prize_two_lines: number
  prize_full_card: number
  currency?: string
}

interface UserCard {
  id: string
  game_id: string
  user_id: string
  card_number: number
  numbers: number[]
  marked_positions: boolean[]
  is_winner: boolean
  created_at: string
}

interface Winner {
  card_number: number
  prize_type: 'line' | 'two_lines' | 'full_card'
  prize_amount: number
  user_email: string
  user_name?: string
  user_phone?: string
}

export default function LiveGamePage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [game, setGame] = useState<GameState | null>(null)
  const [userCards, setUserCards] = useState<UserCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [gameId, setGameId] = useState<string | null>(null)
  const [winners, setWinners] = useState<Winner[]>([])
  const [isUserWinner, setIsUserWinner] = useState(false)
  const [userPrizes, setUserPrizes] = useState<Array<{ type: string; amount: number }>>([])
  
  // Use session storage to persist notified winners across remounts
  const getNotifiedWinners = () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('bingo_notified_winners')
        if (stored) return new Set<string>(JSON.parse(stored))
      } catch (e) {}
    }
    return new Set<string>()
  }
  
  const saveNotifiedWinners = (winners: Set<string>) => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('bingo_notified_winners', JSON.stringify(Array.from(winners)))
      } catch (e) {}
    }
  }

  const notifiedWinnersRef = useRef<Set<string>>(getNotifiedWinners())
  const userWinnerRef = useRef<Set<string>>(new Set())
  const [adminContact, setAdminContact] = useState<string>('')
  const [isAdminView, setIsAdminView] = useState(false)
  const [allPlayersCards, setAllPlayersCards] = useState<any[]>([])
  const [isRefreshingCards, setIsRefreshingCards] = useState(false)
  
  const safeAllPlayersCards = useMemo(() => {
    if (!allPlayersCards || !Array.isArray(allPlayersCards)) return []
    return allPlayersCards
  }, [allPlayersCards])

  useEffect(() => {
    if (authLoading) return
    const urlParams = new URLSearchParams(window.location.search)
    const isAdmin = urlParams.get('admin') === 'true'
    const specificGameId = urlParams.get('gameId')
    setIsAdminView(isAdmin)
    if (!user && !isAdmin) { router.push('/auth/login'); return }
    if (specificGameId) {
      loadSpecificGame(specificGameId, isAdmin)
    } else {
      loadActiveGame(isAdmin)
    }
    loadAdminContact()
  }, [user, authLoading])

  useEffect(() => {
    const isStatusActive = game?.status === 'ACTIVE' || game?.status === 'active'
    const isStatusWaiting = game?.status === 'WAITING' || game?.status === 'waiting'
    const isStatusActiveWaiting = game?.status === 'ACTIVE_WAITING'
    if (gameId && (isStatusActive || isStatusWaiting || isStatusActiveWaiting)) {
      const interval = setInterval(updateGameState, 2000)
      return () => clearInterval(interval)
    }
  }, [gameId, game?.status, isAdminView])

  const loadAdminContact = async () => {
    try {
      const response = await fetch('/api/admin/contact')
      const data = await response.json()
      if (data.success) setAdminContact(data.contact || '04121980898')
    } catch (error) { console.error('Error loading admin contact:', error) }
  }

  const loadSpecificGame = async (specificGameId: string, isAdmin: boolean) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/games/status?gameId=${specificGameId}`)
      const data = await response.json()
      if (data.success && data.game) {
        const gameData = data.game
        setGameId(gameData.id)
        setGame(gameData)
        if (isAdmin) {
          await loadAllPlayersCards(gameData.id, false)
        } else {
          await loadUserCards(gameData.id)
        }
      } else {
        toast({ title: "Juego no encontrado", description: "El juego especificado no existe o no está disponible" })
        router.push(isAdmin ? '/admin' : '/game')
      }
    } catch (error) {
      console.error('Error loading specific game:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadActiveGame = async (isAdmin: boolean) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/games/next')
      const data = await response.json()
      if (data.success && data.nextGame) {
        const gameData = data.nextGame
        setGameId(gameData.id)
        setGame(gameData)
        setIsUserWinner(false)
        setUserPrizes([])
        // We do NOT clear session storage completely to avoid re-notifying past winners if we refresh mid-game
        userWinnerRef.current = new Set()
        if (isAdmin) {
          await loadAllPlayersCards(gameData.id, false)
        } else {
          await loadUserCards(gameData.id)
        }
        if (gameData.line_winners) gameData.line_winners.forEach((w: any) => notifiedWinnersRef.current.add(`${w.card_number}-line`))
        if (gameData.two_lines_winners) gameData.two_lines_winners.forEach((w: any) => notifiedWinnersRef.current.add(`${w.card_number}-two_lines`))
        if (gameData.full_card_winners) gameData.full_card_winners.forEach((w: any) => notifiedWinnersRef.current.add(`${w.card_number}-full_card`))
      } else {
        toast({ title: "No hay juegos disponibles", description: "No hay juegos activos o programados en este momento" })
        router.push(isAdmin ? '/admin' : '/game')
      }
    } catch (error) {
      console.error('Error loading active game:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserCards = async (currentGameId: string) => {
    try {
      const response = await fetch(`/api/user-cards?email=${encodeURIComponent(user!.email)}&gameId=${currentGameId}`)
      const data = await response.json()
      if (data.success) setUserCards(data.cards || [])
      else setUserCards([])
    } catch (error) {
      console.error('Error loading user cards:', error)
      setUserCards([])
    }
  }

  const loadAllPlayersCards = async (currentGameId: string, isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshingCards(true)
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/all-cards?gameId=${currentGameId}&t=${timestamp}`, {
        cache: 'no-store', headers: { 'Cache-Control': 'no-cache' }
      })
      const data = await response.json()
      if (data.success) {
        let cardsToSet = Array.isArray(data.cards) ? data.cards.filter((c: any) => c && typeof c === 'object') : []
        setAllPlayersCards(cardsToSet)
        setUserCards([])
        if (isManualRefresh) {
          toast({ title: "🔄 Cartones Actualizados", description: `Total: ${cardsToSet.length} cartones`, duration: 2000 })
        }
      }
    } catch (error) {
      console.error('Error loading all players cards:', error)
    } finally {
      if (isManualRefresh) setIsRefreshingCards(false)
    }
  }

  const updateGameState = async () => {
    if (!gameId) return
    try {
      let response
      if (isAdminView) {
        response = await fetch(`/api/games/status?gameId=${gameId}`)
      } else if (user) {
        response = await fetch(`/api/games/status?gameId=${gameId}&userId=${user.id}`)
      } else { return }
      
      const data = await response.json()
      
      if (data.success) {
        setGame(data.game)
        if (isAdminView) {
          await loadAllPlayersCards(gameId, false)
        } else {
          setUserCards(data.userCards || [])
        }

        // ✅ FIX: usar w.prize_amount del ganador (calculado dinámicamente) en lugar del valor fijo del juego
        const allWinners: Winner[] = []
        
        if (data.game.line_winners) {
          data.game.line_winners.forEach((w: any) => {
            allWinners.push({
              card_number: w.card_number,
              prize_type: 'line',
              prize_amount: w.prize_amount || data.game.prize_line,  // ← usa prize_amount del ganador
              user_email: w.user_email,
              user_name: w.user_name,
              user_phone: w.user_phone || ''
            })
          })
        }
        
        if (data.game.two_lines_winners) {
          data.game.two_lines_winners.forEach((w: any) => {
            allWinners.push({
              card_number: w.card_number,
              prize_type: 'two_lines',
              prize_amount: w.prize_amount || data.game.prize_two_lines,  // ← usa prize_amount del ganador
              user_email: w.user_email,
              user_name: w.user_name,
              user_phone: w.user_phone || ''
            })
          })
        }
        
        if (data.game.full_card_winners) {
          data.game.full_card_winners.forEach((w: any) => {
            allWinners.push({
              card_number: w.card_number,
              prize_type: 'full_card',
              prize_amount: w.prize_amount || data.game.prize_full_card,  // ← usa prize_amount del ganador
              user_email: w.user_email,
              user_name: w.user_name,
              user_phone: w.user_phone || ''
            })
          })
        }

        const userWinners = allWinners.filter(w => w.user_email === user?.email)
        userWinners.forEach(userWinner => {
          const userWinKey = `user-${userWinner.prize_type}`
          if (!userWinnerRef.current.has(userWinKey)) {
            userWinnerRef.current.add(userWinKey)
            setIsUserWinner(true)
            const prizeTypeText = { 'line': 'UNA LÍNEA', 'two_lines': 'DOS LÍNEAS', 'full_card': 'CARTÓN LLENO' }[userWinner.prize_type]
            setUserPrizes((prev: Array<{ type: string; amount: number }>) => [...prev, { type: prizeTypeText || 'PREMIO', amount: userWinner.prize_amount }])
            toast({
              title: `🎉 ¡GANASTE ${prizeTypeText}!`,
              description: `Tu cartón #${userWinner.card_number} ha ganado ${formatCurrencyWithSymbol(userWinner.prize_amount, getGameCurrency(game) as any)}`,
              duration: 15000
            })
          }
        })

        if (Array.isArray(allWinners) && allWinners.length > 0) {
          const newWinners = allWinners.filter(w => {
            const winnerKey = `${w.card_number}-${w.prize_type}`
            return !notifiedWinnersRef.current.has(winnerKey)
          })
          if (newWinners.length > 0) {
            const newWinnerKeys: string[] = []
            newWinners.forEach(w => {
              const winnerKey = `${w.card_number}-${w.prize_type}`
              const prizeTypeText = { 'line': '🥉 UNA LÍNEA', 'two_lines': '🥈 DOS LÍNEAS', 'full_card': '🥇 CARTÓN LLENO' }[w.prize_type]
              toast({
                title: `${prizeTypeText} GANADO!`,
                description: `Cartón #${w.card_number} - ${formatCurrencyWithSymbol(w.prize_amount, getGameCurrency(game) as any)}${isAdminView ? ` (${w.user_name || w.user_email})` : ''}`,
                duration: 60000
              })
              newWinnerKeys.push(winnerKey)
            })
            newWinnerKeys.forEach(key => notifiedWinnersRef.current.add(key))
            saveNotifiedWinners(notifiedWinnersRef.current)
          }
        }

        setWinners(allWinners)

        if (data.game?.status === 'FINISHED' && game?.status !== 'FINISHED') {
          if (!isAdminView) {
            toast({ title: "🏁 Juego Finalizado", description: "El juego ha terminado. Serás redirigido en 5 segundos." })
            setTimeout(() => router.push('/game'), 5000)
          } else {
            toast({ title: "🎊 Juego Finalizado", description: "Todos los premios han sido ganados.", duration: 30000 })
          }
        }
      }
    } catch (error) { console.error('Error updating game state:', error) }
  }

  const handleLogout = () => {
    localStorage.removeItem('bingo_token')
    localStorage.removeItem('bingo_user')
    router.push('/')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #121D40 0%, #143C8C 50%, #123273 100%)'}}>
        <Card className="bg-white rounded-lg p-12 max-w-2xl mx-auto shadow-2xl">
          <CardContent className="p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-center">Verificando autenticación...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) return null

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #121D40 0%, #143C8C 50%, #123273 100%)'}}>
        <Card className="bg-white rounded-lg p-12 max-w-2xl mx-auto shadow-2xl">
          <CardContent className="p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-center">Cargando juego...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #121D40 0%, #143C8C 50%, #123273 100%)'}}>
        <header className="backdrop-blur-sm sticky top-0 z-10 p-4" style={{backgroundColor: 'rgba(242, 227, 148, 0.9)'}}>
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-3xl font-bold" style={{color: '#121D40'}}>BINGO FORTUNA - JUEGO EN VIVO</h1>
            <Button onClick={() => router.push(isAdminView ? '/admin' : '/game')}>← Volver</Button>
          </div>
        </header>
        <div className="container mx-auto px-6 py-8 flex items-center justify-center min-h-[80vh]">
          <Card className="bg-white rounded-lg p-12 max-w-2xl shadow-2xl">
            <CardContent className="p-8">
              <h2 className="text-4xl font-bold mb-6" style={{color: '#121D40'}}>😴 No hay juego activo</h2>
              <p className="text-xl mb-2 text-gray-600">No hay juegos en vivo en este momento</p>
              <Button onClick={() => router.push('/game')} className="mt-4">Ver próximos juegos</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const getStatusBadge = () => {
    const status = game.status?.toUpperCase()
    switch (status) {
      case 'WAITING': return <Badge className="bg-yellow-500">⏳ Esperando inicio</Badge>
      case 'ACTIVE_WAITING': return <Badge className="bg-orange-500 animate-pulse">🕐 Iniciando en breve...</Badge>
      case 'ACTIVE': return <Badge className="bg-green-500 animate-pulse">🔴 EN VIVO</Badge>
      case 'FINISHED': return <Badge className="bg-gray-500">✅ Finalizado</Badge>
      default: return <Badge className="bg-blue-500 font-bold">{game.status}</Badge>
    }
  }

  const getPrizeText = (type: string) => {
    return { 'line': '🥉 Una Línea', 'two_lines': '🥈 Dos Líneas', 'full_card': '🥇 Cartón Lleno' }[type] || type
  }

  const startGame = async () => {
    if (!gameId) return
    try {
      const response = await fetch('/api/admin/start-game', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId })
      })
      const data = await response.json()
      if (data.success) {
        toast({ title: "🎮 ¡Juego Iniciado!", description: "El juego ha comenzado." })
        updateGameState()
      } else {
        toast({ title: "Error", description: data.error || "Error al iniciar el juego", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexion", variant: "destructive" })
    }
  }

  const handleFinishGame = async () => {
    if (!gameId) return
    if (!confirm('¿Estás seguro de que deseas finalizar este juego manualmente?')) return
    try {
      const response = await fetch('/api/admin/finish-game', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId })
      })
      const data = await response.json()
      if (data.success) {
        toast({ title: "✅ Juego Finalizado", description: "El juego ha sido marcado como finalizado." })
        updateGameState()
      } else {
        toast({ title: "Error", description: data.error || "Error al finalizar el juego", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" })
    }
  }

  if (game && game.status === 'ACTIVE_WAITING' && game.waiting_until) {
    return (
      <GameWaitingScreen
        gameName={game.name}
        waitingUntil={game.waiting_until}
        onCountdownFinish={() => updateGameState()}
      />
    )
  }

  return (
    <div className="min-h-screen pb-12" style={{background: 'linear-gradient(135deg, #121D40 0%, #143C8C 50%, #123273 100%)'}}>
      <header className="backdrop-blur-sm sticky top-0 z-10 p-4" style={{backgroundColor: isAdminView ? 'rgba(220, 38, 127, 0.9)' : 'rgba(242, 227, 148, 0.9)'}}>
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{color: '#121D40'}}>
              BINGO FORTUNA - {isAdminView ? 'VISTA ADMIN' : 'JUEGO EN VIVO'}
            </h1>
            <p className="text-sm font-bold" style={{color: '#121D40'}}>
              {game.name}
              {game.scheduled_at && ` - ${new Date(game.scheduled_at).toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })}`}
            </p>
          </div>
          <div className="flex gap-4 items-center">
            {getStatusBadge()}
            {isAdminView ? (
              <>
                <span className="font-semibold text-white bg-red-600 px-3 py-1 rounded text-xs">ADMIN VIEW</span>
                <Button onClick={() => router.push('/admin')}>← Panel Admin</Button>
              </>
            ) : (
              <>
                <span className="font-semibold" style={{color: '#121D40'}}>{user?.display_name || user?.email}</span>
                <Button onClick={() => router.push('/game')}>← Volver</Button>
                <Button onClick={handleLogout}>SALIR</Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {isAdminView && (game.status?.toUpperCase() === 'ACTIVE' || game.status?.toUpperCase() === 'ACTIVE_WAITING') && (
          <div className="fixed bottom-6 right-6 z-50">
            <Button onClick={handleFinishGame} variant="destructive" className="rounded-full shadow-2xl border-2 border-white font-bold py-6 px-8 hover:scale-105 transition-transform">
              🏁 FINALIZAR JUEGO (ADMIN)
            </Button>
          </div>
        )}

        {!isAdminView && user && (
          <div className="mb-6"><GameNotifications userEmail={user.email} /></div>
        )}

        {isUserWinner && userPrizes.length > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 border-4 border-yellow-300 shadow-2xl animate-pulse">
            <CardContent className="p-8 text-center">
              <h2 className="text-5xl font-bold mb-4 text-white">🎉 ¡FELICIDADES, GANASTE! 🎉</h2>
              {userPrizes.map((prize: { type: string; amount: number }, i: number) => (
                <p key={i} className="text-3xl font-bold text-white mb-2">
                  {prize.type} — {formatCurrencyWithSymbol(prize.amount, getGameCurrency(game) as any)}
                </p>
              ))}
              <div className="bg-white/90 rounded-lg p-6 mt-4">
                <p className="text-2xl font-bold text-gray-800 mb-2">📞 Comunícate con el administrador para reclamar tu premio</p>
                <p className="text-xl text-blue-600 font-bold">{adminContact}</p>
              </div>
              <button onClick={() => { setIsUserWinner(false); setUserPrizes([]) }} className="mt-4 bg-white/20 hover:bg-white/30 text-white font-bold px-6 py-2 rounded-full transition">
                ✕ Cerrar
              </button>
            </CardContent>
          </Card>
        )}

        {isAdminView && (
          <div className="mb-8">
            {game.status?.toUpperCase() === 'WAITING' ? (
              <Card className="bg-gradient-to-r from-green-500 to-blue-600 border-4 border-green-300 shadow-2xl">
                <CardHeader><CardTitle className="text-white text-2xl text-center">🎮 Control de Administrador</CardTitle></CardHeader>
                <CardContent className="text-center">
                  <p className="text-white text-lg mb-4">El juego está esperando a ser iniciado</p>
                  <Button onClick={startGame} className="bg-white text-green-600 hover:bg-green-50 text-xl font-bold py-4 px-8 shadow-lg transform hover:scale-105 transition-all duration-300">
                    🚀 INICIAR JUEGO
                  </Button>
                </CardContent>
              </Card>
            ) : (game.status?.toUpperCase() === 'ACTIVE' || game.status?.toUpperCase() === 'ACTIVE_WAITING') && gameId ? (
              <AutoGameController gameId={gameId} onGameUpdate={updateGameState} />
            ) : (
              <Card className="bg-gradient-to-r from-purple-500 to-pink-600 border-4 border-purple-300 shadow-2xl">
                <CardHeader><CardTitle className="text-white text-2xl text-center">🎊 Juego Finalizado</CardTitle></CardHeader>
                <CardContent className="text-center"><p className="text-white text-lg">Todos los premios han sido ganados</p></CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl mb-6">
              <CardHeader><CardTitle className="text-2xl">Número Actual</CardTitle></CardHeader>
              <CardContent>
                {game.current_number ? (
                  <div className="text-center">
                    <div className="text-8xl font-bold text-blue-600 mb-2">{game.current_number}</div>
                    <p className="text-gray-600">Último número llamado</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500"><p className="text-2xl">Esperando...</p></div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-sm shadow-xl mb-6">
              <CardHeader><CardTitle>Números Llamados ({game.called_numbers?.length || 0})</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto">
                  {game.called_numbers?.map((num: number) => (
                    <div key={num} className="aspect-square flex items-center justify-center bg-blue-500 text-white font-bold rounded-lg text-lg">{num}</div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {Array.isArray(winners) && winners.length > 0 && (
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
                <CardHeader><CardTitle>🏆 Ganadores</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {winners.map((winner, idx) => (
                      <div key={idx} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="font-bold text-lg">{getPrizeText(winner.prize_type)}</div>
                        <div className="text-sm text-gray-600">
                          Cartón #{winner.card_number}
                          {isAdminView && (
                            <div className="mt-1 space-y-0.5">
                              <div className="font-semibold text-blue-700">👤 {winner.user_name || winner.user_email}</div>
                              {winner.user_phone && <div className="font-semibold text-purple-700">📱 {winner.user_phone}</div>}
                            </div>
                          )}
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrencyWithSymbol(winner.prize_amount, getGameCurrency(game) as any)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold" style={{color: '#F2E394'}}>
                {isAdminView ? <>👥 Todos los Cartones ({safeAllPlayersCards.length})</> : <>🎴 Tus Cartones ({Array.isArray(userCards) ? userCards.length : 0})</>}
              </h2>
              {isAdminView && (
                <Button onClick={() => { if (gameId) loadAllPlayersCards(gameId, true) }} disabled={isRefreshingCards} className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50" size="sm">
                  {isRefreshingCards ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Actualizando...</> : <>🔄 Actualizar Cartones</>}
                </Button>
              )}
            </div>
            
            {isAdminView ? (
              safeAllPlayersCards.length > 0 ? (
                <div className="space-y-6">
                  {(() => {
                    const groupedCards = safeAllPlayersCards.reduce((acc: any, card: any) => {
                      if (!card?.user?.id) return acc
                      const userId = card.user.id
                      if (!acc[userId]) acc[userId] = { user: card.user, cards: [] }
                      acc[userId].cards.push(card)
                      return acc
                    }, {})
                    return Object.values(groupedCards).map((userData: any) => (
                      <Card key={userData.user?.id} className="bg-white/95 backdrop-blur-sm shadow-xl">
                        <CardHeader>
                          <CardTitle className="text-xl text-blue-800">
                            👤 {userData.user?.display_name || userData.user?.email}
                            <Badge className="ml-2">{userData.cards.length} cartones</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {userData.cards.map((card: any) => (
                              <div key={card.id} className="space-y-2">
                                <div className="text-center">
                                  <span className="font-bold text-lg">Cartón #{card.card_number}</span>
                                  {card.is_winner && <span className="ml-2 text-2xl">🏆</span>}
                                </div>
                                <BingoCardComponent card={card} calledNumbers={Array.isArray(game.called_numbers) ? game.called_numbers : []} isInteractive={false} />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  })()}
                </div>
              ) : (
                <Card className="bg-white rounded-lg p-12 shadow-2xl">
                  <CardContent className="p-8 text-center">
                    <h2 className="text-4xl font-bold mb-6" style={{color: '#121D40'}}>🎴 No hay cartones en este juego</h2>
                    <p className="text-xl mb-4 text-gray-600">Los jugadores aún no han comprado cartones</p>
                  </CardContent>
                </Card>
              )
            ) : (
              Array.isArray(userCards) && userCards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userCards.map((card) => (
                    <div key={card.id} className="space-y-2">
                      <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">Cartón #{card.card_number}</CardTitle>
                            {card.is_winner && <span className="text-3xl">🏆</span>}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <BingoCardComponent card={{...card, game_id: card.game_id || game.id || ''}} calledNumbers={Array.isArray(game.called_numbers) ? game.called_numbers : []} isInteractive={false} />
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="bg-white rounded-lg p-12 shadow-2xl">
                  <CardContent className="p-8 text-center">
                    <h2 className="text-4xl font-bold mb-6" style={{color: '#121D40'}}>🎴 No tienes cartones para este juego</h2>
                    <p className="text-xl mb-4 text-gray-600">Compra cartones para el próximo juego</p>
                    <Button onClick={() => router.push('/game')} className="mt-4">Ver próximos juegos</Button>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </div>

        {game.status === 'FINISHED' && (
          <Card className="mt-8 bg-gradient-to-r from-purple-400 to-pink-400 border-4 border-purple-300 shadow-2xl">
            <CardContent className="p-8 text-center">
              <h2 className="text-4xl font-bold mb-4 text-white">🎊 ¡Juego Finalizado! 🎊</h2>
              <p className="text-xl text-white mb-4">Todos los premios han sido ganados</p>
              <Button onClick={() => router.push('/game')} size="lg" className="mt-4">Ver próximos juegos</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
