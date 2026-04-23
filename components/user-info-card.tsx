import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, User, Coins } from "lucide-react"

interface UserInfoCardProps {
  user: {
    id: string
    email: string
    display_name: string | null
    credits: number
  }
  game: {
    id: string
    name: string
    card_price: number
    max_cards: number
  }
  cardCount: number
  onPurchaseCard: () => void
  isPurchasing?: boolean
}

export function UserInfoCard({ 
  user, 
  game, 
  cardCount, 
  onPurchaseCard, 
  isPurchasing = false 
}: UserInfoCardProps) {
  const canPurchase = user.credits >= game.card_price && cardCount < game.max_cards
  const totalCost = game.card_price
  const remainingCredits = user.credits - totalCost

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Información del Jugador
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información del usuario */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Jugador:</span>
            <span className="font-medium">{user.display_name || user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Créditos disponibles:</span>
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{user.credits.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Información del juego */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Juego:</span>
            <span className="font-medium">{game.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Precio por cartón:</span>
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{game.card_price.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Cartones vendidos:</span>
            <Badge variant="secondary">{cardCount} / {game.max_cards}</Badge>
          </div>
        </div>

        {/* Resumen de compra */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Costo total:</span>
            <div className="flex items-center gap-1">
              <CreditCard className="h-4 w-4 text-green-500" />
              <span className="font-medium text-green-600">{totalCost.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Créditos restantes:</span>
            <span className={`font-medium ${remainingCredits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {remainingCredits.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Botón de compra */}
        <Button 
          onClick={onPurchaseCard}
          disabled={!canPurchase || isPurchasing}
          className="w-full"
          variant={canPurchase ? "default" : "secondary"}
        >
          {isPurchasing ? "Comprando..." : 
           !canPurchase ? 
             (user.credits < game.card_price ? "Saldo insuficiente" : "Sin cartones disponibles") :
             `Comprar cartón ($${totalCost.toLocaleString()})`
          }
        </Button>

        {/* Advertencias */}
        {user.credits < game.card_price && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Saldo insuficiente:</strong> Necesitas ${game.card_price - user.credits} más para comprar este cartón.
            </p>
          </div>
        )}

        {cardCount >= game.max_cards && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Juego completo:</strong> Se han vendido todos los cartones disponibles.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

