"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Play, Pause, Trash2, Bell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ScheduledGame {
  id: string
  name: string
  scheduled_at: string
  auto_start: boolean
  start_delay_minutes: number
  status: string
  timeRemaining: number
  isOverdue: boolean
}

interface ScheduledGamesProps {
  onGameSelect?: (game: ScheduledGame) => void
  onScheduleNew?: () => void
}

export function ScheduledGames({ onGameSelect, onScheduleNew }: ScheduledGamesProps) {
  const [scheduledGames, setScheduledGames] = useState<ScheduledGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadScheduledGames()
    // Actualizar cada minuto
    const interval = setInterval(loadScheduledGames, 60000)
    return () => clearInterval(interval)
  }, [])

  // Forzar recarga cuando el componente se monta
  useEffect(() => {
    // Limpiar cache y recargar inmediatamente
    const forceReload = () => {
      setScheduledGames([]) // Limpiar estado
      setTimeout(() => {
        loadScheduledGames() // Recargar después de limpiar
      }, 100)
    }
    
    forceReload()
  }, [])

  const loadScheduledGames = async () => {
    try {
      console.log('🔄 Cargando juegos programados...')
      // Agregar timestamp para evitar cache
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/games/scheduled?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()
      
      console.log('📡 Respuesta de juegos programados:', data)
      
      if (data.success) {
        console.log(`✅ ${data.games.length} juegos cargados`)
        setScheduledGames(data.games)
      } else {
        console.error('❌ Error cargando juegos:', data.error)
        toast({
          title: "Error",
          description: "Error cargando los juegos programados",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('❌ Error de conexión cargando juegos:', error)
      toast({
        title: "Error",
        description: "Error de conexión al cargar los juegos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const cancelSchedule = async (gameId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este sorteo? Esta acción no se puede deshacer.')) {
      return
    }

    console.log('🗑️ Intentando eliminar juego:', gameId)

    try {
      // Primero intentar con el endpoint normal
      const response = await fetch('/api/games', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId }),
      })

      const data = await response.json()
      console.log('📡 Respuesta del servidor:', data)

      if (data.success) {
        toast({
          title: "✅ Sorteo Eliminado",
          description: "El sorteo ha sido eliminado exitosamente",
        })
        loadScheduledGames()
      } else {
        console.error('❌ Error del servidor:', data.error)
        
        // Si el endpoint normal falla, intentar con el endpoint de debug
        if (data.error === 'Juego no encontrado' || response.status === 404) {
          console.log('🔄 Intentando eliminación forzada con endpoint de debug...')
          
          try {
            const debugResponse = await fetch('/api/debug/delete-game', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ gameId }),
            })

            const debugData = await debugResponse.json()
            console.log('📡 Respuesta del debug:', debugData)

            if (debugData.success) {
              toast({
                title: "✅ Sorteo Eliminado (Forzado)",
                description: "El sorteo ha sido eliminado usando método alternativo",
              })
              loadScheduledGames()
            } else {
              toast({
                title: "Juego ya eliminado",
                description: "Este juego ya no existe, actualizando la lista",
              })
              loadScheduledGames()
            }
          } catch (debugError) {
            console.error('❌ Error en eliminación forzada:', debugError)
            toast({
              title: "Juego ya eliminado",
              description: "Este juego ya no existe, actualizando la lista",
            })
            loadScheduledGames()
          }
        } else {
          toast({
            title: "Error",
            description: data.error || "Error eliminando el sorteo",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error)
      toast({
        title: "Error",
        description: "Error de conexión al eliminar el sorteo",
        variant: "destructive",
      })
    }
  }

  const formatTimeRemaining = (timeRemaining: number) => {
    if (timeRemaining <= 0) return "¡Ya debería haber empezado!"
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getStatusColor = (game: ScheduledGame) => {
    if (game.isOverdue) return "bg-red-500"
    if (game.timeRemaining < 300000) return "bg-yellow-500" // 5 minutos
    return "bg-green-500"
  }

  if (isLoading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-4 border-blue-400 shadow-2xl">
        <CardContent className="p-8 text-center">
          <div className="text-2xl font-bold text-gray-700 animate-pulse">
            🎯 Cargando sorteos programados...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-white drop-shadow-lg">
          📅 SORTEOS PROGRAMADOS
        </h2>
        <Button
          onClick={onScheduleNew}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 text-lg font-bold rounded-full shadow-2xl transform hover:scale-110 transition-all duration-300 animate-pulse"
        >
          ➕ PROGRAMAR NUEVO
        </Button>
      </div>

      {scheduledGames.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm border-4 border-gray-400 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">📅</div>
            <div className="text-2xl font-bold text-gray-700 mb-2">
              No hay sorteos programados
            </div>
            <div className="text-gray-600 mb-6">
              Programa un sorteo para comenzar
            </div>
            <Button
              onClick={onScheduleNew}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-4 text-xl font-bold rounded-full shadow-2xl transform hover:scale-110 transition-all duration-300"
            >
              🎯 ¡PROGRAMAR PRIMER SORTEO!
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scheduledGames.map((game) => (
            <Card
              key={game.id}
              className="bg-white/90 backdrop-blur-sm border-4 border-blue-400 shadow-2xl transform hover:scale-105 transition-all duration-300 animate-fade-in"
            >
              <CardHeader className="bg-blue-400 text-white p-6 rounded-t-lg">
                <CardTitle className="text-xl font-bold text-center">
                  🎯 {game.name}
                </CardTitle>
                <CardDescription className="text-center text-gray-800">
                  Sorteo Programado
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">

                  {/* Tiempo Restante */}
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-bold text-gray-900">
                        Tiempo Restante
                      </div>
                      <Badge 
                        className={`text-white ${getStatusColor(game)}`}
                      >
                        {formatTimeRemaining(game.timeRemaining)}
                      </Badge>
                    </div>
                  </div>

                  {/* Configuración */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {game.auto_start ? (
                        <Play className="w-4 h-4 text-green-600" />
                      ) : (
                        <Pause className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className="text-sm text-gray-700">
                        {game.auto_start ? 'Inicio Automático' : 'Inicio Manual'}
                      </span>
                    </div>
                    
                    {game.start_delay_minutes > 0 && (
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-700">
                          Retraso: {game.start_delay_minutes} min
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onGameSelect?.(game)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 text-sm font-bold rounded-full shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      👁️ VER
                    </Button>
                    <Button
                      onClick={() => cancelSchedule(game.id)}
                      variant="outline"
                      className="flex-shrink-0 border-2 border-red-400 text-red-600 hover:bg-red-50 px-4 py-2 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      🗑️ Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
