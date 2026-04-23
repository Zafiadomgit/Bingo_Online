"use client"

import { Button } from "@/components/ui/button"

interface GameViewButtonsProps {
  gameId: string
  gameName: string
}

export function GameViewButtons({ gameId, gameName }: GameViewButtonsProps) {
  const handleViewGame = () => {
    window.open(`/game/live?gameId=${gameId}`, '_blank')
  }

  const handleViewAdmin = () => {
    window.open(`/game/live?gameId=${gameId}&admin=true`, '_blank')
  }

  return (
    <div className="flex gap-2 justify-end mt-2">
      <Button
        onClick={handleViewGame}
        size="sm"
        variant="outline"
        className="text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800 font-bold"
      >
        🎮 Ver Juego
      </Button>
      <Button
        onClick={handleViewAdmin}
        size="sm"
        variant="outline"
        className="text-purple-700 border-purple-200 hover:bg-purple-50 hover:text-purple-800 font-bold"
      >
        👁️ Admin
      </Button>
    </div>
  )
}
