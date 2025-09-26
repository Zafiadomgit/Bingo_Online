"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Profile, BingoGame, BingoCard } from "@/lib/types"
import { useRouter } from "next/navigation"

export default function GamePage() {
  console.log("[v0] GamePage component rendering")

  const [user, setUser] = useState<Profile | null>(null)
  const [games, setGames] = useState<BingoGame[]>([])
  const [selectedGame, setSelectedGame] = useState<BingoGame | null>(null)
  const [userCards, setUserCards] = useState<BingoCard[]>([])
  const [cardCount, setCardCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const supabase = createClient()

  useEffect(() => {
    console.log("[v0] useEffect running - checking user and loading games")
    checkUser()
    loadGames()
  }, [])

  const checkUser = async () => {
    try {
      console.log("[v0] Checking user authentication")
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      console.log("[v0] Auth user:", authUser)

      if (!authUser) {
        console.log("[v0] No authenticated user, redirecting to login")
        router.push("/auth/login")
        return
      }

      console.log("[v0] Loading user profile")
      const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle()

      console.log("[v0] Profile data:", profile)
      console.log("[v0] Profile error:", error)

      if (error) {
        console.error("[v0] Error loading profile:", error)
        setProfileError("Error cargando perfil de usuario")
      } else if (!profile) {
        console.log("[v0] Profile not found, attempting to create")
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: authUser.id,
            email: authUser.email || "",
            display_name: authUser.user_metadata?.display_name || authUser.email?.split("@")[0] || "Usuario",
            credits: 1000,
          })
          .select()
          .single()

        if (insertError) {
          console.error("[v0] Error creating profile:", insertError)
          setProfileError("Error creando perfil de usuario")
        } else {
          console.log("[v0] Profile created successfully:", newProfile)
          setUser(newProfile)
          setProfileError(null)
        }
      } else {
        setUser(profile)
        setProfileError(null)
      }
    } catch (error) {
      console.error("[v0] Error in checkUser:", error)
      setProfileError("Error verificando usuario")
    }
  }

  const loadGames = async () => {
    try {
      console.log("[v0] Loading games")
      const { data, error } = await supabase
        .from("bingo_games")
        .select("*")
        .in("status", ["waiting", "active"])
        .order("created_at", { ascending: false })

      console.log("[v0] Games data:", data)
      console.log("[v0] Games error:", error)

      if (error) {
        console.error("[v0] Error loading games:", error)
        setError("Error cargando juegos")
        return
      }

      setGames(data || [])
      if (data && data.length > 0 && !selectedGame) {
        setSelectedGame(data[0])
        console.log("[v0] Selected first game:", data[0])
      }
    } catch (error) {
      console.error("[v0] Error in loadGames:", error)
      setError("Error cargando juegos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    console.log("[v0] Logging out")
    await supabase.auth.signOut()
    router.push("/")
  }

  const handlePurchaseCard = async () => {
    if (!selectedGame || !user) return

    try {
      console.log("[v0] Purchasing card for game:", selectedGame.id)

      if (user.credits < selectedGame.card_price) {
        toast({
          title: "Créditos insuficientes",
          description: "No tienes suficientes créditos para comprar este cartón",
          variant: "destructive",
        })
        return
      }

      // Generar números del cartón
      const { data: cardNumbers, error: numbersError } = await supabase.rpc("generate_bingo_card_numbers")

      if (numbersError) {
        console.error("[v0] Error generating card numbers:", numbersError)
        toast({
          title: "Error",
          description: "Error generando números del cartón",
          variant: "destructive",
        })
        return
      }

      // Obtener el número de cartones actuales
      const { count } = await supabase
        .from("bingo_cards")
        .select("*", { count: "exact", head: true })
        .eq("game_id", selectedGame.id)

      const cardNumber = (count || 0) + 1

      // Crear el cartón
      const { data: card, error: cardError } = await supabase
        .from("bingo_cards")
        .insert({
          game_id: selectedGame.id,
          user_id: user.id,
          card_number: cardNumber,
          numbers: cardNumbers,
        })
        .select()
        .single()

      if (cardError) {
        console.error("[v0] Error creating card:", cardError)
        toast({
          title: "Error",
          description: "Error creando el cartón",
          variant: "destructive",
        })
        return
      }

      // Actualizar créditos del usuario
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ credits: user.credits - selectedGame.card_price })
        .eq("id", user.id)

      if (updateError) {
        console.error("[v0] Error updating credits:", updateError)
        toast({
          title: "Error",
          description: "Error actualizando créditos",
          variant: "destructive",
        })
        return
      }

      // Actualizar estado local
      setUser({ ...user, credits: user.credits - selectedGame.card_price })
      setUserCards([...userCards, card])

      toast({
        title: "¡Cartón comprado!",
        description: `Cartón #${cardNumber} comprado exitosamente`,
      })
    } catch (error) {
      console.error("[v0] Error purchasing card:", error)
      toast({
        title: "Error",
        description: "Error comprando el cartón",
        variant: "destructive",
      })
    }
  }

  console.log("[v0] Render state:", { isLoading, user, games, error, profileError })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
          <div className="text-2xl font-bold text-slate-900 mb-2">Cargando...</div>
          <div className="text-slate-600">Preparando tu juego de bingo</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">BINGO ONLINE</h1>
              <p className="text-sm text-slate-600">
                {user ? `¡Hola, ${user.display_name || user.email}!` : "Cargando perfil..."}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="text-right">
                  <div className="text-sm text-slate-600">Créditos</div>
                  <div className="text-lg font-bold text-blue-600">{user.credits.toLocaleString()}</div>
                </div>
              )}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="rounded-xl border-slate-200 hover:bg-slate-50 bg-transparent"
              >
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {profileError && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <div className="text-yellow-600 font-medium">⚠️ Advertencia</div>
              <div className="text-yellow-700">{profileError}</div>
              <Button size="sm" variant="outline" onClick={checkUser} className="ml-auto rounded-xl bg-transparent">
                Reintentar
              </Button>
            </div>
          </div>
        )}

        {/* Game Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Juegos Disponibles</h2>
          {error ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8 text-center">
              <div className="text-red-600 mb-4">{error}</div>
              <Button onClick={loadGames} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                Reintentar
              </Button>
            </div>
          ) : games.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8 text-center">
              <div className="text-slate-600 mb-4">No hay juegos disponibles</div>
              <Button onClick={loadGames} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                Recargar
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game) => (
                <div
                  key={game.id}
                  className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedGame?.id === game.id ? "ring-2 ring-blue-500 shadow-lg" : "hover:border-slate-300"
                  }`}
                  onClick={() => setSelectedGame(game)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">{game.name}</h3>
                    <Badge variant={game.status === "waiting" ? "secondary" : "default"} className="rounded-full">
                      {game.status === "waiting" ? "Esperando" : "Activo"}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Precio:</span>
                      <span className="font-medium">{game.card_price} créditos</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cartones máx:</span>
                      <span className="font-medium">{game.max_cards}</span>
                    </div>
                    {game.numbers_called.length > 0 && (
                      <div className="flex justify-between">
                        <span>Números llamados:</span>
                        <span className="font-medium">{game.numbers_called.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedGame && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Juego Seleccionado: {selectedGame.name}</h3>
              {user && selectedGame.status === "waiting" && (
                <Button
                  onClick={handlePurchaseCard}
                  disabled={user.credits < selectedGame.card_price}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Comprar Cartón ({selectedGame.card_price} créditos)
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm text-slate-600 mb-1">Estado</div>
                <Badge variant={selectedGame.status === "waiting" ? "secondary" : "default"} className="rounded-full">
                  {selectedGame.status === "waiting" ? "Esperando" : "Activo"}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Precio</div>
                <div className="font-semibold text-slate-900">{selectedGame.card_price} créditos</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Cartones máx</div>
                <div className="font-semibold text-slate-900">{selectedGame.max_cards}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Números llamados</div>
                <div className="font-semibold text-slate-900">{selectedGame.numbers_called.length}</div>
              </div>
            </div>

            {selectedGame.current_number && (
              <div className="mt-6 text-center">
                <div className="text-sm text-slate-600 mb-2">Último número llamado</div>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white text-2xl font-bold rounded-full">
                  {selectedGame.current_number}
                </div>
              </div>
            )}

            {selectedGame.numbers_called.length > 0 && (
              <div className="mt-6">
                <div className="text-sm text-slate-600 mb-3">Números llamados:</div>
                <div className="flex flex-wrap gap-2">
                  {selectedGame.numbers_called.map((number, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center justify-center w-10 h-10 bg-slate-100 text-slate-700 text-sm font-medium rounded-full"
                    >
                      {number}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
