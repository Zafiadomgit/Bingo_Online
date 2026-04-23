"use client"

import { useState, useEffect, useCallback } from "react"
import { checkBingoWin } from "@/lib/bingo-utils"
import type { BingoCard, BingoGame } from "@/lib/types"

interface Winner {
  id: string
  cardNumber: number
  userName: string
  winType: 'line' | 'two-lines' | 'full-card'
  prize: number
  timestamp: string
}

interface UseWinnerDetectionProps {
  game: BingoGame | null
  userCards: BingoCard[]
  onWinnerDetected?: (winner: Winner) => void
}

export function useWinnerDetection({ 
  game, 
  userCards, 
  onWinnerDetected 
}: UseWinnerDetectionProps) {
  const [winners, setWinners] = useState<Winner[]>([])
  const [isChecking, setIsChecking] = useState(false)

  const checkForWinners = useCallback(async () => {
    if (!game || !game.numbers_called || game.numbers_called.length === 0) {
      return
    }

    setIsChecking(true)

    try {
      const newWinners: Winner[] = []

      for (const card of userCards) {
        // Skip if card already won
        if (card.is_winner) continue

        // Check for different win types
        const winTypes = [
          { type: 'line' as const, prize: 100 },
          { type: 'two-lines' as const, prize: 500 },
          { type: 'full-card' as const, prize: 1000 }
        ]

        for (const { type, prize } of winTypes) {
          const hasWon = checkBingoWin(
            card.numbers,
            card.marked_positions,
            game.numbers_called,
            type
          )

          if (hasWon) {
            const winner: Winner = {
              id: `${card.id}-${type}-${Date.now()}`,
              cardNumber: card.card_number,
              userName: `Usuario ${card.user_id.slice(-4)}`, // Fallback name
              winType: type,
              prize,
              timestamp: new Date().toISOString()
            }

            newWinners.push(winner)
            
            // Call the callback if provided
            if (onWinnerDetected) {
              onWinnerDetected(winner)
            }

            // Mark card as winner
            card.is_winner = true
            break // Only one win type per card
          }
        }
      }

      if (newWinners.length > 0) {
        setWinners(prev => [...prev, ...newWinners])
      }
    } catch (error) {
      console.error('Error checking for winners:', error)
    } finally {
      setIsChecking(false)
    }
  }, [game, userCards, onWinnerDetected])

  // Check for winners whenever called numbers change
  useEffect(() => {
    if (game?.numbers_called && game.numbers_called.length > 0) {
      checkForWinners()
    }
  }, [game?.numbers_called, checkForWinners])

  const clearWinners = useCallback(() => {
    setWinners([])
  }, [])

  const getWinnersByType = useCallback((type: 'line' | 'two-lines' | 'full-card') => {
    return winners.filter(winner => winner.winType === type)
  }, [winners])

  const getTotalPrizePool = useCallback(() => {
    return winners.reduce((total, winner) => total + winner.prize, 0)
  }, [winners])

  return {
    winners,
    isChecking,
    checkForWinners,
    clearWinners,
    getWinnersByType,
    getTotalPrizePool
  }
}
