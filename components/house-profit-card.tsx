"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, DollarSign, Percent } from "lucide-react"
import { useCurrencyConverter } from "@/hooks/use-currency-converter"
import { CurrencySelector } from "@/components/currency-selector"

export function HouseProfitCard() {
  const [profitData, setProfitData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { displayCurrency, changeDisplayCurrency, convertAndFormat } = useCurrencyConverter()

  useEffect(() => {
    loadProfitData()
    // Actualizar cada 15 segundos
    const interval = setInterval(loadProfitData, 15000)
    return () => clearInterval(interval)
  }, [])

  const loadProfitData = async () => {
    try {
      const response = await fetch('/api/admin/house-profit')
      const data = await response.json()
      
      if (data.success) {
        setProfitData(data)
      }
    } catch (err) {
      console.error('Error loading profit data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="backdrop-blur-sm shadow-2xl" style={{backgroundColor: 'rgba(16, 185, 129, 0.9)', border: '4px solid #059669'}}>
        <CardContent className="p-6">
          <div className="animate-pulse text-center">
            <div className="h-6 bg-emerald-200 rounded w-1/2 mx-auto mb-4"></div>
            <div className="h-8 bg-emerald-200 rounded w-3/4 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profitData) {
    return null
  }

  const { byCurrency, summary, gameId, gameName, currency } = profitData

  return (
    <Card className="backdrop-blur-sm shadow-2xl transform hover:scale-105 transition-all duration-300 animate-fade-in" style={{backgroundColor: 'rgba(16, 185, 129, 0.9)', border: '4px solid #059669'}}>
      <CardHeader className="p-6 rounded-t-lg" style={{backgroundColor: '#059669'}}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <CardTitle className="text-xl sm:text-2xl text-center sm:text-left font-bold uppercase flex items-center justify-center sm:justify-start gap-2" style={{color: '#ffffff'}}>
            <DollarSign className="w-8 h-8" />
            GANANCIA BANCA
          </CardTitle>
          <Badge className="bg-yellow-400 text-emerald-900 text-sm px-3 py-1 animate-pulse w-fit mx-auto sm:mx-0">
            EN VIVO
          </Badge>
        </div>
        <CardDescription className="text-center text-lg mb-3" style={{color: '#d1fae5'}}>
          {gameName ? `Ganancias del juego: ${gameName}` : 'Utilidad neta después de premios'}
        </CardDescription>
          <div className="flex gap-2 justify-center">
            <CurrencySelector 
              value={displayCurrency} 
              onChange={changeDisplayCurrency}
              className="justify-center"
            />
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if(!confirm('⚠️ ¿Reiniciar TODAS las ganancias?\n\nEsto eliminará todas las ventas y juegos terminados para reiniciar los contadores a $0.\n\nEsta acción no se puede deshacer.')) return;
                
                try {
                  const res = await fetch('/api/admin/reset-earnings', { method: 'POST' });
                  const data = await res.json();
                  if(data.success) {
                    alert('✅ Ganancias reiniciadas correctamente');
                    loadProfitData(); // Recargar datos
                  } else {
                    alert('❌ Error: ' + (data.error || 'Desconocido'));
                  }
                } catch(e) {
                  alert('❌ Error de conexión');
                }
              }}
              className="font-bold border-2 border-red-200"
            >
              🔄 Reiniciar
            </Button>
          </div>
        </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {/* Ganancias por Moneda - Separadas */}
        <div className="space-y-4">
          {/* USD */}
          {byCurrency.USD.totalRevenue > 0 && (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-5 border-4 border-emerald-400 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-emerald-700" />
                  <span className="text-xl font-black text-emerald-800">GANANCIA EN USD</span>
                </div>
                <div className="text-4xl font-black text-emerald-600 bg-white px-4 py-2 rounded-lg shadow">
                  {byCurrency.USD.profitMargin}%
                </div>
              </div>
              
              <div className="text-center bg-gradient-to-r from-emerald-700 to-green-600 rounded-lg p-4 mb-3">
                <div className="text-4xl font-black text-white">
                  {convertAndFormat(byCurrency.USD.totalHouseProfit, 'USD')}
                </div>
              </div>

              <div className="bg-white/80 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Recaudado:</span>
                  <span className="font-bold text-emerald-700">{convertAndFormat(byCurrency.USD.totalRevenue, 'USD')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">- Total Premios:</span>
                  <span className="font-bold text-orange-600">-{convertAndFormat(byCurrency.USD.totalPrizes, 'USD')}</span>
                </div>
                <div className="border-t border-emerald-300 pt-2 mt-2"></div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-emerald-800">= Ganancia Neta:</span>
                  <span className="font-black text-emerald-700">{convertAndFormat(byCurrency.USD.totalHouseProfit, 'USD')}</span>
                </div>
              </div>
            </div>
          )}

          {/* VES (Bolívares) */}
          {byCurrency.VES.totalRevenue > 0 && (
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-5 border-4 border-yellow-400 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-yellow-700">Bs.</span>
                  <span className="text-xl font-black text-yellow-800">GANANCIA EN BOLÍVARES</span>
                </div>
                <div className="text-4xl font-black text-yellow-600 bg-white px-4 py-2 rounded-lg shadow">
                  {byCurrency.VES.profitMargin}%
                </div>
              </div>
              
              <div className="text-center bg-gradient-to-r from-yellow-600 to-amber-600 rounded-lg p-4 mb-3">
                <div className="text-4xl font-black text-white">
                  {convertAndFormat(byCurrency.VES.totalHouseProfit, 'VES')}
                </div>
              </div>

              <div className="bg-white/80 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Recaudado:</span>
                  <span className="font-bold text-yellow-700">{convertAndFormat(byCurrency.VES.totalRevenue, 'VES')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">- Total Premios:</span>
                  <span className="font-bold text-orange-600">-{convertAndFormat(byCurrency.VES.totalPrizes, 'VES')}</span>
                </div>
                <div className="border-t border-yellow-400 pt-2 mt-2"></div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-yellow-800">= Ganancia Neta:</span>
                  <span className="font-black text-yellow-700">{convertAndFormat(byCurrency.VES.totalHouseProfit, 'VES')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje si no hay datos */}
          {byCurrency.USD.totalRevenue === 0 && byCurrency.VES.totalRevenue === 0 && (
            <div className="text-center p-8 bg-gray-100 rounded-lg">
              <div className="text-gray-500 text-lg">
                📊 No hay juegos con ventas todavía
              </div>
              <div className="text-gray-400 text-sm mt-2">
                Crea un juego y vende cartones para ver las ganancias
              </div>
            </div>
          )}
        </div>

        {/* Nota */}
        <div className="text-center text-xs text-white/80 bg-emerald-700/50 rounded-lg p-2">
          💡 Se actualiza automáticamente cada 15 segundos
        </div>
      </CardContent>
    </Card>
  )
}
