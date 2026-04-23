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
    <div className="space-y-3 mb-6">
      {notifications.map(n => (
        <Card key={n.id} className="bg-gradient-to-r from-yellow-400 to-orange-400 border-4 border-yellow-300 shadow-2xl">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🎉</span>
                  <h3 className="text-xl font-black text-white">¡GANASTE UN PREMIO!</h3>
                </div>
                <p className="text-white font-bold text-lg">{getPrizeLabel(n.prize_type)}</p>
                <p className="text-white/90 text-sm mt-1">
                  Sorteo: <span className="font-semibold">{n.game_name}</span>
                </p>
                <p className="text-white/90 text-sm">
                  Cartón: <span className="font-semibold">#{n.card_number}</span>
                </p>
                <div className="mt-2 bg-white/20 rounded-lg px-3 py-2 inline-block">
                  <span className="text-white font-black text-2xl">
                    {formatCurrencyWithSymbol(n.prize_amount, n.currency as any)}
                  </span>
                </div>
                <p className="text-white/80 text-xs mt-2">
                  📞 Contacta al administrador para reclamar tu premio
                </p>
              </div>
              <Button
                onClick={() => dismiss(n.id)}
                variant="ghost"
                className="text-white hover:bg-white/20 hover:text-white font-bold px-3 py-1 rounded-full text-sm shrink-0"
              >
                ✕ Descartar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
