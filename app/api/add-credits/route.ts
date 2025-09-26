import { type NextRequest, NextResponse } from "next/server"
import { BingoService } from "@/lib/bingo-service"

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 })
    }

    const bingoService = new BingoService()
    const user = await bingoService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const success = await bingoService.addCredits(user.id, amount)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to add credits" }, { status: 500 })
    }
  } catch (error) {
    console.error("Add credits error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
