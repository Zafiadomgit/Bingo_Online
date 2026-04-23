"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

export function AutoGameRedirect() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) return

    const checkAutoRedirect = async () => {
      try {
        const res = await fetch(`/api/admin/game-notifications?userId=${user.id}&type=game_auto_started_redirect&is_read=false&limit=1`)
        const data = await res.json()

        if (data.success && data.notifications?.length > 0) {
          const notification = data.notifications[0]
          const metadata = typeof notification.metadata === 'string'
            ? JSON.parse(notification.metadata)
            : notification.metadata

          const redirectUrl = metadata?.redirect_url
          if (redirectUrl) {
            await fetch(`/api/admin/game-notifications?id=${notification.id}`, { method: 'PATCH' })
            window.open(redirectUrl, '_blank')
          }
        }
      } catch (error) {
        console.error('[AutoRedirect] Error:', error)
      }
    }

    checkAutoRedirect()
    const interval = setInterval(checkAutoRedirect, 5000)
    return () => clearInterval(interval)
  }, [user, router])

  return null
}
