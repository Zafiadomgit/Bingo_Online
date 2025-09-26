import { type NextRequest, NextResponse } from "next/server"
import { BingoService } from "@/lib/bingo-service"

export async function POST(request: NextRequest) {
  try {
    const { gameId } = await request.json()

    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 })
    }

    const bingoService = new BingoService()
    const result = await bingoService.purchaseCard(gameId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        card: result.card,
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Purchase card error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
