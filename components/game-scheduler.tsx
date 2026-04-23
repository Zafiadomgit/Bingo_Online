"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Bell, Play, Pause, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/hooks/use-currency"

interface GameSchedulerProps {
  gameId?: string
  onSchedule?: (scheduleData: ScheduleData) => void
  onCancel?: () => void
}

interface ScheduleData {
  scheduled_at: string
  auto_start: boolean
  start_delay_minutes: number
  notification_sent: boolean
  max_cards: number
  card_price: number
  prize_line: number
  prize_two_lines: number
  prize_full_card: number
  use_percentage_prizes: boolean
  prize_line_percentage: number | null
  prize_two_lines_percentage: number | null
  prize_full_card_percentage: number | null
  currency: string
}

export function GameScheduler({ gameId, onSchedule, onCancel }: GameSchedulerProps) {
  const { currency, changeCurrency, formatCurrency, getCurrencySymbol } = useCurrency();
  
  const [scheduleData, setScheduleData] = useState<ScheduleData>({
    scheduled_at: "",
    auto_start: true,  // Cambiado a true por defecto
    start_delay_minutes: 5,
    notification_sent: false,
    max_cards: 100,
    card_price: 1.00,
    prize_line: 50,
    prize_two_lines: 100,
    prize_full_card: 200,
    use_percentage_prizes: false,
    prize_line_percentage: 10,
    prize_two_lines_percentage: 15,
    prize_full_card_percentage: 25,
    currency: currency
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // La fecha viene del input datetime-local en formato: "YYYY-MM-DDTHH:mm"
      // Interpretar como hora LOCAL del usuario (Venezuela, Colombia, etc.)
      
      const localDate = new Date(scheduleData.scheduled_at)
      
      // Verificar que la fecha no esté en el futuro lejano (año incorrecto)
      const currentYear = new Date().getFullYear()
      const scheduledYear = localDate.getFullYear()
      
      if (scheduledYear > currentYear + 5) {
        toast({
          title: "Error de Fecha",
          description: `El año seleccionado (${scheduledYear}) parece incorrecto. Verifica la fecha.`,
          variant: "destructive",
        })
        return
      }
      
      // Convertir a UTC manteniendo la hora local
      const utcDate = localDate.toISOString()
      
      console.log('Date conversion (User Local Time):', {
        original: scheduleData.scheduled_at,
        localDate: localDate.toString(),
        utcDate: utcDate,
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        currentYear,
        scheduledYear
      })

      const response = await fetch('/api/games/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(gameId && { gameId }),
          ...scheduleData,
          scheduled_at: utcDate // Enviar fecha en UTC
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "🎯 ¡Sorteo Programado!",
          description: `El sorteo se iniciará el ${new Date(scheduleData.scheduled_at).toLocaleString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}`,
        })
        
        if (onSchedule) {
          onSchedule(scheduleData)
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Error programando el sorteo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error scheduling game:', error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTimeUntilStart = () => {
    if (!scheduleData.scheduled_at) return null
    
    try {
      // Usar la fecha ingresada como hora local del usuario
      const scheduled = new Date(scheduleData.scheduled_at)
      const now = new Date()
      const diff = scheduled.getTime() - now.getTime()
      
      if (diff <= 0) return "¡Ya debería haber empezado!"
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const remainingHours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const remainingMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (days > 0) return `${days}d ${remainingHours}h ${remainingMinutes}m`
      if (remainingHours > 0) return `${remainingHours}h ${remainingMinutes}m`
      return `${remainingMinutes}m`
    } catch (error) {
      console.error('Error calculating time until start:', error)
      return null
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[99999]"
      onClick={(e) => {
        // Solo cerrar si se hace click en el fondo (no en el contenido del modal)
        if (e.target === e.currentTarget && onCancel) {
          onCancel()
        }
      }}
    >
      <Card 
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-4 border-purple-400 shadow-2xl"
        onClick={(e) => {
          // Prevenir que el click en el contenido del modal cierre el modal
          e.stopPropagation()
        }}
      >
        <CardHeader className="bg-purple-400 text-white p-6 rounded-t-lg">
          <CardTitle className="text-3xl text-center font-bold uppercase flex items-center justify-center gap-2">
            <Calendar className="w-8 h-8" />
            PROGRAMAR SORTEO
          </CardTitle>
          <CardDescription className="text-center text-gray-800 text-lg">
            Configura cuándo y cómo iniciar el sorteo
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fecha y Hora */}
          <div className="space-y-2">
            <Label htmlFor="scheduled_at" className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Fecha y Hora de Inicio
            </Label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              value={scheduleData.scheduled_at}
              onChange={(e) => setScheduleData({...scheduleData, scheduled_at: e.target.value})}
              required
              className="rounded-xl border-2 border-gray-300 focus:border-purple-500 text-lg py-3"
            />
            {scheduleData.scheduled_at && (
              <div className="text-center">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  ⏰ Inicia en: {getTimeUntilStart()}
                </Badge>
              </div>
            )}
          </div>

          {/* Auto Start */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl">
            <div className="flex items-center gap-3">
              <Play className="w-6 h-6 text-blue-600" />
              <div>
                <Label htmlFor="auto_start" className="text-lg font-bold text-gray-800">
                  Inicio Automático
                </Label>
                <p className="text-sm text-gray-600">
                  El sorteo se iniciará automáticamente a la hora programada
                </p>
              </div>
            </div>
            <Switch
              id="auto_start"
              checked={scheduleData.auto_start}
              onCheckedChange={(checked) => setScheduleData({...scheduleData, auto_start: checked})}
            />
          </div>

          {/* Delay de Inicio */}
          <div className="space-y-2">
            <Label htmlFor="start_delay_minutes" className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Pause className="w-5 h-5" />
              Retraso de Inicio (minutos)
            </Label>
            <Input
              id="start_delay_minutes"
              type="number"
              min="0"
              max="60"
              value={scheduleData.start_delay_minutes}
              onChange={(e) => setScheduleData({...scheduleData, start_delay_minutes: parseInt(e.target.value)})}
              className="rounded-xl border-2 border-gray-300 focus:border-purple-500 text-lg py-3"
            />
            <p className="text-sm text-gray-600">
              Tiempo de espera adicional después de la hora programada
            </p>
          </div>

          {/* Notificaciones */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-100 to-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-green-600" />
              <div>
                <Label htmlFor="notification_sent" className="text-lg font-bold text-gray-800">
                  Enviar Notificaciones
                </Label>
                <p className="text-sm text-gray-600">
                  Notificar a los jugadores sobre el sorteo programado
                </p>
              </div>
            </div>
            <Switch
              id="notification_sent"
              checked={scheduleData.notification_sent}
              onCheckedChange={(checked) => setScheduleData({...scheduleData, notification_sent: checked})}
            />
          </div>

          {/* Configuración de Cartones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Máximo de Cartones */}
            <div className="space-y-2">
              <Label htmlFor="max_cards" className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Máximo de Cartones
              </Label>
              <Input
                id="max_cards"
                type="number"
                min="1"
                max="10000"
                value={scheduleData.max_cards}
                onChange={(e) => setScheduleData({...scheduleData, max_cards: parseInt(e.target.value)})}
                className="rounded-xl border-2 border-gray-300 focus:border-purple-500 text-lg py-3"
                required
              />
              <p className="text-sm text-gray-600">
                Límite de cartones que pueden participar en este sorteo
              </p>
            </div>

            {/* Precio por Cartón */}
            <div className="space-y-2">
              <Label htmlFor="card_price" className="text-lg font-bold text-gray-800 flex items-center gap-2">
                💰 Precio por Cartón
              </Label>
              <div className="flex gap-2">
                <Input
                  id="card_price"
                  type="number"
                  min="0.01"
                  
                  step="0.01"
                  value={scheduleData.card_price}
                  onChange={(e) => setScheduleData({...scheduleData, card_price: parseFloat(e.target.value)})}
                  className="rounded-xl border-2 border-gray-300 focus:border-purple-500 text-lg py-3 flex-1"
                  required
                />
                <Select
                  value={currency}
                  onValueChange={(value) => {
                    changeCurrency(value as 'USD' | 'VES');
                    setScheduleData({...scheduleData, currency: value});
                  }}
                >
                  <SelectTrigger className="w-24 rounded-xl border-2 border-gray-300 focus:border-purple-500 text-lg py-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">$</SelectItem>
                    <SelectItem value="VES">Bs.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-gray-600">
                Precio individual de cada cartón para este juego
              </p>
            </div>
          </div>

          {/* Configuración de Premios */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              🏆 Configuración de Premios
            </h3>

            {/* Switch para usar porcentajes */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 text-purple-600">📊</div>
                <div>
                  <Label htmlFor="use_percentage_prizes" className="text-lg font-bold text-gray-800">
                    Premios por Porcentaje
                  </Label>
                  <p className="text-sm text-gray-600">
                    Los premios se calcularán como porcentaje de los ingresos totales
                  </p>
                </div>
              </div>
              <Switch
                id="use_percentage_prizes"
                checked={scheduleData.use_percentage_prizes}
                onCheckedChange={(checked) => setScheduleData({...scheduleData, use_percentage_prizes: checked})}
              />
            </div>
            
            {scheduleData.use_percentage_prizes ? (
              // Premios por Porcentaje
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Premio Cartón Lleno - 1ER LUGAR */}
                <div className="space-y-2">
                  <Label htmlFor="prize_full_card_percentage" className="text-lg font-bold text-red-800">
                    🥇 Premio Cartón Lleno (%)
                  </Label>
                  <Input
                    id="prize_full_card_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={scheduleData.prize_full_card_percentage || ''}
                    onChange={(e) => setScheduleData({...scheduleData, prize_full_card_percentage: parseFloat(e.target.value)})}
                    className="rounded-xl border-2 border-red-300 focus:border-red-500 text-lg py-3"
                    required
                  />
                  <p className="text-xs text-red-600">% de ingresos totales - 1er Lugar</p>
                </div>

                {/* Premio Dos Líneas - 2DO LUGAR */}
                <div className="space-y-2">
                  <Label htmlFor="prize_two_lines_percentage" className="text-lg font-bold text-yellow-800">
                    🥈 Premio Dos Líneas (%)
                  </Label>
                  <Input
                    id="prize_two_lines_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={scheduleData.prize_two_lines_percentage || ''}
                    onChange={(e) => setScheduleData({...scheduleData, prize_two_lines_percentage: parseFloat(e.target.value)})}
                    className="rounded-xl border-2 border-yellow-300 focus:border-yellow-500 text-lg py-3"
                    required
                  />
                  <p className="text-xs text-yellow-600">% de ingresos totales - 2do Lugar</p>
                </div>

                {/* Premio Línea - 3ER LUGAR */}
                <div className="space-y-2">
                  <Label htmlFor="prize_line_percentage" className="text-lg font-bold text-green-800">
                    🥉 Premio Línea (%)
                  </Label>
                  <Input
                    id="prize_line_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={scheduleData.prize_line_percentage || ''}
                    onChange={(e) => setScheduleData({...scheduleData, prize_line_percentage: parseFloat(e.target.value)})}
                    className="rounded-xl border-2 border-green-300 focus:border-green-500 text-lg py-3"
                    required
                  />
                  <p className="text-xs text-green-600">% de ingresos totales - 3er Lugar</p>
                </div>
              </div>
            ) : (
              // Premios Fijos
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Premio Cartón Lleno - 1ER LUGAR */}
                <div className="space-y-2">
                  <Label htmlFor="prize_full_card" className="text-lg font-bold text-red-800">
                    🥇 Premio Cartón Lleno
                  </Label>
                  <Input
                    id="prize_full_card"
                    type="number"
                    min="0"
                    value={scheduleData.prize_full_card}
                    onChange={(e) => setScheduleData({...scheduleData, prize_full_card: Number(e.target.value) || 0})}
                    className="rounded-xl border-2 border-red-300 focus:border-red-500 text-lg py-3"
                    required
                  />
                  <p className="text-xs text-red-600">1er Lugar - Cartón completamente lleno</p>
                </div>

                {/* Premio Dos Líneas - 2DO LUGAR */}
                <div className="space-y-2">
                  <Label htmlFor="prize_two_lines" className="text-lg font-bold text-yellow-800">
                    🥈 Premio Dos Líneas
                  </Label>
                  <Input
                    id="prize_two_lines"
                    type="number"
                    min="0"
                    value={scheduleData.prize_two_lines}
                    onChange={(e) => setScheduleData({...scheduleData, prize_two_lines: Number(e.target.value) || 0})}
                    className="rounded-xl border-2 border-yellow-300 focus:border-yellow-500 text-lg py-3"
                    required
                  />
                  <p className="text-xs text-yellow-600">2do Lugar - Dos líneas completas</p>
                </div>

                {/* Premio Línea - 3ER LUGAR */}
                <div className="space-y-2">
                  <Label htmlFor="prize_line" className="text-lg font-bold text-green-800">
                    🥉 Premio Línea
                  </Label>
                  <Input
                    id="prize_line"
                    type="number"
                    min="0"
                    value={scheduleData.prize_line}
                    onChange={(e) => setScheduleData({...scheduleData, prize_line: Number(e.target.value) || 0})}
                    className="rounded-xl border-2 border-green-300 focus:border-green-500 text-lg py-3"
                    required
                  />
                  <p className="text-xs text-green-600">3er Lugar - Una línea completa</p>
                </div>
              </div>
            )}

            {/* Resumen de Premios */}
            <div className="bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl p-4">
              <h4 className="font-bold text-purple-800 mb-2">💰 Resumen de Premios</h4>
              {scheduleData.use_percentage_prizes ? (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-red-600">{scheduleData.prize_full_card_percentage || 0}%</div>
                    <div className="text-sm text-red-700">🥇 Cartón Lleno</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{scheduleData.prize_two_lines_percentage || 0}%</div>
                    <div className="text-sm text-yellow-700">🥈 Dos Líneas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{scheduleData.prize_line_percentage || 0}%</div>
                    <div className="text-sm text-green-700">🥉 Una Línea</div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-white/50 p-2 rounded-lg">
                    <div className="text-xl md:text-2xl font-bold text-red-600">{formatCurrency(scheduleData.prize_full_card || 0)}</div>
                    <div className="text-xs md:text-sm text-red-700 font-bold">🥇 Cartón Lleno</div>
                  </div>
                  <div className="bg-white/50 p-2 rounded-lg">
                    <div className="text-xl md:text-2xl font-bold text-yellow-600">{formatCurrency(scheduleData.prize_two_lines || 0)}</div>
                    <div className="text-xs md:text-sm text-yellow-700 font-bold">🥈 Dos Líneas</div>
                  </div>
                  <div className="bg-white/50 p-2 rounded-lg">
                    <div className="text-xl md:text-2xl font-bold text-green-600">{formatCurrency(scheduleData.prize_line || 0)}</div>
                    <div className="text-xs md:text-sm text-green-700 font-bold">🥉 Una Línea</div>
                  </div>
                </div>
              )}
              <div className="text-center mt-3">
                <div className="text-lg font-bold text-purple-800">
                  {scheduleData.use_percentage_prizes ? (
                    <>Total en Premios: {((scheduleData.prize_line_percentage || 0) + (scheduleData.prize_two_lines_percentage || 0) + (scheduleData.prize_full_card_percentage || 0)).toFixed(2)}% de ingresos</>
                  ) : (
                    <>Total en Premios: {formatCurrency((scheduleData.prize_line || 0) + (scheduleData.prize_two_lines || 0) + (scheduleData.prize_full_card || 0))}</>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4">
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-4 text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 animate-pulse"
              disabled={isLoading}
            >
              {isLoading ? "🎯 PROGRAMANDO..." : "🎯 ¡PROGRAMAR SORTEO!"}
            </Button>
            {onCancel && (
              <Button 
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-4 border-gray-400 text-gray-700 hover:bg-gray-100 px-8 py-4 text-xl font-bold rounded-full shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
        </CardContent>
      </Card>
    </div>
  )
}
