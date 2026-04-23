"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { X, Upload, CreditCard, User, Phone, MapPin, FileText } from "lucide-react"
import { CardNumberSelector } from "@/components/card-number-selector"
import { useCurrency, formatCurrencyWithSymbol } from "@/hooks/use-currency"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PurchaseFormProps {
  onClose: () => void
  onSuccess: () => void
  gameId?: string
  maxCards?: number
  cardPrice?: number
  gameStatus?: 'WAITING' | 'ACTIVE' | 'FINISHED'
  gameName?: string
  currency?: string
}

export function PurchaseForm({ onClose, onSuccess, gameId, maxCards = 100, cardPrice = 1.00, gameStatus, gameName, currency = 'USD' }: PurchaseFormProps) {
  const { user } = useAuth()
  const { formatCurrency } = useCurrency()
  
  // Función para formatear moneda usando la moneda del juego específico
  const formatGameCurrency = (amount: number | string) => {
    const gameCurrency = (currency as 'USD' | 'VES') || 'USD'
    return formatCurrencyWithSymbol(amount, gameCurrency)
  }
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    cedula: "",
    cantidadCartones: 1 as number | '',
    numeroReferencia: ""
  })
  const [promoter, setPromoter] = useState("")
  const [promotersList, setPromotersList] = useState<{id: string, name: string}[]>([])
  const [transferImage, setTransferImage] = useState<File | null>(null)
  const [selectedCardNumbers, setSelectedCardNumbers] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Cargar promotores desde la base de datos
  useEffect(() => {
    const fetchPromoters = async () => {
      try {
        const response = await fetch('/api/admin/promoters')
        const data = await response.json()
        if (data.success) {
          setPromotersList(data.promoters)
        }
      } catch (error) {
        console.error('Error fetching promoters:', error)
      }
    }
    fetchPromoters()
  }, [])

  // Verificar si se pueden hacer compras
  const canPurchase = gameStatus === 'WAITING'
  const statusMessage = gameStatus === 'ACTIVE' 
    ? 'El juego ya ha comenzado. No se pueden comprar más cartones.'
    : gameStatus === 'FINISHED'
    ? 'El juego ya terminó. No se pueden comprar cartones para este juego.'
    : null

  // Auto-llenar datos del usuario logueado
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email,
        nombres: user.display_name?.split(' ')[0] || "",
        apellidos: user.display_name?.split(' ').slice(1).join(' ') || ""
      }))
    }
  }, [user])

  // Debug: Ver estado de validación
  useEffect(() => {
    console.log('=== ESTADO DE VALIDACIÓN ===')
    console.log('selectedCardNumbers:', selectedCardNumbers)
    console.log('selectedCardNumbers.length:', selectedCardNumbers.length)
    console.log('formData.cantidadCartones:', formData.cantidadCartones)
    console.log('transferImage:', transferImage ? 'SÍ' : 'NO')
    console.log('¿Son iguales?:', selectedCardNumbers.length === formData.cantidadCartones)
    console.log('¿Botón habilitado?:', !isSubmitting && !!transferImage && selectedCardNumbers.length === formData.cantidadCartones)
  }, [selectedCardNumbers, formData.cantidadCartones, transferImage, isSubmitting])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Si cambia la cantidad de cartones, limpiar selección de números si es necesario
    if (name === 'cantidadCartones') {
      // Permitir valores vacíos temporalmente
      const newQuantity = value === '' ? '' : parseInt(value) || ''
      setFormData(prev => ({
        ...prev,
        [name]: newQuantity
      }))
      
      // Si la nueva cantidad es menor que los números seleccionados, limpiar
      const numericQuantity = typeof newQuantity === 'number' ? newQuantity : 0
      if (selectedCardNumbers.length > numericQuantity) {
        setSelectedCardNumbers([])
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Solo se permiten archivos de imagen",
        })
        return
      }
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen debe ser menor a 5MB",
        })
        return
      }
      setTransferImage(file)
    }
  }

  // Helper para obtener el valor numérico de cantidadCartones
  const getNumericQuantity = () => {
    return typeof formData.cantidadCartones === 'number' ? formData.cantidadCartones : 0
  }

  const calculateTotal = () => {
    return getNumericQuantity() * cardPrice // Precio por cartón del juego
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

        // Validar que la imagen sea obligatoria
        if (!transferImage) {
          toast({
            title: "Error",
            description: "Debes subir una imagen del comprobante de transferencia",
          })
          setIsSubmitting(false)
          return
        }

        // Validar que se hayan seleccionado todos los números de cartón
        const quantity = getNumericQuantity()
        if (!quantity || selectedCardNumbers.length !== quantity) {
          toast({
            title: "Error",
            description: `Debes seleccionar ${quantity || 1} número${(quantity || 1) > 1 ? 's' : ''} de cartón`,
          })
          setIsSubmitting(false)
          return
        }

    try {
      const formDataToSend = new FormData()
      
      // Agregar datos del formulario
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, String(value))
      })

      // Agregar imagen (obligatoria)
      formDataToSend.append('transferImage', transferImage)
      
      // Agregar números de cartón seleccionados
      formDataToSend.append('cardNumbers', JSON.stringify(selectedCardNumbers))
      
      // Agregar gameId
      if (gameId) {
        formDataToSend.append('gameId', gameId)
      }
      
      // Agregar promotor
      formDataToSend.append('promoter', promoter)

      // Agregar user_id del usuario logueado
      if (user?.id) {
        formDataToSend.append('userId', user.id)
      }

      const response = await fetch('/api/purchase/request', {
        method: 'POST',
        body: formDataToSend,
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "¡Solicitud enviada!",
          description: "Tu solicitud de compra ha sido enviada. Espera la confirmación del administrador.",
        })
        onSuccess()
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al enviar la solicitud",
        })
      }
    } catch (error) {
      console.error('Error submitting purchase:', error)
      toast({
        title: "Error",
        description: "Error al enviar la solicitud. Inténtalo de nuevo.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-4 border-green-400 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-3">
                <CreditCard className="w-8 h-8" />
                COMPRAR CARTONES
              </CardTitle>
              <CardDescription className="text-white/90 text-lg mt-2">
                Completa tus datos para adquirir cartones de bingo
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* 🚫 Alerta de estado del juego */}
          {!canPurchase && statusMessage && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <X className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-red-800">Compras No Disponibles</h4>
                  <p className="text-red-700">{statusMessage}</p>
                  {gameName && (
                    <p className="text-sm text-red-600 mt-1">Juego: {gameName}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5" />
                Información Personal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombres" className="text-sm font-semibold">Nombres *</Label>
                  <Input
                    id="nombres"
                    name="nombres"
                    value={formData.nombres}
                    onChange={handleInputChange}
                    required
                    className="rounded-lg border-2 border-gray-300 focus:border-green-500"
                    placeholder="Tu nombre"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apellidos" className="text-sm font-semibold">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleInputChange}
                    required
                    className="rounded-lg border-2 border-gray-300 focus:border-green-500"
                    placeholder="Tus apellidos"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="rounded-lg border-2 border-gray-300 focus:border-green-500"
                    placeholder="tu@email.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="telefono" className="text-sm font-semibold">Teléfono *</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    required
                    className="rounded-lg border-2 border-gray-300 focus:border-green-500"
                    placeholder="+58 412 123 4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cedula" className="text-sm font-semibold">Cédula *</Label>
                  <Input
                    id="cedula"
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleInputChange}
                    required
                    className="rounded-lg border-2 border-gray-300 focus:border-green-500"
                    placeholder="V-12345678"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cantidadCartones" className="text-sm font-semibold">Cantidad de Cartones *</Label>
                  <Input
                    id="cantidadCartones"
                    name="cantidadCartones"
                    type="number"
                    max="50"
                    value={formData.cantidadCartones}
                    onChange={handleInputChange}
                    required
                    className="rounded-lg border-2 border-gray-300 focus:border-green-500"
                  />
                </div>
              </div>

             <div className="space-y-2">
                <Label htmlFor="promoter" className="text-sm font-semibold">Promotor (Opcional)</Label>
                <Select value={promoter} onValueChange={setPromoter}>
                  <SelectTrigger className="w-full rounded-lg border-2 border-gray-300 focus:border-green-500 bg-white">
                    <SelectValue placeholder="Selecciona un promotor" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-[100]">
                    <SelectItem value="none">Sin promotor</SelectItem>
                    {promotersList.map((p) => (
                      <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroReferencia" className="text-sm font-semibold">Número de Referencia de Pago *</Label>
                <Input
                  id="numeroReferencia"
                  name="numeroReferencia"
                  value={formData.numeroReferencia}
                  onChange={handleInputChange}
                  required
                  className="rounded-lg border-2 border-gray-300 focus:border-green-500"
                  placeholder="Ej: REF123456789"
                />
                <p className="text-xs text-gray-500">
                  Ingresa el número de referencia que aparece en tu comprobante de transferencia
                </p>
              </div>

            </div>

            {/* Información de Pago */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Información de Pago
              </h3>
              
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5 text-yellow-600" />
                  <span className="font-bold text-yellow-800">Datos para Pago Móvil</span>
                </div>
                <p className="text-yellow-700 mb-3 font-semibold">
                  Realiza una transferencia por el monto total usando estos datos:
                </p>
                <div className="bg-white border border-yellow-400 rounded p-4 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Teléfono:</p>
                      <p className="font-bold text-lg text-gray-800">📱 04121980898</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Cédula:</p>
                      <p className="font-bold text-lg text-gray-800">🆔 25874520</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Código:</p>
                      <p className="font-bold text-lg text-gray-800">🔢 0108</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Banco:</p>
                      <p className="font-bold text-lg text-gray-800">🏦 Provincial</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-green-800">Total a Pagar:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatGameCurrency(calculateTotal())}
                  </span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  {getNumericQuantity()} cartón{getNumericQuantity() > 1 ? 'es' : ''} × {formatGameCurrency(cardPrice)} c/u
                </p>
              </div>
            </div>

                {/* Selección de Número de Cartón */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Seleccionar Número de Cartón *
                  </h3>
                  <CardNumberSelector
                    onSelect={setSelectedCardNumbers}
                    selectedNumbers={selectedCardNumbers}
                    userEmail={formData.email}
                    quantity={getNumericQuantity()}
                    gameId={gameId}
                    maxCards={maxCards}
                    disabled={!canPurchase}
                  />
                </div>

                {/* Carga de Comprobante */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Comprobante de Transferencia *
                  </h3>
              
              <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                transferImage 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-red-300 bg-red-50 hover:border-red-400'
              }`}>
                <input
                  type="file"
                  id="transferImage"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="transferImage"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className={`w-8 h-8 ${transferImage ? 'text-green-500' : 'text-red-400'}`} />
                  <span className={`font-medium ${transferImage ? 'text-green-700' : 'text-red-600'}`}>
                    {transferImage ? "✅ Imagen cargada" : "⚠️ Haz clic para subir imagen (OBLIGATORIO)"}
                  </span>
                  <span className="text-sm text-gray-500">
                    PNG, JPG, JPEG (máx. 5MB)
                  </span>
                </label>
              </div>

              {transferImage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="text-green-700 font-medium">
                      ✅ Imagen seleccionada: {transferImage.name}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-lg border-2 border-gray-300 hover:border-gray-400"
              >
                Cancelar
              </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !transferImage || selectedCardNumbers.length !== getNumericQuantity() || !canPurchase}
                    className={`flex-1 rounded-lg font-bold py-3 ${
                      !transferImage || selectedCardNumbers.length !== getNumericQuantity() || !canPurchase
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600'
                    } text-white`}
                  >
                    {isSubmitting 
                      ? "Enviando..." 
                      : !transferImage 
                        ? "Sube una imagen primero" 
                        : selectedCardNumbers.length !== getNumericQuantity()
                          ? `Selecciona ${getNumericQuantity()} número${getNumericQuantity() > 1 ? 's' : ''} de cartón`
                          : "Enviar Solicitud"
                    }
                  </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
