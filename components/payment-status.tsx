import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye,
  Download,
  RefreshCw
} from "lucide-react"

interface Payment {
  id: string
  amount: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  payment_method: string
  receipt_url: string
  created_at: string
  completed_at: string | null
}

interface PaymentStatusProps {
  userId: string
  gameId?: string
}

export function PaymentStatus({ userId, gameId }: PaymentStatusProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadPayments()
  }, [userId, gameId])

  const loadPayments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/payments?userId=${userId}${gameId ? `&gameId=${gameId}` : ''}`)
      const data = await response.json()

      if (data.success) {
        setPayments(data.payments)
      } else {
        toast({
          title: "Error",
          description: "Error al cargar los pagos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading payments:', error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'CANCELLED':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case 'COMPLETED':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completado</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Rechazado</Badge>
      case 'CANCELLED':
        return <Badge variant="outline">Cancelado</Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleViewReceipt = (receiptUrl: string) => {
    window.open(receiptUrl, '_blank')
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
            <span className="ml-2 text-slate-600">Cargando pagos...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (payments.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No hay pagos registrados</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Historial de Pagos</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPayments}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(payment.status)}
                  <span className="font-medium">
                    ${payment.amount.toLocaleString()}
                  </span>
                </div>
                {getStatusBadge(payment.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                <div>
                  <span className="font-medium">Método:</span> {payment.payment_method}
                </div>
                <div>
                  <span className="font-medium">Fecha:</span> {formatDate(payment.created_at)}
                </div>
                {payment.completed_at && (
                  <div>
                    <span className="font-medium">Completado:</span> {formatDate(payment.completed_at)}
                  </div>
                )}
              </div>

              {payment.receipt_url && (
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewReceipt(payment.receipt_url)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Comprobante
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(payment.receipt_url, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Descargar
                  </Button>
                </div>
              )}

              {payment.status === 'PENDING' && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Pendiente de validación:</strong> Tu comprobante está siendo revisado. 
                    Recibirás una notificación cuando sea procesado.
                  </p>
                </div>
              )}

              {payment.status === 'FAILED' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Pago rechazado:</strong> Tu comprobante no pudo ser validado. 
                    Por favor, contacta al soporte si crees que es un error.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
