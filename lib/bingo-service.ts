import type { BingoGame, BingoCard, Profile } from "./types"

export class BingoService {
  private users: Map<string, Profile> = new Map()
  private games: Map<string, BingoGame> = new Map()
  private cards: Map<string, BingoCard[]> = new Map()

  constructor() {
    // Inicializar con datos de prueba
    this.initializeTestData()
  }

  private initializeTestData() {
    // Usuario de prueba
    const testUser: Profile = {
      id: 'test-user-1',
      email: 'test@example.com',
      display_name: 'Usuario de Prueba',
      credits: 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    this.users.set('test-user-1', testUser)

    // Juego de prueba
    const testGame: BingoGame = {
      id: 'test-game-1',
      name: 'Juego de Prueba',
      status: 'active',
      current_number: null,
      numbers_called: [],
      max_cards: 50,
      card_price: 100,
      prize_pool: 5000,
      created_at: new Date().toISOString(),
      host_id: 'test-host'
    }
    this.games.set('test-game-1', testGame)
    this.cards.set('test-game-1', [])
  }

  async getCurrentUser(): Promise<Profile | null> {
    // Retornar usuario de prueba
    return this.users.get('test-user-1') || null
  }

  async getActiveGames(): Promise<BingoGame[]> {
    const games = Array.from(this.games.values())
    return games.filter(game => game.status === 'waiting' || game.status === 'active')
  }

  async getGame(gameId: string): Promise<BingoGame | null> {
    return this.games.get(gameId) || null
  }

  async getUserCards(gameId: string, userId: string): Promise<BingoCard[]> {
    const cards = this.cards.get(gameId) || []
    return cards.filter(card => card.user_id === userId)
  }

  async getGameCardCount(gameId: string): Promise<number> {
    const cards = this.cards.get(gameId) || []
    return cards.length
  }

  async purchaseCard(gameId: string): Promise<{ success: boolean; card?: BingoCard; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: "Usuario no autenticado" }
      }

      const game = await this.getGame(gameId)
      if (!game) {
        return { success: false, error: "Juego no encontrado" }
      }

      if (game.status !== "waiting") {
        return { success: false, error: "El juego ya ha comenzado o terminado" }
      }

      // Verificar si el usuario tiene suficientes créditos
      if (user.credits < game.card_price) {
        return { success: false, error: "Créditos insuficientes" }
      }

      // Verificar límite de cartones
      const cardCount = await this.getGameCardCount(gameId)
      if (cardCount >= game.max_cards) {
        return { success: false, error: "No hay más cartones disponibles" }
      }

      // Generar números del cartón (simplificado)
      const cardNumbers = this.generateBingoCardNumbers()

      // Crear el cartón
      const card: BingoCard = {
        id: `card-${Date.now()}`,
        game_id: gameId,
        user_id: user.id,
        card_number: cardCount + 1,
        numbers: cardNumbers,
        marked_positions: [],
        is_winner: false,
        created_at: new Date().toISOString()
      }

      // Agregar el cartón
      const existingCards = this.cards.get(gameId) || []
      existingCards.push(card)
      this.cards.set(gameId, existingCards)

      // Descontar créditos del usuario
      user.credits -= game.card_price
      this.users.set(user.id, user)

      return { success: true, card }
    } catch (error) {
      console.error("Error purchasing card:", error)
      return { success: false, error: "Error al comprar el cartón" }
    }
  }

  private generateBingoCardNumbers(): number[] {
    // Generar 24 números únicos para el cartón de bingo
    const numbers: number[] = []
    while (numbers.length < 24) {
      const num = Math.floor(Math.random() * 75) + 1
      if (!numbers.includes(num)) {
        numbers.push(num)
      }
    }
    return numbers.sort((a, b) => a - b)
  }

  async addCredits(userId: string, amount: number): Promise<boolean> {
    try {
      const user = this.users.get(userId)
      if (!user) return false

      user.credits += amount
      this.users.set(userId, user)
      return true
    } catch (error) {
      console.error("Error adding credits:", error)
      return false
    }
  }
}