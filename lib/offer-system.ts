// Sistema de ofertas para cartones de bingo

export interface CardOffer {
  id: string
  name: string
  description: string
  selectCount: number
  payCount: number
  discount: number // Porcentaje de descuento
  isActive: boolean
  gameId?: string // Si es específico para un juego
  validUntil?: string // Fecha de expiración
  maxUses?: number // Máximo número de usos
  currentUses?: number // Usos actuales
}

export interface OfferCalculation {
  originalPrice: number
  discountedPrice: number
  savings: number
  discountPercentage: number
  offer: CardOffer
}

// Ofertas predefinidas
export const DEFAULT_OFFERS: CardOffer[] = [
  {
    id: '4x3',
    name: 'Oferta 4x3',
    description: 'Selecciona 4 cartones, paga por 3',
    selectCount: 4,
    payCount: 3,
    discount: 25,
    isActive: true
  },
  {
    id: '5x4',
    name: 'Oferta 5x4',
    description: 'Selecciona 5 cartones, paga por 4',
    selectCount: 5,
    payCount: 4,
    discount: 20,
    isActive: true
  },
  {
    id: '10x8',
    name: 'Oferta 10x8',
    description: 'Selecciona 10 cartones, paga por 8',
    selectCount: 10,
    payCount: 8,
    discount: 20,
    isActive: true
  },
  {
    id: '20x15',
    name: 'Oferta 20x15',
    description: 'Selecciona 20 cartones, paga por 15',
    selectCount: 20,
    payCount: 15,
    discount: 25,
    isActive: true
  }
]

export class OfferSystem {
  private offers: CardOffer[] = []

  constructor(offers: CardOffer[] = DEFAULT_OFFERS) {
    this.offers = offers
  }

  // Obtener ofertas disponibles para un juego
  getAvailableOffers(gameId?: string, cardPrice?: number): CardOffer[] {
    return this.offers.filter(offer => {
      if (!offer.isActive) return false
      if (offer.gameId && offer.gameId !== gameId) return false
      if (offer.validUntil && new Date(offer.validUntil) < new Date()) return false
      if (offer.maxUses && offer.currentUses && offer.currentUses >= offer.maxUses) return false
      return true
    })
  }

  // Calcular precio con oferta
  calculateOfferPrice(offer: CardOffer, cardPrice: number, quantity: number): OfferCalculation {
    const originalPrice = cardPrice * quantity
    const discountedPrice = cardPrice * offer.payCount
    const savings = originalPrice - discountedPrice
    const discountPercentage = Math.round((savings / originalPrice) * 100)

    return {
      originalPrice,
      discountedPrice,
      savings,
      discountPercentage,
      offer
    }
  }

  // Validar si una oferta se puede aplicar
  validateOffer(offer: CardOffer, quantity: number, userCredits: number, cardPrice: number): {
    isValid: boolean
    error?: string
  } {
    // Verificar cantidad mínima
    if (quantity < offer.selectCount) {
      return {
        isValid: false,
        error: `Mínimo ${offer.selectCount} cartones para esta oferta`
      }
    }

    // Verificar si la oferta está activa
    if (!offer.isActive) {
      return {
        isValid: false,
        error: 'Esta oferta no está disponible'
      }
    }

    // Verificar fecha de expiración
    if (offer.validUntil && new Date(offer.validUntil) < new Date()) {
      return {
        isValid: false,
        error: 'Esta oferta ha expirado'
      }
    }

    // Verificar usos máximos
    if (offer.maxUses && offer.currentUses && offer.currentUses >= offer.maxUses) {
      return {
        isValid: false,
        error: 'Esta oferta ha alcanzado su límite de usos'
      }
    }

    // Verificar créditos del usuario
    const calculation = this.calculateOfferPrice(offer, cardPrice, quantity)
    if (userCredits < calculation.discountedPrice) {
      return {
        isValid: false,
        error: 'Créditos insuficientes para esta oferta'
      }
    }

    return { isValid: true }
  }

  // Aplicar oferta
  applyOffer(offer: CardOffer, quantity: number, cardPrice: number): OfferCalculation {
    return this.calculateOfferPrice(offer, cardPrice, quantity)
  }

  // Obtener la mejor oferta para una cantidad
  getBestOffer(quantity: number, cardPrice: number, gameId?: string): CardOffer | null {
    const availableOffers = this.getAvailableOffers(gameId, cardPrice)
    
    let bestOffer: CardOffer | null = null
    let bestSavings = 0

    for (const offer of availableOffers) {
      if (quantity >= offer.selectCount) {
        const calculation = this.calculateOfferPrice(offer, cardPrice, quantity)
        if (calculation.savings > bestSavings) {
          bestSavings = calculation.savings
          bestOffer = offer
        }
      }
    }

    return bestOffer
  }

  // Agregar nueva oferta
  addOffer(offer: CardOffer): void {
    this.offers.push(offer)
  }

  // Actualizar oferta
  updateOffer(offerId: string, updates: Partial<CardOffer>): boolean {
    const index = this.offers.findIndex(offer => offer.id === offerId)
    if (index !== -1) {
      this.offers[index] = { ...this.offers[index], ...updates }
      return true
    }
    return false
  }

  // Eliminar oferta
  removeOffer(offerId: string): boolean {
    const index = this.offers.findIndex(offer => offer.id === offerId)
    if (index !== -1) {
      this.offers.splice(index, 1)
      return true
    }
    return false
  }

  // Obtener todas las ofertas
  getAllOffers(): CardOffer[] {
    return this.offers
  }
}

// Instancia global del sistema de ofertas
export const offerSystem = new OfferSystem()
