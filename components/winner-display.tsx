"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Zap, Crown } from "lucide-react"
import { formatCurrencyWithSymbol } from "@/hooks/use-currency"

interface Winner {
  id: string
  cardNumber: number
  userName: string
  userEmail?: string
  winType: 'line' | 'two-lines' | 'full-card'
  prize: number
  currency?: string
  timestamp: string
}

interface WinnerDisplayProps {
  winners: Winner[]
  onClose?: () => void
}

export function WinnerDisplay({ winners, onClose }: WinnerDisplayProps) {
  const [currentWinner, setCurrentWinner] = useState<Winner | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (winners.length > 0) {
      const latestWinner = winners[winners.length - 1]
      setCurrentWinner(latestWinner)
      setShowCelebration(true)
      
      // Auto-hide celebration after 5 seconds
      const timer = setTimeout(() => {
        setShowCelebration(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [winners])

  const getWinTypeInfo = (winType: string) => {
    switch (winType) {
      case 'line':
        return {
          icon: <Star className="w-8 h-8 text-yellow-500" />,
          title: "¡UNA LÍNEA!",
          color: "from-yellow-400 to-yellow-500",
          borderColor: "border-yellow-400",
          emoji: "🎯"
        }
      case 'two-lines':
        return {
          icon: <Zap className="w-8 h-8 text-blue-500" />,
          title: "¡DOS LÍNEAS!",
          color: "from-blue-400 to-blue-500",
          borderColor: "border-blue-400",
          emoji: "⚡"
        }
      case 'full-card':
        return {
          icon: <Crown className="w-8 h-8 text-purple-500" />,
          title: "¡CARTÓN LLENO!",
          color: "from-purple-400 to-purple-500",
          borderColor: "border-purple-400",
          emoji: "👑"
        }
      default:
        return {
          icon: <Trophy className="w-8 h-8 text-green-500" />,
          title: "¡GANADOR!",
          color: "from-green-400 to-green-500",
          borderColor: "border-green-400",
          emoji: "🏆"
        }
    }
  }

  if (!currentWinner || !showCelebration) return null

  const winInfo = getWinTypeInfo(currentWinner.winType)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative">
        {/* Confetti Animation */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-4 h-4 rounded-full animate-confetti confetti-${i % 5}`}
            />
          ))}
        </div>

        {/* Winner Card */}
        <Card className={`bg-white/95 backdrop-blur-sm border-4 ${winInfo.borderColor} shadow-2xl transform animate-bounce-in max-w-md mx-4`}>
          <CardContent className="p-8 text-center">
            {/* Celebration Header */}
            <div className="mb-6">
              <div className="text-6xl mb-4 animate-bounce">
                {winInfo.emoji}
              </div>
              <h2 className={`text-4xl font-extrabold bg-gradient-to-r ${winInfo.color} bg-clip-text text-transparent mb-2 animate-pulse`}>
                {winInfo.title}
              </h2>
              <div className="text-2xl text-gray-700 font-bold">
                ¡FELICITACIONES!
              </div>
            </div>

            {/* Winner Info */}
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-6 rounded-xl mb-6">
              <div className="flex items-center justify-center mb-4">
                {winInfo.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {currentWinner.userName}
              </div>
              {currentWinner.userEmail && (
                <div className="text-sm text-gray-500 mb-2">
                  ✉️ {currentWinner.userEmail}
                </div>
              )}
              <div className="text-lg text-gray-700 mb-2">
                Cartón #{currentWinner.cardNumber}
              </div>
              <div className="text-3xl font-extrabold text-green-600">
                {formatCurrencyWithSymbol(currentWinner.prize, (currentWinner.currency || 'USD') as any)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-full font-bold text-lg shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                🎉 ¡GENIAL!
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Winner List Component
export function WinnerList({ winners }: { winners: Winner[] }) {
  if (winners.length === 0) return null

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-4 border-yellow-400 shadow-2xl">
      <CardContent className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          🏆 GANADORES DEL SORTEO 🏆
        </h3>
        <div className="space-y-3">
          {winners.map((winner, index) => {
            const winInfo = getWinTypeInfo(winner.winType)
            return (
              <div
                key={winner.id}
                className={`bg-gradient-to-r ${winInfo.color} p-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{winInfo.emoji}</div>
                    <div>
                      <div className="text-white font-bold text-lg">
                        {winner.userName}
                      </div>
                      <div className="text-white/90 text-sm">
                        Cartón #{winner.cardNumber} - {winInfo.title}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-extrabold text-xl">
                      {formatCurrencyWithSymbol(winner.prize, (winner.currency || 'USD') as any)}
                    </div>
                    <div className="text-white/80 text-sm">
                      #{index + 1}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function getWinTypeInfo(winType: string) {
  switch (winType) {
    case 'line':
      return {
        title: "UNA LÍNEA",
        color: "from-yellow-400 to-yellow-500",
        emoji: "🎯"
      }
    case 'two-lines':
      return {
        title: "DOS LÍNEAS",
        color: "from-blue-400 to-blue-500",
        emoji: "⚡"
      }
    case 'full-card':
      return {
        title: "CARTÓN LLENO",
        color: "from-purple-400 to-purple-500",
        emoji: "👑"
      }
    default:
      return {
        title: "GANADOR",
        color: "from-green-400 to-green-500",
        emoji: "🏆"
      }
  }
}
