"use client"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getBingoColumnLetter } from "@/lib/bingo-utils"

interface NumberDisplayProps {
  currentNumber: number | null
  calledNumbers: number[]
  className?: string
}

export function NumberDisplay({ currentNumber, calledNumbers, className }: NumberDisplayProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Número actual */}
      <Card className="p-8 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-muted-foreground">Número Actual</h2>
          {currentNumber ? (
            <div className="space-y-1">
              <div className="text-6xl font-bold text-primary">{getBingoColumnLetter(currentNumber - 1)}</div>
              <div className="text-8xl font-bold text-primary">{currentNumber}</div>
            </div>
          ) : (
            <div className="text-4xl text-muted-foreground">Esperando...</div>
          )}
        </div>
      </Card>

      {/* Números llamados */}
      <Card className="p-4">
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
    </div>
  )
}
