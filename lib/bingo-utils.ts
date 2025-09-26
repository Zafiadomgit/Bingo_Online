// Utilidades para validar cartones de bingo y verificar ganadores

export function checkBingoWin(numbers: number[], markedPositions: boolean[], calledNumbers: number[]): boolean {
  // Marcar automáticamente los números que han sido llamados
  const effectiveMarked = [...markedPositions]
  numbers.forEach((number, index) => {
    if (number === 0 || calledNumbers.includes(number)) {
      effectiveMarked[index] = true
    }
  })

  // Verificar filas
  for (let row = 0; row < 5; row++) {
    let rowComplete = true
    for (let col = 0; col < 5; col++) {
      const index = row * 5 + col
      if (!effectiveMarked[index]) {
        rowComplete = false
        break
      }
    }
    if (rowComplete) return true
  }

  // Verificar columnas
  for (let col = 0; col < 5; col++) {
    let colComplete = true
    for (let row = 0; row < 5; row++) {
      const index = row * 5 + col
      if (!effectiveMarked[index]) {
        colComplete = false
        break
      }
    }
    if (colComplete) return true
  }

  // Verificar diagonal principal (top-left to bottom-right)
  let diag1Complete = true
  for (let i = 0; i < 5; i++) {
    const index = i * 5 + i
    if (!effectiveMarked[index]) {
      diag1Complete = false
      break
    }
  }
  if (diag1Complete) return true

  // Verificar diagonal secundaria (top-right to bottom-left)
  let diag2Complete = true
  for (let i = 0; i < 5; i++) {
    const index = i * 5 + (4 - i)
    if (!effectiveMarked[index]) {
      diag2Complete = false
      break
    }
  }
  if (diag2Complete) return true

  return false
}

export function formatCredits(credits: number): string {
  return credits.toLocaleString()
}

export function getBingoColumnLetter(position: number): string {
  const col = position % 5
  return ["B", "I", "N", "G", "O"][col]
}

export function getBingoNumberRange(columnLetter: string): [number, number] {
  switch (columnLetter) {
    case "B":
      return [1, 15]
    case "I":
      return [16, 30]
    case "N":
      return [31, 45]
    case "G":
      return [46, 60]
    case "O":
      return [61, 75]
    default:
      return [1, 75]
  }
}

export function generateBingoCard(): import("@/lib/types").BingoCard {
  const numbers: number[] = []

  // Generate B column (1-15)
  const bNumbers = generateUniqueNumbers(1, 15, 5)
  // Generate I column (16-30)
  const iNumbers = generateUniqueNumbers(16, 30, 5)
  // Generate N column (31-45) with FREE space in middle
  const nNumbers = generateUniqueNumbers(31, 45, 4)
  // Generate G column (46-60)
  const gNumbers = generateUniqueNumbers(46, 60, 5)
  // Generate O column (61-75)
  const oNumbers = generateUniqueNumbers(61, 75, 5)

  // Arrange numbers in grid format
  for (let row = 0; row < 5; row++) {
    numbers.push(bNumbers[row])
    numbers.push(iNumbers[row])
    if (row === 2) {
      numbers.push(0) // FREE space
    } else {
      const nIndex = row < 2 ? row : row - 1
      numbers.push(nNumbers[nIndex])
    }
    numbers.push(gNumbers[row])
    numbers.push(oNumbers[row])
  }

  return {
    id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    card_number: Math.floor(Math.random() * 10000) + 1,
    numbers,
    marked_positions: new Array(25).fill(false),
    is_winner: false,
    user_id: "test-user",
    game_id: "test-game",
    created_at: new Date().toISOString(),
  }
}

function generateUniqueNumbers(min: number, max: number, count: number): number[] {
  const numbers: number[] = []
  const available = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * available.length)
    numbers.push(available[randomIndex])
    available.splice(randomIndex, 1)
  }

  return numbers
}

export function checkForWin(card: import("@/lib/types").BingoCard, calledNumbers: number[]): boolean {
  return checkBingoWin(card.numbers, card.marked_positions, calledNumbers)
}
