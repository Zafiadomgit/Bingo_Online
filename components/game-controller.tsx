"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface GameControllerProps {
  onGameUpdate?: () => void
}

export function GameController({ onGameUpdate }: GameControllerProps) {
  const [activeGame, setActiveGame] = useState<any>(null)
  const [gameStatus, setGameStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadActiveGame()
  }, [])

  useEffect(() => {
    if (activeGame && gameStatus?.isActive) {
      // Actualizar estado del juego cada 3 segundos si está activo
      const interval = setInterval(loadActiveGame, 3000)
      return () => clearInterval(interval)
    }
  }, [activeGame, gameStatus])

  const loadActiveGame = async () => {
    try {
      // Buscar juegos activos o programados
      const response = await fetch('/api/games/next')
      const data = await response.json()
      
      if (data.success && data.nextGame) {
        setActiveGame(data.nextGame)
        
        // Obtener estado detallado del juego
        const statusResponse = await fetch(`/api/games/status?gameId=${data.nextGame.id}`)
        const statusData = await statusResponse.json()
        
        if (statusData.success) {
          setGameStatus(statusData)
        }
      } else {
        setActiveGame(null)
        setGameStatus(null)
      }
    } catch (error) {
      console.error('Error loading active game:', error)
    }
  }

  const startGame = async () => {
    if (!activeGame) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/start-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: activeGame.id })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "✅ Juego iniciado",
          description: `El juego ha comenzado con ${data.players} jugadores`
        })
        loadActiveGame()
        onGameUpdate?.()
      } else {
        toast({
          title: "❌ Error",
          description: data.error || "Error iniciando el juego",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error starting game:', error)
      toast({
        title: "❌ Error",
        description: "Error iniciando el juego",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const callNumber = async () => {
    if (!activeGame) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/call-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: activeGame.id })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: `🎲 Número ${data.newNumber} llamado`,
          description: data.winners.length > 0 ? "¡Hay ganadores!" : `Total: ${data.totalCalled}/75`
        })
        loadActiveGame()
        onGameUpdate?.()
      } else {
        toast({
          title: "❌ Error",
          description: data.error || "Error llamando número",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error calling number:', error)
      toast({
        title: "❌ Error",
        description: "Error llamando número",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!activeGame) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Control del Juego</CardTitle>
          <CardDescription>No hay juegos activos o programados</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const isActive = gameStatus?.isActive || false
  const isFinished = gameStatus?.isFinished || false

  return (
    <div className="space-y-6">
      {/* Información del juego */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Control del Juego
            <Badge 
              variant={isActive ? "default" : isFinished ? "secondary" : "outline"}
              className={isActive ? "bg-green-500" : isFinished ? "bg-gray-500" : ""}
            >
              {isActive ? "EN VIVO" : isFinished ? "TERMINADO" : "ESPERANDO"}
            </Badge>
          </CardTitle>
          <CardDescription>{activeGame.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Jugadores</p>
              <p className="text-2xl font-bold text-blue-600">{gameStatus?.game?.totalPlayers || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cartones</p>
              <p className="text-2xl font-bold text-green-600">{gameStatus?.game?.totalCards || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Números Llamados</p>
              <p className="text-2xl font-bold text-orange-600">{gameStatus?.game?.calledNumbers?.length || 0}/75</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ganadores</p>
              <p className="text-2xl font-bold text-purple-600">{gameStatus?.game?.winners || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Número actual */}
      {isActive && gameStatus?.game?.currentNumber && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-bold mb-2">Número Actual</h3>
              <div className="text-6xl font-bold text-blue-600">
                {gameStatus.game.currentNumber}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controles del juego */}
      <Card>
        <CardHeader>
          <CardTitle>Controles del Juego</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isActive && !isFinished && (
            <Button 
              onClick={startGame}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? "Iniciando..." : "🚀 INICIAR JUEGO"}
            </Button>
          )}

          {isActive && (
            <Button 
              onClick={callNumber}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? "Llamando..." : "🎲 LLAMAR NÚMERO"}
            </Button>
          )}

          {isFinished && (
            <div className="text-center">
              <Badge className="bg-gray-500 text-white">
                🏆 Juego Terminado
              </Badge>
              <p className="text-sm text-gray-600 mt-2">
                El juego ha terminado. Los ganadores han sido notificados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Números llamados */}
      {gameStatus?.game?.calledNumbers && gameStatus.game.calledNumbers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Números Llamados ({gameStatus.game.calledNumbers.length}/75)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-2 max-h-40 overflow-y-auto">
              {Array.from({ length: 75 }, (_, i) => i + 1).map((number) => {
                const isCalled = gameStatus.game.calledNumbers.includes(number)
                return (
                  <div
                    key={number}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                      isCalled
                        ? "bg-primary text-primary-foreground scale-110"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {number}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
