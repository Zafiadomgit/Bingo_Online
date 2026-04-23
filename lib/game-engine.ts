import type { BingoGame } from "./types"
import { checkBingoWin } from "./bingo-utils"

export class GameEngine {
  private games: Map<string, BingoGame> = new Map()
  private cards: Map<string, any[]> = new Map()

  constructor() {
    // Inicializar con un juego de prueba
    this.initializeTestGame()
  }

  private initializeTestGame() {
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

  async startGame(gameId: string): Promise<{ success: boolean; error?: string }> {
    const game = this.games.get(gameId)
    if (!game) {
      return { success: false, error: "Juego no encontrado" }
    }

    if (game.status !== "waiting") {
      return { success: false, error: "El juego ya ha comenzado o terminado" }
    }

    const cards = this.cards.get(gameId) || []
    if (cards.length === 0) {
      return { success: false, error: "No hay cartones vendidos para este juego" }
    }

    game.status = "active"
    game.started_at = new Date().toISOString()
    this.games.set(gameId, game)

    return { success: true }
  }

  async drawNextNumber(gameId: string): Promise<{ success: boolean; number?: number; error?: string }> {
    const game = this.games.get(gameId)
    if (!game) {
      return { success: false, error: "Juego no encontrado" }
    }

    if (game.status !== "active") {
      return { success: false, error: "El juego no está activo" }
    }

    // Generar lista de números disponibles (1-75)
    const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1)
    const availableNumbers = allNumbers.filter((num) => !game.numbers_called.includes(num))

    if (availableNumbers.length === 0) {
      return { success: false, error: "Todos los números han sido llamados" }
    }

    // Seleccionar número aleatorio
    const randomIndex = Math.floor(Math.random() * availableNumbers.length)
    const drawnNumber = availableNumbers[randomIndex]

    // Actualizar el juego con el nuevo número
    game.current_number = drawnNumber
    game.numbers_called = [...game.numbers_called, drawnNumber]
    this.games.set(gameId, game)

    // Verificar si hay ganadores después de este número
    await this.checkForWinners(gameId, game.numbers_called)

    return { success: true, number: drawnNumber }
  }

  private async checkForWinners(gameId: string, calledNumbers: number[]): Promise<void> {
    const cards = this.cards.get(gameId) || []
    const winners: string[] = []

    // Verificar cada cartón
    for (const card of cards) {
      if (!card.is_winner) {
        const isWinner = checkBingoWin(card.numbers, card.marked_positions || [], calledNumbers)

        if (isWinner) {
          winners.push(card.id)
          card.is_winner = true
        }
      }
    }

    // Si hay ganadores, terminar el juego
    if (winners.length > 0) {
      const game = this.games.get(gameId)
      if (game) {
        game.status = "finished"
        game.winner_id = winners[0]
        game.finished_at = new Date().toISOString()
        this.games.set(gameId, game)
      }
    }
  }

  async getGameState(gameId: string): Promise<BingoGame | null> {
    return this.games.get(gameId) || null
  }

  async resetGame(gameId: string): Promise<{ success: boolean; error?: string }> {
    const game = this.games.get(gameId)
    if (!game) {
      return { success: false, error: "Juego no encontrado" }
    }

    if (game.status !== "finished") {
      return { success: false, error: "Solo se pueden reiniciar juegos terminados" }
    }

    // Resetear el juego
    game.status = "waiting"
    game.current_number = null
    game.numbers_called = []
    game.winner_id = null
    game.started_at = null
    game.finished_at = null
    this.games.set(gameId, game)

    // Limpiar cartones
    this.cards.set(gameId, [])

    return { success: true }
  }

  async createNewGame(
    name: string,
    maxCards = 100,
    cardPrice = 500,
  ): Promise<{ success: boolean; gameId?: string; error?: string }> {
    try {
      const gameId = `game-${Date.now()}`
      const newGame: BingoGame = {
        id: gameId,
        name,
        max_cards: maxCards,
        card_price: cardPrice,
        status: "waiting",
        current_number: null,
        numbers_called: [],
        prize_pool: 0,
        created_at: new Date().toISOString(),
        host_id: 'test-host'
      }

      this.games.set(gameId, newGame)
      this.cards.set(gameId, [])

      return { success: true, gameId }
    } catch (error) {
      console.error("Error creating game:", error)
      return { success: false, error: "Error interno del servidor" }
    }
  }
}