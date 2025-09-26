import { type NextRequest, NextResponse } from "next/server"
import { GameEngine } from "@/lib/game-engine"

export async function POST(request: NextRequest) {
  try {
    const { name, maxCards, cardPrice } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Game name is required" }, { status: 400 })
    }

    const gameEngine = new GameEngine()
    const result = await gameEngine.createNewGame(name, maxCards, cardPrice)

    if (result.success) {
      return NextResponse.json({
        success: true,
        gameId: result.gameId,
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Create game error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
