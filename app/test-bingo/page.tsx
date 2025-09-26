"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Home } from "lucide-react"
import { BingoCard } from "@/components/bingo-card"
import { CalledNumbers } from "@/components/called-numbers"
import { GameStats } from "@/components/game-stats"
import { generateBingoCard, checkForWin, type BingoCard as BingoCardType } from "@/lib/bingo-utils"

// Mock data para pruebas
const mockGame = {
  id: "test-game-1",
  name: "Juego de Prueba",
  status: "active" as const,
  current_number: null,
  called_numbers: [] as number[],
  max_players: 50,
  card_price: 100,
  prize_pool: 5000,
  created_at: new Date().toISOString(),
  host_id: "test-host",
}

const mockUser = {
  id: "test-user",
  username: "Jugador de Prueba",
  balance: 1000,
}

export default function TestBingoPage() {
  const [game, setGame] = useState(mockGame)
  const [user] = useState(mockUser)
  const [userCards, setUserCards] = useState<BingoCardType[]>([])
  const [isGameActive, setIsGameActive] = useState(false)
  const [gameInterval, setGameInterval] = useState<NodeJS.Timeout | null>(null)
  const [winners, setWinners] = useState<string[]>([])

  console.log("[v0] Test Bingo Page loaded")
  console.log("[v0] Game state:", game)
  console.log("[v0] User cards:", userCards)

  // Función para comprar un cartón
  const buyCard = () => {
    console.log("[v0] Buying new card")
    const newCard = generateBingoCard()
    setUserCards((prev) => [...prev, newCard])
  }

  // Función para iniciar el juego
  const startGame = () => {
    console.log("[v0] Starting game")
    setIsGameActive(true)
    setWinners([])

    const interval = setInterval(() => {
      setGame((prevGame) => {
        const availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1).filter(
          (num) => !prevGame.called_numbers.includes(num),
        )

        if (availableNumbers.length === 0) {
          console.log("[v0] No more numbers available")
          return prevGame
        }

        const randomIndex = Math.floor(Math.random() * availableNumbers.length)
        const newNumber = availableNumbers[randomIndex]
        const newCalledNumbers = [...prevGame.called_numbers, newNumber]

        console.log("[v0] New number called:", newNumber)

        return {
          ...prevGame,
          current_number: newNumber,
          called_numbers: newCalledNumbers,
        }
      })
    }, 3000) // Nuevo número cada 3 segundos

    setGameInterval(interval)
  }

  // Función para pausar el juego
  const pauseGame = () => {
    console.log("[v0] Pausing game")
    setIsGameActive(false)
    if (gameInterval) {
      clearInterval(gameInterval)
      setGameInterval(null)
    }
  }

  // Función para reiniciar el juego
  const resetGame = () => {
    console.log("[v0] Resetting game")
    pauseGame()
    setGame({
      ...mockGame,
      current_number: null,
      called_numbers: [],
    })
    setWinners([])
  }

  // Verificar ganadores cuando cambian los números llamados
  useEffect(() => {
    if (game.called_numbers.length > 0) {
      userCards.forEach((card, index) => {
        if (checkForWin(card, game.called_numbers)) {
          const cardId = `card-${index}`
          if (!winners.includes(cardId)) {
            console.log("[v0] Winner found:", cardId)
            setWinners((prev) => [...prev, cardId])
            pauseGame()
          }
        }
      })
    }
  }, [game.called_numbers, userCards, winners])

  // Limpiar interval al desmontar
  useEffect(() => {
    return () => {
      if (gameInterval) {
        clearInterval(gameInterval)
      }
    }
  }, [gameInterval])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">🎯 Prueba de Bingo Online</h1>
            <p className="text-slate-600">Página de prueba para verificar la funcionalidad del juego</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Home className="h-4 w-4" />
              Inicio
            </Button>
          </Link>
        </div>

        {/* Game Info */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{game.name}</span>
              <Badge variant={isGameActive ? "default" : "secondary"}>{isGameActive ? "En Juego" : "Pausado"}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-sm text-slate-600">Número Actual</p>
                <p className="text-2xl font-bold text-blue-600">{game.current_number || "-"}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-600">Números Llamados</p>
                <p className="text-2xl font-bold text-slate-800">{game.called_numbers.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-600">Tus Cartones</p>
                <p className="text-2xl font-bold text-green-600">{userCards.length}</p>
              </div>
            </div>

            {/* Game Controls */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={buyCard} className="bg-green-600 hover:bg-green-700">
                Comprar Cartón (${game.card_price})
              </Button>

              {!isGameActive ? (
                <Button onClick={startGame} disabled={userCards.length === 0} className="bg-blue-600 hover:bg-blue-700">
                  Iniciar Juego
                </Button>
              ) : (
                <Button onClick={pauseGame} variant="outline">
                  Pausar Juego
                </Button>
              )}

              <Button onClick={resetGame} variant="outline">
                Reiniciar Juego
              </Button>
            </div>

            {/* Winners */}
            {winners.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
                <h3 className="font-bold text-yellow-800 mb-2">🎉 ¡Ganadores!</h3>
                <p className="text-yellow-700">Cartones ganadores: {winners.join(", ")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bingo Cards */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Tus Cartones ({userCards.length})</h2>

            {userCards.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                <CardContent className="text-center py-12">
                  <p className="text-slate-600 mb-4">No tienes cartones aún</p>
                  <Button onClick={buyCard} className="bg-green-600 hover:bg-green-700">
                    Comprar tu primer cartón
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userCards.map((card, index) => (
                  <div key={index} className="relative">
                    <BingoCard
                      card={card}
                      calledNumbers={game.called_numbers}
                      isWinner={winners.includes(`card-${index}`)}
                    />
                    {winners.includes(`card-${index}`) && (
                      <div className="absolute inset-0 bg-yellow-400/20 border-2 border-yellow-400 rounded-lg flex items-center justify-center">
                        <span className="text-2xl font-bold text-yellow-800">¡GANADOR!</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Called Numbers */}
            <CalledNumbers calledNumbers={game.called_numbers} currentNumber={game.current_number} />

            {/* Game Stats */}
            <GameStats totalPlayers={1} prizePool={game.prize_pool} gameStatus={isGameActive ? "active" : "waiting"} />

            {/* User Info */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Información del Jugador</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Usuario:</span>
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Balance:</span>
                    <span className="font-medium text-green-600">${user.balance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Cartones:</span>
                    <span className="font-medium">{userCards.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
