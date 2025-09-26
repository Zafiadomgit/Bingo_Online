"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { BingoGame } from "@/lib/types"

interface PurchaseCardButtonProps {
  game: BingoGame
  userCredits: number
  cardCount: number
  onPurchaseSuccess: () => void
}

export function PurchaseCardButton({ game, userCredits, cardCount, onPurchaseSuccess }: PurchaseCardButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const canPurchase = game.status === "waiting" && userCredits >= game.card_price && cardCount < game.max_cards

  const handlePurchase = async () => {
    if (!canPurchase) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/purchase-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gameId: game.id }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "¡Cartón comprado!",
          description: `Has comprado el cartón #${data.card.card_number}`,
        })
        onPurchaseSuccess()
      } else {
        toast({
          title: "Error",
          description: data.error || "No se pudo comprar el cartón",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Purchase error:", error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonText = () => {
    if (game.status !== "waiting") return "Juego iniciado"
    if (userCredits < game.card_price) return "Créditos insuficientes"
    if (cardCount >= game.max_cards) return "Sin cartones disponibles"
    return `Comprar cartón (${game.card_price} créditos)`
  }

  return (
    <Button onClick={handlePurchase} disabled={!canPurchase || isLoading} className="w-full">
      {isLoading ? "Comprando..." : getButtonText()}
    </Button>
  )
}
