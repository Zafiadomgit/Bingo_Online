"use client"

import { useEffect, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'

export function useGameNotifications() {
  // useRef en lugar de useState para NO causar re-renders ni cascadas de useEffect
  const lastGameIdRef = useRef<string | null>(null)
  const isEnabledRef = useRef(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  const checkForNewGames = async () => {
    if (!isEnabledRef.current) return

    try {
      const response = await fetch('/api/games/next')
      const data = await response.json()

      if (data.success && data.nextGame) {
        const currentGameId = data.nextGame.id

        // Primera carga: solo guardar el ID sin mostrar toast
        if (lastGameIdRef.current === null) {
          lastGameIdRef.current = currentGameId
          return
        }

        // Nuevo juego detectado → mostrar notificación UNA sola vez
        if (currentGameId !== lastGameIdRef.current) {
          lastGameIdRef.current = currentGameId
          toast({
            title: "🎉 ¡Nuevo sorteo disponible!",
            description: `${data.nextGame.name} - ¡Ya puedes comprar cartones!`,
            duration: 10000,
          })
        }
      } else {
        // Ya no hay juegos activos
        lastGameIdRef.current = null
      }
    } catch (error) {
      console.error('Error checking for new games:', error)
    }
  }

  useEffect(() => {
    // Ejecutar una vez al montar y luego cada 30 segundos
    // Deps vacías [] → el intervalo NUNCA se resetea por cambios de estado
    checkForNewGames()
    intervalRef.current = setInterval(checkForNewGames, 30000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, []) // ← SIN dependencias: evita que el intervalo se reinicie en cada cambio

  const enableNotifications = () => { isEnabledRef.current = true }
  const disableNotifications = () => { isEnabledRef.current = false }

  return {
    isEnabled: isEnabledRef.current,
    enableNotifications,
    disableNotifications,
    checkForNewGames,
  }
}

