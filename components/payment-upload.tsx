import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, CheckCircle, AlertCircle, FileImage } from "lucide-react"

interface PaymentUploadProps {
  gameId: string
  amount: number
  onPaymentSubmitted: (paymentId: string) => void
}

interface PaymentData {
  amount: number
  paymentMethod: string
  reference: string
  notes?: string
}

export function PaymentUpload({ gameId, amount, onPaymentSubmitted }: PaymentUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentData>({
    amount,
    paymentMethod: "",
    reference: "",
    notes: ""
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive",
      })
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo es demasiado grande. Máximo 5MB",
        variant: "destructive",
      })
      return
    }

    setUploadedFile(file)
    
    // Crear preview
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async () => {
    if (!uploadedFile) {
      toast({
        title: "Error",
        description: "Debes subir un comprobante de pago",
        variant: "destructive",
      })
      return
    }

    if (!paymentData.paymentMethod || !paymentData.reference) {
      toast({
        title: "Error",
        description: "Completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Crear FormData para enviar archivo
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('gameId', gameId)
      formData.append('amount', paymentData.amount.toString())
      formData.append('paymentMethod', paymentData.paymentMethod)
      formData.append('reference', paymentData.reference)
      formData.append('notes', paymentData.notes || '')

      const response = await fetch('/api/payment/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "¡Comprobante enviado!",
          description: "Tu comprobante ha sido enviado para validación",
        })
        onPaymentSubmitted(data.paymentId)
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al enviar el comprobante",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error uploading payment:', error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Subir Comprobante de Pago
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Información del pago */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Monto a pagar:</span>
            <Badge variant="secondary" className="text-lg font-bold">
              ${paymentData.amount.toLocaleString()}
            </Badge>
          </div>
          <p className="text-sm text-blue-700">
            Sube una foto o captura de pantalla de tu comprobante de pago
          </p>
        </div>

        {/* Subida de archivo */}
        <div className="space-y-4">
          <Label htmlFor="payment-file">Comprobante de pago</Label>
          
          {!uploadedFile ? (
            <div
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileImage className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 mb-2">Haz clic para subir una imagen</p>
              <p className="text-sm text-slate-500">PNG, JPG, JPEG (máximo 5MB)</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">{uploadedFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="ml-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {previewUrl && (
                <div className="border rounded-lg p-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full h-48 object-contain mx-auto rounded"
                  />
                </div>
              )}
            </div>
          )}

          <Input
            ref={fileInputRef}
            id="payment-file"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Datos del pago */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="payment-method">Método de pago *</Label>
            <select
              id="payment-method"
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecciona método</option>
              <option value="transferencia">Transferencia bancaria</option>
              <option value="pago_movil">Pago móvil</option>
              <option value="zelle">Zelle</option>
              <option value="paypal">PayPal</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Número de referencia *</Label>
            <Input
              id="reference"
              type="text"
              placeholder="Ej: 123456789"
              value={paymentData.reference}
              onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas adicionales (opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Cualquier información adicional sobre el pago..."
            value={paymentData.notes}
            onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
            rows={3}
          />
        </div>

        {/* Botón de envío */}
        <Button
          onClick={handleSubmit}
          disabled={!uploadedFile || isUploading}
          className="w-full"
        >
          {isUploading ? "Enviando..." : "Enviar Comprobante"}
        </Button>

        {/* Información adicional */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Importante:</p>
              <ul className="text-xs space-y-1">
                <li>• El comprobante será revisado manualmente</li>
                <li>• Recibirás confirmación por email una vez validado</li>
                <li>• Si hay problemas, te contactaremos</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
