import { type NextRequest, NextResponse } from "next/server"
import { GameEngine } from "@/lib/game-engine"

export async function POST(request: NextRequest) {
  try {
    const { gameId } = await request.json()

    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 })
    }

    const gameEngine = new GameEngine()
    const result = await gameEngine.drawNextNumber(gameId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        number: result.number,
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Draw number error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
