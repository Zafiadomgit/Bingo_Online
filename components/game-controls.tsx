"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { BingoGame } from "@/lib/types"

interface GameControlsProps {
  game: BingoGame
  onGameUpdate: () => void
  isAdmin?: boolean
}

export function GameControls({ game, onGameUpdate, isAdmin = false }: GameControlsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleStartGame = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "¡Juego iniciado!",
          description: "El juego de bingo ha comenzado",
        })
        onGameUpdate()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Start game error:", error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrawNumber = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/game/draw-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Nuevo número!",
          description: `Salió el número ${data.number}`,
        })
        onGameUpdate()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Draw number error:", error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetGame = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/game/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Juego reiniciado",
          description: "El juego ha sido reiniciado y está listo para nuevos cartones",
        })
        onGameUpdate()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Reset game error:", error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {game.status === "waiting" && (
        <Button onClick={handleStartGame} disabled={isLoading}>
          {isLoading ? "Iniciando..." : "Iniciar Juego"}
        </Button>
      )}

      {game.status === "active" && (
        <Button onClick={handleDrawNumber} disabled={isLoading}>
          {isLoading ? "Sorteando..." : "Sortear Número"}
        </Button>
      )}

      {game.status === "finished" && (
        <Button onClick={handleResetGame} disabled={isLoading} variant="outline">
          {isLoading ? "Reiniciando..." : "Reiniciar Juego"}
        </Button>
      )}
    </div>
  )
}
