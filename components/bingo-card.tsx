"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BingoCard } from "@/lib/types"

interface BingoCardProps {
  card: BingoCard
  isInteractive?: boolean
  onMarkPosition?: (position: number) => void
  calledNumbers?: number[]
}

export function BingoCardComponent({
  card,
  isInteractive = false,
  onMarkPosition,
  calledNumbers = [],
}: BingoCardProps) {
  const [localMarkedPositions, setLocalMarkedPositions] = useState<boolean[]>(card.marked_positions)

  const handleCellClick = (position: number) => {
    if (!isInteractive) return

    const newMarkedPositions = [...localMarkedPositions]
    newMarkedPositions[position] = !newMarkedPositions[position]
    setLocalMarkedPositions(newMarkedPositions)

    if (onMarkPosition) {
      onMarkPosition(position)
    }
  }

  const isNumberCalled = (number: number) => {
    return calledNumbers.includes(number)
  }

  const isCellMarked = (position: number) => {
    return localMarkedPositions[position] || (card.numbers[position] !== 0 && isNumberCalled(card.numbers[position]))
  }

  const renderCell = (position: number) => {
    const number = card.numbers[position]
    const isMarked = isCellMarked(position)
    const isFreeSpace = number === 0
    const isCalled = isNumberCalled(number)

    return (
      <Button
        key={position}
        variant="outline"
        className={cn(
          "h-12 w-12 p-0 text-sm font-bold transition-all duration-200",
          isMarked && "bg-primary text-primary-foreground",
          isCalled && !isMarked && "bg-yellow-200 text-yellow-800",
          isFreeSpace && "bg-green-500 text-white",
          isInteractive && "hover:bg-accent hover:text-accent-foreground cursor-pointer",
          !isInteractive && "cursor-default",
        )}
        onClick={() => handleCellClick(position)}
        disabled={!isInteractive}
      >
        {isFreeSpace ? "FREE" : number}
      </Button>
    )
  }

  return (
    <Card className="p-4 w-fit">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-primary">BINGO</h3>
        <p className="text-sm text-muted-foreground">Cartón #{card.card_number}</p>
      </div>

      {/* Header con letras B-I-N-G-O */}
      <div className="grid grid-cols-5 gap-1 mb-2">
        {["B", "I", "N", "G", "O"].map((letter) => (
          <div key={letter} className="h-8 flex items-center justify-center font-bold text-primary text-lg">
            {letter}
          </div>
        ))}
      </div>

      {/* Grid de números */}
      <div className="grid grid-cols-5 gap-1">{Array.from({ length: 25 }, (_, i) => renderCell(i))}</div>

      {card.is_winner && (
        <div className="mt-4 text-center">
          <span className="inline-block bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            ¡GANADOR!
          </span>
        </div>
      )}
    </Card>
  )
}

export { BingoCardComponent as BingoCard }
