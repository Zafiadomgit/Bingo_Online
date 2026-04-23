"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Calendar, Clock, X } from "lucide-react"

interface GameNotification {
  id: number
  game_id: string
  user_email: string
  notification_type: string
  message: string
  scheduled_at: string
  is_read: boolean
  created_at: string
  read_at?: string
}

interface GameNotificationsProps {
  userEmail: string
}

export function GameNotifications({ userEmail }: GameNotificationsProps) {
  const [notifications, setNotifications] = useState<GameNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [userEmail])

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/game-notifications?email=${encodeURIComponent(userEmail)}`)
      const data = await response.json()
      
      if (data.success) {
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch('/api/game-notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      })

      const data = await response.json()
      
      if (data.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true, read_at: new Date().toISOString() }
              : notif
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600 animate-pulse" />
            <span className="text-blue-600 font-medium">Cargando notificaciones...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (notifications.length === 0) {
    return null
  }

  // Función para obtener el estilo según el tipo de notificación
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'winner_full_card':
        return {
          bg: 'bg-gradient-to-r from-yellow-100 to-yellow-200',
          border: 'border-yellow-400',
          icon: '🥇',
          titleColor: 'text-yellow-900'
        }
      case 'winner_two_lines':
        return {
          bg: 'bg-gradient-to-r from-gray-100 to-gray-200',
          border: 'border-gray-400',
          icon: '🥈',
          titleColor: 'text-gray-900'
        }
      case 'winner_line':
        return {
          bg: 'bg-gradient-to-r from-orange-100 to-orange-200',
          border: 'border-orange-400',
          icon: '🥉',
          titleColor: 'text-orange-900'
        }
      default:
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-300',
          icon: '🔔',
          titleColor: 'text-blue-900'
        }
    }
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Bell className="w-6 h-6 animate-pulse" />
          Notificaciones del Juego
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2 animate-bounce">
              {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.slice(0, 5).map((notification) => {
          const style = getNotificationStyle(notification.notification_type)
          const isWinner = notification.notification_type.startsWith('winner_')
          
          return (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                notification.is_read 
                  ? 'bg-white/50 border-gray-200 opacity-70' 
                  : `${style.bg} ${style.border} shadow-lg ${isWinner ? 'animate-pulse' : ''}`
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {isWinner && !notification.is_read && (
                    <div className="text-3xl mb-2 animate-bounce">{style.icon}</div>
                  )}
                  <p className={`text-sm font-bold ${style.titleColor} mb-1`}>
                    {notification.message}
                  </p>
                  {notification.scheduled_at && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 mt-2">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(notification.scheduled_at).toLocaleString('es-CO', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                          hour12: true
                        })}
                      </span>
                    </div>
                  )}
                </div>
                {!notification.is_read && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markAsRead(notification.id)}
                    className="h-7 w-7 p-0 hover:bg-red-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}
        
        {notifications.length > 5 && (
          <div className="text-center pt-2">
            <Button variant="outline" size="sm" className="text-blue-600 hover:bg-blue-100">
              Ver todas ({notifications.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
