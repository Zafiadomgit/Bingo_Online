"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Trophy } from "lucide-react"
import { useCurrencyConverter } from "@/hooks/use-currency-converter"
import { CurrencySelector } from "@/components/currency-selector"

interface PrizePoolDisplayProps {
  gameId: string
  showForClient?: boolean // Si es true, muestra versión simplificada para clientes
}

export function PrizePoolDisplay({ gameId, showForClient = false }: PrizePoolDisplayProps) {
  const [poolData, setPoolData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { displayCurrency, changeDisplayCurrency, convertAndFormat } = useCurrencyConverter()

  useEffect(() => {
    loadPoolData()
    // Actualizar cada 10 segundos
    const interval = setInterval(loadPoolData, 10000)
    return () => clearInterval(interval)
  }, [gameId])

  const loadPoolData = async () => {
    try {
      const response = await fetch(`/api/games/calculate-prizes?gameId=${gameId}`)
      const data = await response.json()
      
      if (data.success) {
        setPoolData(data)
        setError(null)
      } else {
        setError(data.error || 'Error cargando el pozo')
      }
    } catch (err) {
      console.error('Error loading pool data:', err)
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-4 border-yellow-400 shadow-2xl">
        <CardContent className="p-6">
          <div className="animate-pulse text-center">
            <div className="h-6 bg-yellow-200 rounded w-1/2 mx-auto mb-4"></div>
            <div className="h-8 bg-yellow-200 rounded w-3/4 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !poolData) {
    return (
      <Card className="bg-red-50 border-2 border-red-300">
        <CardContent className="p-4">
          <p className="text-red-600 text-center">{error || 'No hay información del pozo'}</p>
        </CardContent>
      </Card>
    )
  }

  const { game, prizes } = poolData

  // Si no usa porcentajes, no mostrar este componente (o podrías mostrar los premios fijos)
  if (!game.usePercentagePrizes) {
    return null
  }

  if (showForClient) {
    // Versión simplificada para clientes
    return (
      <Card className="bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 border-4 border-yellow-400 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-300 rounded-full -mr-16 -mt-16 opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-300 rounded-full -ml-12 -mb-12 opacity-20"></div>
        
        <CardHeader className="pb-3 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="text-2xl font-black flex items-center gap-2 text-orange-800">
              <TrendingUp className="w-7 h-7 animate-pulse" />
              POZO ACUMULADO
            </CardTitle>
            <Badge className="bg-green-500 text-white text-sm px-3 py-1 animate-bounce">
              ¡EN VIVO!
            </Badge>
          </div>
          <CurrencySelector 
            value={displayCurrency} 
            onChange={changeDisplayCurrency}
            className="justify-center"
          />
        </CardHeader>
        
        <CardContent className="space-y-4 relative z-10">
          {/* Total Acumulado */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg transform hover:scale-105 transition-all">
            <div className="text-sm font-semibold opacity-90 mb-1">💰 Total Recaudado</div>
            <div className="text-4xl font-black">{convertAndFormat(game.totalRevenue, game.currency)}</div>
            <div className="text-sm opacity-75 mt-1">{game.cardsSold} cartones vendidos</div>
          </div>

          {/* Premios Calculados */}
          <div className="space-y-3">
            <div className="text-center font-bold text-orange-800 text-lg">
              🏆 Premios Actuales
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {/* Premio Cartón Lleno */}
              <div className="bg-gradient-to-r from-red-100 to-red-200 rounded-lg p-4 border-2 border-red-300">
                <div className="font-bold text-red-800 text-lg mb-2">🥇 Cartón Lleno</div>
                <div className="text-center bg-white/60 rounded-lg p-2">
                  <div className="text-2xl font-black text-red-700">
                    {convertAndFormat(prizes.fullCard, game.currency)}
                  </div>
                </div>
              </div>

              {/* Premio Dos Líneas */}
              <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg p-4 border-2 border-yellow-300">
                <div className="font-bold text-yellow-800 text-lg mb-2">🥈 Dos Líneas</div>
                <div className="text-center bg-white/60 rounded-lg p-2">
                  <div className="text-2xl font-black text-yellow-700">
                    {convertAndFormat(prizes.twoLines, game.currency)}
                  </div>
                </div>
              </div>

              {/* Premio Línea */}
              <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-lg p-4 border-2 border-green-300">
                <div className="font-bold text-green-800 text-lg mb-2">🥉 Una Línea</div>
                <div className="text-center bg-white/60 rounded-lg p-2">
                  <div className="text-2xl font-black text-green-700">
                    {convertAndFormat(prizes.line, game.currency)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nota informativa */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 text-center">
            <p className="text-sm text-blue-800">
              💡 Los premios aumentan con cada cartón vendido
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Versión completa para admin
  return (
    <Card className="bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 border-4 border-yellow-400 shadow-2xl">
      <CardHeader className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <CardTitle className="text-2xl sm:text-3xl font-black flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            POZO - {game.name}
          </CardTitle>
        </div>
        <CurrencySelector 
          value={displayCurrency} 
          onChange={changeDisplayCurrency}
        />
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Estadísticas Generales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
            <div className="text-sm font-semibold text-blue-600 mb-1">Cartones Vendidos</div>
            <div className="text-2xl sm:text-3xl font-black text-blue-800">{game.cardsSold}</div>
          </div>
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
            <div className="text-sm font-semibold text-green-600 mb-1">Total Recaudado</div>
            <div className="text-2xl sm:text-3xl font-black text-green-800">{convertAndFormat(game.totalRevenue, game.currency)}</div>
          </div>
        </div>

        {/* Premios Detallados */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-orange-800">Premios Calculados:</h3>
          
          <div className="bg-gradient-to-r from-red-100 to-red-200 rounded-xl p-5 border-2 border-red-300">
            <div className="font-bold text-red-800 text-lg mb-3 flex items-center gap-2">
              <span>🥇</span> Cartón Lleno
            </div>
            <div className="text-center bg-white/80 rounded-lg p-3">
              <div className="text-3xl font-black text-red-700">
                {convertAndFormat(prizes.fullCard, game.currency)}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl p-5 border-2 border-yellow-300">
            <div className="font-bold text-yellow-800 text-lg mb-3 flex items-center gap-2">
              <span>🥈</span> Dos Líneas
            </div>
            <div className="text-center bg-white/80 rounded-lg p-3">
              <div className="text-3xl font-black text-yellow-700">
                {convertAndFormat(prizes.twoLines, game.currency)}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-xl p-5 border-2 border-green-300">
            <div className="font-bold text-green-800 text-lg mb-3 flex items-center gap-2">
              <span>🥉</span> Una Línea
            </div>
            <div className="text-center bg-white/80 rounded-lg p-3">
              <div className="text-3xl font-black text-green-700">
                {convertAndFormat(prizes.line, game.currency)}
              </div>
            </div>
          </div>
        </div>

        {/* Total en Premios */}
        <div className="bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl p-4 border-2 border-purple-300">
          <div className="flex items-center justify-between">
            <div className="font-bold text-purple-800 text-lg">Total en Premios:</div>
            <div className="text-2xl font-black text-purple-700">
              {convertAndFormat(prizes.line + prizes.twoLines + prizes.fullCard, game.currency)}
            </div>
          </div>
        </div>

        {/* Ganancia de la Banca */}
        <div className="bg-gradient-to-r from-emerald-100 to-green-200 rounded-xl p-5 border-4 border-emerald-400 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl">💰</span>
              <div className="font-black text-emerald-800 text-xl">GANANCIA DE LA BANCA</div>
            </div>
          </div>
          <div className="text-center bg-white/80 rounded-lg p-4 mb-2">
            <div className="text-4xl font-black text-emerald-700">
              {convertAndFormat(game.totalRevenue - (prizes.line + prizes.twoLines + prizes.fullCard), game.currency)}
            </div>
          </div>
          <div className="bg-white/60 rounded-lg p-3 mt-3">
            <div className="text-xs text-emerald-700 space-y-1">
              <div className="flex justify-between">
                <span>Total Recaudado:</span>
                <span className="font-bold">{convertAndFormat(game.totalRevenue, game.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>- Total Premios:</span>
                <span className="font-bold">-{convertAndFormat(prizes.line + prizes.twoLines + prizes.fullCard, game.currency)}</span>
              </div>
              <div className="border-t border-emerald-300 pt-1 mt-1"></div>
              <div className="flex justify-between font-bold text-sm">
                <span>= Ganancia Neta:</span>
                <span className="text-emerald-800">{convertAndFormat(game.totalRevenue - (prizes.line + prizes.twoLines + prizes.fullCard), game.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
