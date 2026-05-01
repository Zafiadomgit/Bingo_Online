"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  Bell, 
  Clock, 
  Users,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react"

interface PurchaseRequest {
  id: string
  nombres: string
  apellidos: string
  email: string
cantidad_cartones: number
  amount: number
  numero_referencia: string
  status: 'pending' | 'approved' | 'rejected'
  receipt_url: string
  created_at: string
}

interface PendingRequestsAlertProps {
  onViewDetails?: () => void
  refreshTrigger?: number // Para forzar actualización cuando cambia
}

export function PendingRequestsAlert({ onViewDetails, refreshTrigger }: PendingRequestsAlertProps) {
  const [pendingRequests, setPendingRequests] = useState<PurchaseRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadPendingRequests()
    // Actualizar cada 30 segundos
    const interval = setInterval(loadPendingRequests, 30000)
    return () => clearInterval(interval)
  }, [])

  // Actualizar cuando cambia refreshTrigger (cuando se aprueba/rechaza una solicitud)
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      loadPendingRequests()
    }
  }, [refreshTrigger])

  const loadPendingRequests = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true)
      }
      
      console.log('🔄 Cargando solicitudes de compra...')
      const response = await fetch('/api/admin/purchase-requests')
      const data = await response.json()
      
      if (data.success) {
        console.log('📋 Solicitudes recibidas:', data.requests.length)
        const pending = data.requests.filter((req: PurchaseRequest) => req.status === 'pending')
        console.log('⏳ Solicitudes pendientes:', pending.length)
        setPendingRequests(pending)
      } else {
        console.error('❌ Error en respuesta:', data.error)
      }
    } catch (error) {
      console.error('❌ Error loading pending requests:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleManualRefresh = () => {
    loadPendingRequests(true)
  }

  if (isLoading) {
    return null
  }

  if (pendingRequests.length === 0) {
    return null
  }

  return (
    <Card className="mb-8 border-4 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-2xl animate-pulse">
      <CardContent className="p-6">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="relative">
              <Bell className="w-10 h-10 text-yellow-600 animate-bounce" />
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white animate-pulse">
                {pendingRequests.length}
              </Badge>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-yellow-800 flex items-center justify-center sm:justify-start gap-2">
                <AlertTriangle className="w-6 h-6" />
                ¡ATENCIÓN ADMIN!
              </h3>
              <p className="text-base sm:text-lg text-yellow-700">
                Tienes <strong>{pendingRequests.length}</strong> solicitud{pendingRequests.length > 1 ? 'es' : ''} pendiente{pendingRequests.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="text-center sm:text-right flex-1 sm:flex-none">
              <div className="text-xs text-yellow-600">Última solicitud:</div>
              <div className="text-sm font-semibold text-yellow-800">
                {new Date(pendingRequests[0]?.created_at).toLocaleString('es-CO', { hour12: true })}
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-3 py-2 rounded-xl shadow-lg flex-1 sm:flex-none"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? '...' : 'REFRESCAR'}
              </Button>
              <Button
                onClick={onViewDetails}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded-xl shadow-lg flex-1 sm:flex-none"
              >
                <Eye className="w-5 h-5 mr-2" />
                VER
              </Button>
            </div>
          </div>
        </div>

        {/* Lista rápida de solicitudes pendientes */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pendingRequests.slice(0, 3).map((request) => (
            <div key={request.id} className="bg-white/80 rounded-lg p-3 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-800">
                    {request.nombres} {request.apellidos}
                  </div>
                  <div className="text-sm text-gray-600">
                  </div>
                  <div className="text-sm text-gray-600">
                    {request.cantidad_cartones} cartón{request.cantidad_cartones > 1 ? 'es' : ''} - ${request.amount}
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <Clock className="w-3 h-3 mr-1" />
                    PENDIENTE
                  </Badge>
                </div>
              </div>
            </div>
          ))}
          {pendingRequests.length > 3 && (
            <div className="bg-white/80 rounded-lg p-3 border border-yellow-200 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  +{pendingRequests.length - 3}
                </div>
                <div className="text-sm text-gray-600">
                  más solicitud{pendingRequests.length - 3 > 1 ? 'es' : ''}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
