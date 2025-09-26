"use client"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getBingoColumnLetter } from "@/lib/bingo-utils"

interface CalledNumbersProps {
  calledNumbers: number[]
  className?: string
}

export function CalledNumbers({ calledNumbers, className }: CalledNumbersProps) {
  return (
    <Card className={cn("p-4", className)}>
      <h3 className="text-lg font-bold mb-4 text-center">Números Llamados ({calledNumbers.length}/75)</h3>
      <div className="grid grid-cols-15 gap-1 max-h-40 overflow-y-auto">
        {Array.from({ length: 75 }, (_, i) => i + 1).map((number) => {
          const isCalled = calledNumbers.includes(number)
          const columnLetter = getBingoColumnLetter(number - 1)

          return (
            <div
              key={number}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200",
                isCalled
                  ? "bg-primary text-primary-foreground scale-110"
                  : "bg-muted text-muted-foreground border border-border",
              )}
              title={`${columnLetter}-${number}`}
            >
              {number}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
