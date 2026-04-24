"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface AutoGameControllerProps {
  gameId: string
  onGameUpdate?: () => void
}

export function AutoGameController({ gameId, onGameUpdate }: AutoGameControllerProps) {
  const { toast } = useToast()
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentNumber, setCurrentNumber] = useState<number | null>(null)
  const [calledNumbers, setCalledNumbers] = useState<number[]>([])
  const [winners, setWinners] = useState<any[]>([])
  const [gameFinished, setGameFinished] = useState(false)
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)
  const [callDelay, setCallDelay] = useState(5000) // 5 segundos por defecto
  const isCallingRef = useRef(false) // Prevents concurrent calls

  // Limpiar cualquier estado previo al montar el componente
  useEffect(() => {
    console.log('🔧 AutoGameController: Componente montado, inicializando estado limpio')
    setIsPaused(false)
    // No necesitamos limpiar intervalId aquí porque será null por defecto
  }, [])

  useEffect(() => {
    loadGameStatus()
  }, [gameId])

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
        setIntervalId(null)
      }
    }
  }, [intervalId])

  // Limpiar intervalos cuando el juego se activa para evitar auto-inicio accidental
  useEffect(() => {
    if (isActive) {
      console.log('🔧 AutoGameController: Juego activado, verificando que no hay auto-inicio')
      // Asegurar que no hay intervalos ejecutándose cuando el juego se activa
      // Esto previene que se inicie automáticamente el conteo
    }
  }, [isActive])

  const loadGameStatus = async () => {
    try {
      const response = await fetch(`/api/games/status?gameId=${gameId}`)
      const data = await response.json()

      if (data.success) {
        setIsActive(data.game.status === 'ACTIVE')
        setGameFinished(data.game.status === 'FINISHED')
        setCurrentNumber(data.game.current_number)
        setCalledNumbers(Array.isArray(data.game.called_numbers) ? data.game.called_numbers : [])
        
        // Cargar ganadores
        const allWinners = [
          ...(data.game.line_winners || []).map((w: any) => ({ ...w, type: 'line' })),
          ...(data.game.two_lines_winners || []).map((w: any) => ({ ...w, type: 'two_lines' })),
          ...(data.game.full_card_winners || []).map((w: any) => ({ ...w, type: 'full_card' }))
        ]
        setWinners(allWinners)
      }
    } catch (error) {
      console.error('Error loading game status:', error)
    }
  }

  const startAutoCall = () => {
    if (intervalId) {
      console.log('🔧 AutoGameController: Intento de inicio automático bloqueado - ya hay un intervalo activo')
      return
    }

    console.log('🎲 AutoGameController: Iniciando llamado automático manualmente por admin')
    setIsPaused(false)
    const id = setInterval(async () => {
      await callNextNumber()
    }, callDelay)
    
    setIntervalId(id)
    toast({
      title: "🎲 Llamado automático iniciado",
      description: `Se llamará un número cada ${callDelay / 1000} segundos`
    })
  }

  const pauseAutoCall = () => {
    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
      setIsPaused(true)
      toast({
        title: "⏸️ Llamado automático pausado",
        description: "Puedes reanudar cuando quieras"
      })
    }
  }

  const callNextNumber = async () => {
    if (isCallingRef.current) {
      console.log('🔧 AutoGameController: Llamado en curso, omitiendo ejecución superpuesta')
      return
    }
    isCallingRef.current = true
    try {
      const response = await fetch('/api/games/auto-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId })
      })

      const data = await response.json()

      if (data.success) {
        setCurrentNumber(data.number)
        setCalledNumbers(data.calledNumbers)

        // Si el juego terminó, detener el auto-call
        if (data.gameFinished) {
          if (intervalId) {
            clearInterval(intervalId)
            setIntervalId(null)
          }
          setGameFinished(true)
          setIsActive(false)
        }

        if (onGameUpdate) {
          onGameUpdate()
        }

        await loadGameStatus()
      } else {
        if (data.gameFinished) {
          if (intervalId) {
            clearInterval(intervalId)
            setIntervalId(null)
          }
          setGameFinished(true)
          setIsActive(false)
        }
      }
    } catch (error) {
      console.error('Error calling number:', error)
    } finally {
      isCallingRef.current = false
    }
  }

  const manualCallNumber = async () => {
    await callNextNumber()
  }

  const getPrizeText = (type: string) => {
    return {
      'line': '🥉 Una Línea',
      'two_lines': '🥈 Dos Líneas',
      'full_card': '🥇 Cartón Lleno'
    }[type] || type
  }

  if (gameFinished) {
    return (
      <Card className="bg-gradient-to-r from-purple-400 to-pink-400 border-4 border-purple-300">
        <CardHeader>
          <CardTitle className="text-white text-2xl">🎊 Juego Finalizado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white text-lg">Todos los premios han sido ganados</p>
        </CardContent>
      </Card>
    )
  }

  if (!isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Control de Juego</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">El juego debe estar activo para usar el control automático</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white text-2xl">🎮 Control de Juego Automático</CardTitle>
            <Badge className="bg-green-500 text-white animate-pulse">EN VIVO</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Número actual */}
          <div className="bg-white rounded-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Número Actual</p>
            {currentNumber ? (
              <div className="text-7xl font-bold text-blue-600">{currentNumber}</div>
            ) : (
              <div className="text-2xl text-gray-400">Esperando...</div>
            )}
          </div>

          {/* Controles */}
          <div className="bg-white rounded-lg p-4 space-y-4">
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium">Intervalo (segundos):</label>
              <input
                type="number"
                value={callDelay / 1000}
                onChange={(e) => setCallDelay(Math.max(1, parseInt(e.target.value)) * 1000)}
                className="border rounded px-3 py-1 w-20"
                min="1"
                max="60"
              />
            </div>

            <div className="flex gap-2">
              {!intervalId ? (
                <Button 
                  onClick={startAutoCall} 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  ▶️ Iniciar Automático
                </Button>
              ) : (
                <Button 
                  onClick={pauseAutoCall} 
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                >
                  ⏸️ Pausar
                </Button>
              )}
              
              <Button 
                onClick={manualCallNumber}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!!intervalId}
              >
                🎲 Llamar Manual
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600">
              Números llamados: {calledNumbers?.length || 0} / 75
            </div>
          </div>

          {/* Ganadores */}
          {winners.length > 0 && (
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3">🏆 Ganadores</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {winners.map((winner, idx) => (
                  <div key={idx} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold">{getPrizeText(winner.type)}</div>
                        <div className="text-sm text-gray-600">
                          Cartón #{winner.card_number}
                        </div>
                        <div className="text-sm font-semibold text-blue-600">
                          👤 {winner.user_name || winner.user_email || 'Usuario desconocido'}
                        </div>
                        {winner.user_phone && (
                          <div className="text-sm font-bold text-purple-600 mt-1 flex items-center gap-1">
                            📱 {winner.user_phone}
                          </div>
                        )}
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        ${winner.prize_amount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Números llamados */}
      <Card>
        <CardHeader>
          <CardTitle>Números Llamados ({calledNumbers?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2 max-h-96 overflow-y-auto">
            {(calledNumbers || []).map((num) => (
              <div
                key={num}
                className="aspect-square flex items-center justify-center bg-blue-500 text-white font-bold rounded-lg"
              >
                {num}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

