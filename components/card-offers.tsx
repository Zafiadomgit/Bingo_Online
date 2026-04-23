"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { offerSystem, type CardOffer, type OfferCalculation } from "@/lib/offer-system"
import { ShoppingCart, Percent, Gift, Zap, Star, Crown } from "lucide-react"

interface CardOffersProps {
  gameId: string
  cardPrice: number
  userCredits: number
  onPurchase: (offer: CardOffer, quantity: number) => void
  onClose?: () => void
}

export function CardOffers({ gameId, cardPrice, userCredits, onPurchase, onClose }: CardOffersProps) {
  const [offers, setOffers] = useState<CardOffer[]>([])
  const [selectedOffer, setSelectedOffer] = useState<CardOffer | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [calculation, setCalculation] = useState<OfferCalculation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadOffers()
  }, [gameId])

  useEffect(() => {
    if (selectedOffer) {
      const calc = offerSystem.calculateOfferPrice(selectedOffer, cardPrice, quantity)
      setCalculation(calc)
    }
  }, [selectedOffer, quantity, cardPrice])

  const loadOffers = () => {
    const availableOffers = offerSystem.getAvailableOffers(gameId, cardPrice)
    setOffers(availableOffers)
  }

  const handleOfferSelect = (offer: CardOffer) => {
    setSelectedOffer(offer)
    setQuantity(offer.selectCount) // Establecer cantidad mínima
  }

  const handlePurchase = async () => {
    if (!selectedOffer) return

    setIsLoading(true)
    try {
      // Validar oferta
      const validation = offerSystem.validateOffer(selectedOffer, quantity, userCredits, cardPrice)
      
      if (!validation.isValid) {
        toast({
          title: "Error",
          description: validation.error,
          variant: "destructive",
        })
        return
      }

      // Procesar compra
      await onPurchase(selectedOffer, quantity)
      
      toast({
        title: "🎉 ¡Oferta Aplicada!",
        description: `Has ahorrado ${calculation?.savings} créditos con esta oferta`,
      })

      if (onClose) onClose()
    } catch (error) {
      console.error('Error processing offer:', error)
      toast({
        title: "Error",
        description: "Error procesando la oferta",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getOfferIcon = (offer: CardOffer) => {
    if (offer.discount >= 30) return <Crown className="w-6 h-6 text-purple-500" />
    if (offer.discount >= 20) return <Star className="w-6 h-6 text-yellow-500" />
    return <Gift className="w-6 h-6 text-green-500" />
  }

  const getOfferColor = (offer: CardOffer) => {
    if (offer.discount >= 30) return "from-purple-400 to-purple-500"
    if (offer.discount >= 20) return "from-yellow-400 to-yellow-500"
    return "from-green-400 to-green-500"
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-4xl font-extrabold text-white mb-4 drop-shadow-lg">
          🎁 OFERTAS ESPECIALES 🎁
        </h2>
        <p className="text-xl text-white font-semibold">
          ¡Aprovecha estos descuentos increíbles!
        </p>
      </div>

      {/* Ofertas Disponibles */}
      <div className="grid md:grid-cols-2 gap-6">
        {offers.map((offer) => (
          <Card
            key={offer.id}
            className={`bg-white/90 backdrop-blur-sm border-4 shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer ${
              selectedOffer?.id === offer.id 
                ? 'border-yellow-400 ring-4 ring-yellow-300' 
                : 'border-gray-300 hover:border-yellow-400'
            }`}
            onClick={() => handleOfferSelect(offer)}
          >
            <CardHeader className={`bg-gradient-to-r ${getOfferColor(offer)} text-white p-6 rounded-t-lg`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getOfferIcon(offer)}
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      {offer.name}
                    </CardTitle>
                    <CardDescription className="text-gray-800 text-lg">
                      {offer.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-white text-gray-800 px-4 py-2 text-lg font-bold">
                  -{offer.discount}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gray-100 p-3 rounded-xl">
                    <div className="text-sm text-gray-600 font-bold">SELECCIONAS</div>
                    <div className="text-2xl font-extrabold text-gray-900">{offer.selectCount}</div>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-xl">
                    <div className="text-sm text-gray-600 font-bold">PAGAS</div>
                    <div className="text-2xl font-extrabold text-gray-900">{offer.payCount}</div>
                  </div>
                </div>
                
                {selectedOffer?.id === offer.id && (
                  <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 p-4 rounded-xl border-2 border-yellow-300">
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-800 mb-2">
                        ¡OFERTA SELECCIONADA!
                      </div>
                      <div className="text-sm text-yellow-700">
                        Ahorra {offer.discount}% en tu compra
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuración de Cantidad */}
      {selectedOffer && (
        <Card className="bg-white/90 backdrop-blur-sm border-4 border-blue-400 shadow-2xl">
          <CardHeader className="bg-blue-400 text-white p-6 rounded-t-lg">
            <CardTitle className="text-2xl text-center font-bold">
              🛒 CONFIGURAR COMPRA
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-lg font-bold text-gray-800">
                  Cantidad de Cartones
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min={selectedOffer.selectCount}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(selectedOffer.selectCount, parseInt(e.target.value) || selectedOffer.selectCount))}
                  className="rounded-xl border-2 border-gray-300 focus:border-blue-500 text-lg py-3"
                />
                <p className="text-sm text-gray-600">
                  Mínimo {selectedOffer.selectCount} cartones para esta oferta
                </p>
              </div>

              {/* Cálculo de Precio */}
              {calculation && (
                <div className="bg-gradient-to-r from-green-100 to-green-200 p-6 rounded-xl border-2 border-green-300">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-sm text-gray-600 font-bold">PRECIO ORIGINAL</div>
                      <div className="text-2xl font-extrabold text-gray-700 line-through">
                        {calculation.originalPrice} créditos
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 font-bold">PRECIO CON OFERTA</div>
                      <div className="text-2xl font-extrabold text-green-600">
                        {calculation.discountedPrice} créditos
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-4">
                    <div className="text-lg font-bold text-green-800">
                      💰 Ahorras: {calculation.savings} créditos ({calculation.discountPercentage}%)
                    </div>
                  </div>
                </div>
              )}

              {/* Verificación de Créditos */}
              <div className="flex items-center justify-between p-4 bg-gray-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="font-bold text-gray-800">Tus Créditos</div>
                    <div className="text-sm text-gray-600">
                      {userCredits.toLocaleString()} créditos disponibles
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {calculation && userCredits >= calculation.discountedPrice ? (
                    <Badge className="bg-green-500 text-white px-4 py-2 text-sm font-bold">
                      ✅ Suficientes
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500 text-white px-4 py-2 text-sm font-bold">
                      ❌ Insuficientes
                    </Badge>
                  )}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-4">
                <Button
                  onClick={handlePurchase}
                  disabled={!calculation || userCredits < calculation.discountedPrice || isLoading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 animate-pulse disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "🎯 PROCESANDO..." : "🎯 ¡APLICAR OFERTA!"}
                </Button>
                {onClose && (
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="border-4 border-gray-400 text-gray-700 hover:bg-gray-100 px-8 py-4 text-xl font-bold rounded-full shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
