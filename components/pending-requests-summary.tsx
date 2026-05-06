"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  AlertTriangle, 
  Bell, 
  Clock, 
  Users,
  Eye,
  CheckCircle,
  XCircle,
  DollarSign,
  Hash,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  RefreshCw
} from "lucide-react"

interface PurchaseRequest {
  id: string
  nombres: string
  apellidos: string
  email: string
  telefono: string
cantidad_cartones: number
  amount: number
  numero_referencia: string
  status: 'pending' | 'approved' | 'rejected'
  receipt_url: string
  promoter_name?: string
  created_at: string
  updated_at: string
}

interface PendingRequestsSummaryProps {
  onRequestProcessed?: () => void // Callback para notificar cuando se procesa una solicitud
}

export function PendingRequestsSummary({ onRequestProcessed }: PendingRequestsSummaryProps) {
  const [pendingRequests, setPendingRequests] = useState<PurchaseRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadPendingRequests()
    // Actualizar cada 30 segundos
    const interval = setInterval(loadPendingRequests, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadPendingRequests = async () => {
    try {
      const response = await fetch('/api/admin/purchase-requests')
      const data = await response.json()
      if (data.success) {
        setPendingRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error loading pending requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      console.log('🟢 Aprobando solicitud:', requestId)
      
      const response = await fetch('/api/admin/approve-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      })

      const data = await response.json()
      console.log('📋 Respuesta de aprobación:', data)
      
      if (data.success) {
        console.log('✅ Solicitud aprobada exitosamente')
        // Eliminar inmediatamente del estado local
        setPendingRequests(prev => prev.filter(req => req.id !== requestId))
        setSelectedRequest(null)
        
        // Notificar que se procesó una solicitud
        if (onRequestProcessed) {
          onRequestProcessed()
        }
        
        // Recargar la lista después de un breve delay para asegurar sincronización
        setTimeout(() => {
          console.log('🔄 Recargando solicitudes pendientes...')
          loadPendingRequests()
        }, 1000)
      } else {
        console.error('❌ Error en respuesta de aprobación:', data.error)
        toast({
          title: "Error al aprobar",
          description: data.error || "No se pudo aprobar la solicitud",
          variant: "destructive",
        })
        loadPendingRequests()
      }
    } catch (error: any) {
      console.error('❌ Error aprobando solicitud:', error)
      toast({
        title: "Error de conexión",
        description: error.message || "No se pudo contactar al servidor",
        variant: "destructive",
      })
      loadPendingRequests()
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      console.log('🔴 Rechazando solicitud:', requestId)
      
      const response = await fetch('/api/admin/reject-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      })

      const data = await response.json()
      console.log('📋 Respuesta de rechazo:', data)
      
      if (data.success) {
        console.log('✅ Solicitud rechazada exitosamente')
        // Eliminar inmediatamente del estado local
        setPendingRequests(prev => prev.filter(req => req.id !== requestId))
        setSelectedRequest(null)
        
        // Notificar que se procesó una solicitud
        if (onRequestProcessed) {
          onRequestProcessed()
        }
        
        // Recargar la lista después de un breve delay para asegurar sincronización
        setTimeout(() => {
          console.log('🔄 Recargando solicitudes pendientes...')
          loadPendingRequests()
        }, 1000)
      } else {
        console.error('❌ Error en respuesta de rechazo:', data.error)
        toast({
          title: "Error al rechazar",
          description: data.error || "No se pudo rechazar la solicitud",
          variant: "destructive",
        })
        loadPendingRequests()
      }
    } catch (error: any) {
      console.error('❌ Error rechazando solicitud:', error)
      toast({
        title: "Error de conexión",
        description: error.message || "No se pudo contactar al servidor",
        variant: "destructive",
      })
      loadPendingRequests()
    }
  }

  if (isLoading) {
    return (
      <Card className="backdrop-blur-sm shadow-2xl" style={{backgroundColor: 'rgba(242, 227, 148, 0.9)', border: '4px solid #D9A13B'}}>
        <CardHeader className="p-6 rounded-t-lg" style={{backgroundColor: '#D9A13B'}}>
          <CardTitle className="text-2xl text-center font-bold uppercase flex items-center justify-center gap-2" style={{color: '#121D40'}}>
            <Bell className="w-8 h-8" />
            SOLICITUDES PENDIENTES
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2" style={{color: '#121D40'}}>Cargando solicitudes...</p>
        </CardContent>
      </Card>
    )
  }

  if (pendingRequests.length === 0) {
    return (
      <Card className="backdrop-blur-sm shadow-2xl" style={{backgroundColor: 'rgba(242, 227, 148, 0.9)', border: '4px solid #143C8C'}}>
        <CardHeader className="p-6 rounded-t-lg" style={{backgroundColor: '#143C8C'}}>
          <CardTitle className="text-2xl text-center font-bold uppercase flex items-center justify-center gap-2" style={{color: '#F2E394'}}>
            <Bell className="w-8 h-8" />
            SOLICITUDES PENDIENTES
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{color: '#143C8C'}} />
          <div className="text-2xl font-bold mb-2" style={{color: '#121D40'}}>¡Todo al día!</div>
          <div style={{color: '#121D40'}}>No hay solicitudes pendientes de aprobación</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="backdrop-blur-sm shadow-2xl" style={{backgroundColor: 'rgba(242, 227, 148, 0.9)', border: '4px solid #D9A13B'}}>
        <CardHeader className="p-6 rounded-t-lg relative" style={{backgroundColor: '#D9A13B'}}>
          <div className="absolute right-4 top-4 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadPendingRequests}
              className="bg-white/20 hover:bg-white/40 text-[#121D40] border-none font-bold"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              REFRESCAR
            </Button>
          </div>
          <CardTitle className="text-2xl text-center font-bold uppercase flex items-center justify-center gap-2" style={{color: '#121D40'}}>
            <Bell className="w-8 h-8" />
            SOLICITUDES PENDIENTES
            <Badge className="ml-2 bg-red-500 text-white animate-pulse">
              {pendingRequests.length}
            </Badge>
          </CardTitle>
          <CardDescription className="text-center text-lg" style={{color: '#121D40'}}>
            Jugadores esperando aprobación de sus pagos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {pendingRequests.map((request) => (
              <div key={request.id} className="p-4 rounded-xl shadow-lg border-2 border-yellow-300" style={{background: 'linear-gradient(90deg, #F2E394 0%, #D9A13B 100%)'}}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shrink-0">
                      {request.nombres.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold" style={{color: '#121D40'}}>
                        {request.nombres} {request.apellidos}
                      </h3>
                      <p className="text-xs sm:text-sm" style={{color: '#143C8C'}}>
                      </p>
                      <p className="text-xs sm:text-sm" style={{color: '#143C8C'}}>
                        {request.cantidad_cartones} cartón{request.cantidad_cartones > 1 ? 'es' : ''} - {(request as any).currency === 'VES' ? 'Bs.' : '$'}{request.amount}
                      </p>
                      {request.promoter_name && (
                        <p className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          {request.promoter_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 animate-pulse text-[10px] sm:text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      PENDIENTE
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-2 h-8"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                  {request.receipt_url && (
                    <div className="mt-3">
                      {(() => {
                        try {
                          // Intentar parsear como JSON (formato base64)
                          const imageData = JSON.parse(request.receipt_url);
                          if (imageData.data) {
                            return (
                              <img 
                                src={imageData.data} 
                                alt="Comprobante de transferencia"
                                className="w-20 h-20 object-cover rounded-lg border-2 border-white shadow-lg"
                                title={`${imageData.name} (${(imageData.size / 1024).toFixed(1)}KB)`}
                              />
                            );
                          }
                        } catch (error) {
                          // Si no es JSON, tratar como URL
                          return (
                            <img 
                              src={request.receipt_url} 
                              alt="Comprobante de transferencia"
                              className="w-20 h-20 object-cover rounded-lg border-2 border-white shadow-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="w-20 h-20 bg-gray-200 rounded-lg border-2 border-white shadow-lg flex items-center justify-center text-xs text-gray-500">Sin imagen</div>';
                                }
                              }}
                            />
                          );
                        }
                      })()}
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
                  <Users className="w-5 h-5" />
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
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Número de Referencia</p>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      {selectedRequest.numero_referencia}
                    </p>
                  </div>
                  {selectedRequest.promoter_name && (
                    <div className="md:col-span-2">
                       <p className="text-sm font-medium text-gray-600">Promotor</p>
                       <p className="text-lg font-semibold flex items-center gap-2 text-blue-700">
                         <span className="bg-blue-100 px-2 py-1 rounded">
                           {selectedRequest.promoter_name}
                         </span>
                       </p>
                    </div>
                  )}
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
                    <p className="text-2xl font-bold text-green-600">{(selectedRequest as any).currency === 'VES' ? 'Bs.' : '$'}{selectedRequest.amount}</p>
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
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(selectedRequest.created_at).toLocaleString('es-CO', { hour12: true })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comprobante de Transferencia */}
              {selectedRequest.receipt_url && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Comprobante de Transferencia
                  </h3>
                  <div className="border-2 border-gray-200 rounded-lg p-4">
                    {(() => {
                      try {
                        // Intentar parsear como JSON (formato base64)
                        const imageData = JSON.parse(selectedRequest.receipt_url);
                        if (imageData.data) {
                          return (
                            <>
                              <img 
                                src={imageData.data} 
                                alt="Comprobante de transferencia"
                                className="max-w-full h-auto rounded-lg shadow-lg"
                              />
                              <div className="mt-2 text-sm text-gray-600">
                                <p><strong>Archivo:</strong> {imageData.name}</p>
                                <p><strong>Tamaño:</strong> {(imageData.size / 1024).toFixed(1)} KB</p>
                                <p><strong>Tipo:</strong> {imageData.type}</p>
                              </div>
                            </>
                          );
                        }
                      } catch (error) {
                        // Si no es JSON, tratar como URL
                        return (
                          <img 
                            src={selectedRequest.receipt_url} 
                            alt="Comprobante de transferencia"
                            className="max-w-full h-auto rounded-lg shadow-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">Imagen no disponible</div>';
                              }
                            }}
                          />
                        );
                      }
                    })()}
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
