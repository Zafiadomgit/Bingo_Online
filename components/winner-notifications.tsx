"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrencyWithSymbol } from "@/hooks/use-currency"

interface WinnerNotification {
  id: string
  game_name: string
  prize_type: string
  prize_amount: number
  card_number: number
  currency: string
  won_at: string
}

interface WinnerNotificationsProps {
  userEmail: string
}

export function WinnerNotifications({ userEmail }: WinnerNotificationsProps) {
  const [notifications, setNotifications] = useState<WinnerNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (userEmail) loadNotifications()
    // Revisar cada 30 segundos por si gana mientras está en el dashboard
    const interval = setInterval(() => { if (userEmail) loadNotifications() }, 30000)
    return () => clearInterval(interval)
  }, [userEmail])

  const loadNotifications = async () => {
    try {
      const res = await fetch(`/api/user/winner-notifications?email=${encodeURIComponent(userEmail)}`)
      const data = await res.json()
      if (data.success) setNotifications(data.notifications || [])
    } catch (e) {
      console.error('Error loading winner notifications:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const dismiss = async (id: string) => {
    try {
      await fetch(`/api/user/winner-notifications?id=${id}`, { method: 'DELETE' })
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (e) {
      console.error('Error dismissing notification:', e)
    }
  }

  const getPrizeLabel = (type: string) => ({
    'line': '🥉 Una Línea',
    'two_lines': '🥈 Dos Líneas',
    'full_card': '🥇 Cartón Lleno'
  }[type] || type)

  if (isLoading || notifications.length === 0) return null

  return (
    <div className="space-y-2 mb-4 w-full max-w-md mx-auto">
      {notifications.map(n => (
        <Card key={n.id} className="bg-gradient-to-r from-yellow-500 to-orange-500 border border-yellow-400 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">🎉</span>
                  <h3 className="text-sm font-bold text-white tracking-wide">¡GANASTE UN PREMIO!</h3>
                </div>
                
                <div className="flex justify-between items-end mt-1">
                  <div>
                    <p className="text-white font-semibold text-sm">{getPrizeLabel(n.prize_type)}</p>
                    <p className="text-white/90 text-xs mt-0.5">
                      Sorteo: {n.game_name} • Cartón: #{n.card_number}
                    </p>
                  </div>
                  
                  <div className="bg-white/20 rounded px-2 py-1 ml-2">
                    <span className="text-white font-bold text-sm">
                      {formatCurrencyWithSymbol(n.prize_amount, n.currency as any)}
                    </span>
                  </div>
                </div>
                <p className="text-white/90 text-xs mt-2 font-medium">
                  📞 Contacta al 04121980898 para reclamar tu premio
                </p>
              </div>
              
              <Button
                onClick={() => dismiss(n.id)}
                variant="ghost"
                className="h-6 w-6 p-0 text-white hover:bg-white/20 hover:text-white shrink-0 rounded-full"
                aria-label="Descartar"
              >
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

