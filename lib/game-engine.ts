import { createClient } from "@/lib/supabase/server"
import type { BingoGame } from "./types"
import { checkBingoWin } from "./bingo-utils"

export class GameEngine {
  private supabase

  constructor() {
    this.supabase = createClient()
  }

  async startGame(gameId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: game, error: gameError } = await this.supabase
        .from("bingo_games")
        .select("*")
        .eq("id", gameId)
        .single()

      if (gameError || !game) {
        return { success: false, error: "Juego no encontrado" }
      }

      if (game.status !== "waiting") {
        return { success: false, error: "El juego ya ha comenzado o terminado" }
      }

      // Verificar que hay al menos un cartón vendido
      const { count } = await this.supabase
        .from("bingo_cards")
        .select("*", { count: "exact", head: true })
        .eq("game_id", gameId)

      if (!count || count === 0) {
        return { success: false, error: "No hay cartones vendidos para este juego" }
      }

      // Iniciar el juego
      const { error: updateError } = await this.supabase
        .from("bingo_games")
        .update({
          status: "active",
          started_at: new Date().toISOString(),
        })
        .eq("id", gameId)

      if (updateError) {
        return { success: false, error: "Error al iniciar el juego" }
      }

      return { success: true }
    } catch (error) {
      console.error("Error starting game:", error)
      return { success: false, error: "Error interno del servidor" }
    }
  }

  async drawNextNumber(gameId: string): Promise<{ success: boolean; number?: number; error?: string }> {
    try {
      const { data: game, error: gameError } = await this.supabase
        .from("bingo_games")
        .select("*")
        .eq("id", gameId)
        .single()

      if (gameError || !game) {
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
      const updatedNumbersCalled = [...game.numbers_called, drawnNumber]

      const { error: updateError } = await this.supabase
        .from("bingo_games")
        .update({
          current_number: drawnNumber,
          numbers_called: updatedNumbersCalled,
        })
        .eq("id", gameId)

      if (updateError) {
        return { success: false, error: "Error al actualizar el juego" }
      }

      // Verificar si hay ganadores después de este número
      await this.checkForWinners(gameId, updatedNumbersCalled)

      return { success: true, number: drawnNumber }
    } catch (error) {
      console.error("Error drawing number:", error)
      return { success: false, error: "Error interno del servidor" }
    }
  }

  private async checkForWinners(gameId: string, calledNumbers: number[]): Promise<void> {
    try {
      // Obtener todos los cartones del juego
      const { data: cards, error: cardsError } = await this.supabase
        .from("bingo_cards")
        .select("*")
        .eq("game_id", gameId)
        .eq("is_winner", false)

      if (cardsError || !cards) return

      const winners: string[] = []

      // Verificar cada cartón
      for (const card of cards) {
        const isWinner = checkBingoWin(card.numbers, card.marked_positions, calledNumbers)

        if (isWinner) {
          winners.push(card.id)

          // Marcar el cartón como ganador
          await this.supabase.from("bingo_cards").update({ is_winner: true }).eq("id", card.id)
        }
      }

      // Si hay ganadores, terminar el juego
      if (winners.length > 0) {
        const firstWinner = cards.find((card) => winners.includes(card.id))

        await this.supabase
          .from("bingo_games")
          .update({
            status: "finished",
            winner_id: firstWinner?.user_id,
            finished_at: new Date().toISOString(),
          })
          .eq("id", gameId)
      }
    } catch (error) {
      console.error("Error checking for winners:", error)
    }
  }

  async getGameState(gameId: string): Promise<BingoGame | null> {
    try {
      const { data: game, error } = await this.supabase.from("bingo_games").select("*").eq("id", gameId).single()

      if (error) return null
      return game
    } catch (error) {
      console.error("Error getting game state:", error)
      return null
    }
  }

  async resetGame(gameId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar que el juego existe y está terminado
      const { data: game, error: gameError } = await this.supabase
        .from("bingo_games")
        .select("*")
        .eq("id", gameId)
        .single()

      if (gameError || !game) {
        return { success: false, error: "Juego no encontrado" }
      }

      if (game.status !== "finished") {
        return { success: false, error: "Solo se pueden reiniciar juegos terminados" }
      }

      // Eliminar todos los cartones del juego anterior
      await this.supabase.from("bingo_cards").delete().eq("game_id", gameId)

      // Eliminar todos los pagos del juego anterior
      await this.supabase.from("payments").delete().eq("game_id", gameId)

      // Resetear el juego
      const { error: updateError } = await this.supabase
        .from("bingo_games")
        .update({
          status: "waiting",
          current_number: null,
          numbers_called: [],
          winner_id: null,
          started_at: null,
          finished_at: null,
        })
        .eq("id", gameId)

      if (updateError) {
        return { success: false, error: "Error al reiniciar el juego" }
      }

      return { success: true }
    } catch (error) {
      console.error("Error resetting game:", error)
      return { success: false, error: "Error interno del servidor" }
    }
  }

  async createNewGame(
    name: string,
    maxCards = 100,
    cardPrice = 500,
  ): Promise<{ success: boolean; gameId?: string; error?: string }> {
    try {
      const { data: game, error } = await this.supabase
        .from("bingo_games")
        .insert({
          name,
          max_cards: maxCards,
          card_price: cardPrice,
          status: "waiting",
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: "Error al crear el juego" }
      }

      return { success: true, gameId: game.id }
    } catch (error) {
      console.error("Error creating game:", error)
      return { success: false, error: "Error interno del servidor" }
    }
  }
}
