import { createClient } from "@/lib/supabase/server"
import type { BingoGame, BingoCard, Profile } from "./types"

export class BingoService {
  private supabase

  constructor() {
    this.supabase = createClient()
  }

  async getCurrentUser(): Promise<Profile | null> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()
    if (!user) return null

    let { data: profile, error } = await this.supabase.from("profiles").select("*").eq("id", user.id).maybeSingle() // Usar maybeSingle en lugar de single para evitar error si no existe

    // Si no existe el perfil, crearlo
    if (!profile && !error) {
      console.log("[v0] Profile not found, creating new profile for user:", user.id)

      const { data: newProfile, error: insertError } = await this.supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email || "",
          display_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "Usuario",
          credits: 1000,
        })
        .select()
        .single()

      if (insertError) {
        console.error("[v0] Error creating profile:", insertError)
        throw new Error(`Error creando perfil: ${insertError.message}`)
      }

      profile = newProfile
    } else if (error) {
      console.error("[v0] Error fetching profile:", error)
      throw new Error(`Error obteniendo perfil: ${error.message}`)
    }

    return profile
  }

  async getActiveGames(): Promise<BingoGame[]> {
    const { data, error } = await this.supabase
      .from("bingo_games")
      .select("*")
      .in("status", ["waiting", "active"])
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  }

  async getGame(gameId: string): Promise<BingoGame | null> {
    const { data, error } = await this.supabase.from("bingo_games").select("*").eq("id", gameId).single()

    if (error) throw error
    return data
  }

  async getUserCards(gameId: string, userId: string): Promise<BingoCard[]> {
    const { data, error } = await this.supabase
      .from("bingo_cards")
      .select("*")
      .eq("game_id", gameId)
      .eq("user_id", userId)
      .order("card_number")

    if (error) throw error
    return data || []
  }

  async getGameCardCount(gameId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("bingo_cards")
      .select("*", { count: "exact", head: true })
      .eq("game_id", gameId)

    if (error) throw error
    return count || 0
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

      // Generar números del cartón
      const { data: cardNumbers, error: numbersError } = await this.supabase.rpc("generate_bingo_card_numbers")

      if (numbersError) throw numbersError

      // Crear el cartón
      const { data: card, error: cardError } = await this.supabase
        .from("bingo_cards")
        .insert({
          game_id: gameId,
          user_id: user.id,
          card_number: cardCount + 1,
          numbers: cardNumbers,
        })
        .select()
        .single()

      if (cardError) throw cardError

      // Crear el pago
      const { error: paymentError } = await this.supabase.from("payments").insert({
        user_id: user.id,
        game_id: gameId,
        amount: game.card_price,
        status: "completed",
        payment_method: "credits",
      })

      if (paymentError) throw paymentError

      // Descontar créditos del usuario
      const { error: updateError } = await this.supabase
        .from("profiles")
        .update({ credits: user.credits - game.card_price })
        .eq("id", user.id)

      if (updateError) throw updateError

      return { success: true, card }
    } catch (error) {
      console.error("Error purchasing card:", error)
      return { success: false, error: "Error al comprar el cartón" }
    }
  }

  async addCredits(userId: string, amount: number): Promise<boolean> {
    try {
      const { data: profile } = await this.supabase.from("profiles").select("credits").eq("id", userId).single()

      if (!profile) return false

      const { error } = await this.supabase
        .from("profiles")
        .update({ credits: profile.credits + amount })
        .eq("id", userId)

      return !error
    } catch (error) {
      console.error("Error adding credits:", error)
      return false
    }
  }
}
