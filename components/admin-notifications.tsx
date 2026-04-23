"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  User, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock,
  AlertTriangle,
  DollarSign,
  Hash,
  Mail,
  Phone
} from "lucide-react"

interface PurchaseRequest {
  id: string
  nombres: string
  apellidos: string
  email: string
  telefono: string
  cedula: string
  cantidad_cartones: number
  total: number
  status: 'pending' | 'approved' | 'rejected'
  transfer_image: string
  created_at: string
  updated_at: string
}

interface AdminNotificationsProps {
  onRequestSelect?: (request: PurchaseRequest) => void
}

export function AdminNotifications({ onRequestSelect }: AdminNotificationsProps) {
  const [pendingRequests, setPendingRequests] = useState<PurchaseRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null)

  useEffect(() => {
    loadPendingRequests()
  }, [])

  const loadPendingRequests = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/purchase-requests')
      const data = await response.json()
      if (data.success) {
        const pending = data.requests.filter((req: PurchaseRequest) => req.status === 'pending')
        setPendingRequests(pending)
      }
    } catch (error) {
      console.error('Error loading pending requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/admin/approve-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      })

      const data = await response.json()
      if (data.success) {
        // Remover la solicitud de la lista de pendientes
        setPendingRequests(prev => prev.filter(req => req.id !== requestId))
        setSelectedRequest(null)
      }
    } catch (error) {
      console.error('Error approving request:', error)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/admin/reject-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      })

      const data = await response.json()
      if (data.success) {
        // Remover la solicitud de la lista de pendientes
        setPendingRequests(prev => prev.filter(req => req.id !== requestId))
        setSelectedRequest(null)
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  }

  if (isLoading) {
    return (
      <Card className="backdrop-blur-sm shadow-2xl transform hover:scale-105 transition-all duration-300 animate-fade-in" style={{backgroundColor: 'rgba(242, 227, 148, 0.9)', border: '4px solid #D9A13B'}}>
        <CardHeader className="p-6 rounded-t-lg" style={{backgroundColor: '#D9A13B'}}>
          <CardTitle className="text-2xl text-center font-bold uppercase flex items-center justify-center gap-2" style={{color: '#121D40'}}>
            <Bell className="w-8 h-8" />
            NOTIFICACIONES
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2" style={{color: '#121D40'}}>Cargando notificaciones...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="backdrop-blur-sm shadow-2xl transform hover:scale-105 transition-all duration-300 animate-fade-in" style={{backgroundColor: 'rgba(242, 227, 148, 0.9)', border: '4px solid #D9A13B'}}>
        <CardHeader className="p-6 rounded-t-lg" style={{backgroundColor: '#D9A13B'}}>
          <CardTitle className="text-2xl text-center font-bold uppercase flex items-center justify-center gap-2" style={{color: '#121D40'}}>
            <Bell className="w-8 h-8" />
            NOTIFICACIONES
            {pendingRequests.length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white animate-pulse">
                {pendingRequests.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-center text-lg" style={{color: '#121D40'}}>
            Solicitudes pendientes de aprobación
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{color: '#143C8C'}} />
              <div className="text-2xl font-bold mb-2" style={{color: '#121D40'}}>¡Todo al día!</div>
              <div style={{color: '#121D40'}}>No hay solicitudes pendientes</div>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {pendingRequests.map((request) => (
                <div key={request.id} className="p-4 rounded-xl shadow-lg border-2 border-yellow-300" style={{background: 'linear-gradient(90deg, #F2E394 0%, #D9A13B 100%)'}}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {request.nombres.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold" style={{color: '#121D40'}}>
                          {request.nombres} {request.apellidos}
                        </h3>
                        <p className="text-sm" style={{color: '#143C8C'}}>
                          Cédula: {request.cedula}
                        </p>
                        <p className="text-sm" style={{color: '#143C8C'}}>
                          {request.cantidad_cartones} cartón{request.cantidad_cartones > 1 ? 'es' : ''} - ${request.total}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 animate-pulse">
                        <Clock className="w-3 h-3 mr-1" />
                        PENDIENTE
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {request.transfer_image && (
                    <div className="mt-3">
                      <img 
                        src={request.transfer_image} 
                        alt="Comprobante de transferencia"
                        className="w-20 h-20 object-cover rounded-lg border-2 border-white shadow-lg"
                      />
                    </div>
                  )}
                  
                  <div className="mt-3 flex gap-2">
                    <Button
                      onClick={() => handleApproveRequest(request.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-bold"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      APROBAR
                    </Button>
                    <Button
                      onClick={() => handleRejectRequest(request.id)}
                      variant="destructive"
                      className="flex-1 text-sm font-bold"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      RECHAZAR
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalles de Solicitud */}
      {selectedRequest && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="bg-white/95 backdrop-blur-lg border-4 border-blue-400 shadow-2xl rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-blue-400 text-white p-6 rounded-t-lg flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-bold">
                Detalles de Solicitud
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedRequest(null)} className="text-white hover:bg-white/20">
                <XCircle className="w-6 h-6" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Información Personal */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Nombres</p>
                    <p className="text-lg font-semibold">{selectedRequest.nombres}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Apellidos</p>
                    <p className="text-lg font-semibold">{selectedRequest.apellidos}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {selectedRequest.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Teléfono</p>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {selectedRequest.telefono}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cédula</p>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      {selectedRequest.cedula}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de Compra */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Información de Compra
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cantidad de Cartones</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedRequest.cantidad_cartones}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total a Pagar</p>
                    <p className="text-2xl font-bold text-green-600">${selectedRequest.total}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Estado</p>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      <Clock className="w-3 h-3 mr-1" />
                      Pendiente
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fecha de Solicitud</p>
                    <p className="text-lg font-semibold">
                      {new Date(selectedRequest.created_at).toLocaleString('es-CO', { hour12: true })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comprobante de Transferencia */}
              {selectedRequest.transfer_image && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Comprobante de Transferencia
                  </h3>
                  <div className="border-2 border-gray-200 rounded-lg p-4">
                    <img 
                      src={selectedRequest.transfer_image} 
                      alt="Comprobante de transferencia"
                      className="max-w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => handleApproveRequest(selectedRequest.id)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprobar Solicitud
                </Button>
                <Button
                  onClick={() => handleRejectRequest(selectedRequest.id)}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar Solicitud
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
