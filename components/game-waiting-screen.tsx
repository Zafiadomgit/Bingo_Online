"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface GameWaitingScreenProps {
  gameName: string
  waitingUntil: string
  onCountdownFinish: () => void
}

export function GameWaitingScreen({ 
  gameName, 
  waitingUntil,
  onCountdownFinish 
}: GameWaitingScreenProps) {
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(waitingUntil).getTime()
      const now = Date.now()
      const diff = Math.max(0, Math.floor((target - now) / 1000))
      
      setTimeLeft(diff)
      
      if (diff === 0) {
        onCountdownFinish()
      }
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [waitingUntil, onCountdownFinish])

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" 
         style={{background: 'linear-gradient(135deg, #121D40 0%, #143C8C 50%, #123273 100%)'}}>
      
      {/* Floating animated circles */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" style={{backgroundColor: '#F2E394'}}></div>
      <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" style={{backgroundColor: '#D9A13B'}}></div>
      <div className="absolute bottom-1/4 left-1/3 w-40 h-40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" style={{backgroundColor: '#F2E394'}}></div>

      <Card className="w-full max-w-2xl mx-4 shadow-2xl relative z-10 backdrop-blur-sm" 
            style={{backgroundColor: 'rgba(242, 227, 148, 0.95)', border: '4px solid #143C8C'}}>
        <CardHeader className="text-center pb-4 rounded-t-lg" style={{backgroundColor: '#143C8C'}}>
          <CardTitle className="text-4xl font-bold animate-pulse-slow" style={{color: '#F2E394'}}>
            🎮 {gameName}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-8 p-8">
          
          {/* Countdown */}
          <div className="relative">
            <div className="text-8xl font-extrabold animate-pulse" 
                 style={{color: '#143C8C', textShadow: '0 0 20px rgba(242, 227, 148, 0.5)'}}>
              {timeLeft}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-8 rounded-full animate-spin-slow" 
                   style={{borderColor: '#D9A13B', borderTopColor: 'transparent'}}></div>
            </div>
          </div>

          <div className="text-3xl font-bold uppercase tracking-wide" style={{color: '#121D40'}}>
            Segundos para comenzar
          </div>

          <div className="space-y-4">
            <div className="text-xl font-semibold" style={{color: '#143C8C'}}>
              ⏰ Prepara tus cartones
            </div>
            <div className="text-lg" style={{color: '#121D40'}}>
              El juego está por iniciar...
            </div>
          </div>
          
          {/* Animación de espera */}
          <div className="flex justify-center gap-3 pt-4">
            <div className="w-4 h-4 rounded-full animate-bounce" 
                 style={{backgroundColor: '#143C8C', animationDelay: '0s'}}></div>
            <div className="w-4 h-4 rounded-full animate-bounce" 
                 style={{backgroundColor: '#D9A13B', animationDelay: '0.2s'}}></div>
            <div className="w-4 h-4 rounded-full animate-bounce" 
                 style={{backgroundColor: '#F2E394', animationDelay: '0.4s'}}></div>
          </div>

          {/* Mensaje adicional */}
          <div className="mt-6 p-4 rounded-lg" style={{backgroundColor: 'rgba(20, 60, 140, 0.1)'}}>
            <p className="text-sm font-medium" style={{color: '#121D40'}}>
              💡 Mantén esta ventana abierta. El juego comenzará automáticamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
