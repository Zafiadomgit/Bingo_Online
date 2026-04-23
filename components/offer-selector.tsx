import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Gift, Percent, ShoppingCart } from "lucide-react"

interface OfferSelectorProps {
  game: {
    id: string
    name: string
    card_price: number
    max_cards: number
  }
  userCredits: number
  onPurchaseCards: (quantity: number, totalCost: number) => void
  isPurchasing?: boolean
}

const OFFERS = [
  { id: 1, quantity: 1, discount: 0, description: "1 cartón" },
  { id: 2, quantity: 2, discount: 0, description: "2 cartones" },
  { id: 3, quantity: 3, discount: 0, description: "3 cartones" },
  { id: 4, quantity: 4, discount: 1, description: "4 cartones (paga 3)", isSpecial: true },
  { id: 5, quantity: 5, discount: 1, description: "5 cartones (paga 4)", isSpecial: true },
  { id: 6, quantity: 10, discount: 2, description: "10 cartones (paga 8)", isSpecial: true },
]

export function OfferSelector({ game, userCredits, onPurchaseCards, isPurchasing = false }: OfferSelectorProps) {
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null)

  const getOfferCost = (offer: typeof OFFERS[0]) => {
    const actualQuantity = offer.quantity - offer.discount
    return actualQuantity * game.card_price
  }

  const getSavings = (offer: typeof OFFERS[0]) => {
    const originalCost = offer.quantity * game.card_price
    const offerCost = getOfferCost(offer)
    return originalCost - offerCost
  }

  const canAfford = (offer: typeof OFFERS[0]) => {
    return userCredits >= getOfferCost(offer)
  }

  const handlePurchase = () => {
    if (!selectedOffer) return
    
    const offer = OFFERS.find(o => o.id === selectedOffer)
    if (!offer) return

    const totalCost = getOfferCost(offer)
    onPurchaseCards(offer.quantity, totalCost)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Ofertas Especiales
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {OFFERS.map((offer) => {
            const cost = getOfferCost(offer)
            const savings = getSavings(offer)
            const canBuy = canAfford(offer)
            const isSelected = selectedOffer === offer.id

            return (
              <div
                key={offer.id}
                className={`border rounded-lg p-3 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : canBuy 
                      ? 'border-slate-200 hover:border-slate-300' 
                      : 'border-slate-200 bg-slate-50 opacity-50'
                }`}
                onClick={() => canBuy && setSelectedOffer(offer.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={isSelected}
                      disabled={!canBuy}
                    />
                    <span className="font-medium">{offer.description}</span>
                    {offer.isSpecial && (
                      <Badge variant="destructive" className="text-xs">
                        <Percent className="h-3 w-3 mr-1" />
                        Oferta
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Costo:</span>
                    <span className="font-medium">{cost.toLocaleString()} créditos</span>
                  </div>
                  
                  {savings > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Ahorras:</span>
                      <span className="font-medium text-green-600">{savings.toLocaleString()} créditos</span>
                    </div>
                  )}

                  {!canBuy && (
                    <div className="text-xs text-red-600">
                      Créditos insuficientes
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {selectedOffer && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-600">Resumen de compra:</span>
              <div className="flex items-center gap-1">
                <ShoppingCart className="h-4 w-4" />
                <span className="font-medium">
                  {OFFERS.find(o => o.id === selectedOffer)?.quantity} cartones
                </span>
              </div>
            </div>

            <Button 
              onClick={handlePurchase}
              disabled={isPurchasing}
              className="w-full"
            >
              {isPurchasing ? "Comprando..." : `Comprar por ${getOfferCost(OFFERS.find(o => o.id === selectedOffer)!).toLocaleString()} créditos`}
            </Button>
          </div>
        )}

        <div className="text-xs text-slate-500 text-center">
          Las ofertas especiales te permiten ahorrar créditos comprando múltiples cartones
        </div>
      </CardContent>
    </Card>
  )
}

