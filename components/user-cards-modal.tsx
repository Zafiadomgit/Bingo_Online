"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Eye, Download, CheckCircle } from "lucide-react"

// Función para generar números aleatorios de bingo
const generateBingoNumbers = (): number[] => {
  const numbers: number[] = []
  
  // Generar números para cada columna
  // B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
  const ranges = [
    { min: 1, max: 15, count: 5 },   // B
    { min: 16, max: 30, count: 5 }, // I
    { min: 31, max: 45, count: 5 }, // N
    { min: 46, max: 60, count: 5 }, // G
    { min: 61, max: 75, count: 5 }  // O
  ]
  
  ranges.forEach(range => {
    const columnNumbers: number[] = []
    while (columnNumbers.length < range.count) {
      const randomNum = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
      if (!columnNumbers.includes(randomNum)) {
        columnNumbers.push(randomNum)
      }
    }
    numbers.push(...columnNumbers.sort((a, b) => a - b))
  })
  
  return numbers
}

interface UserCard {
  id: string
  card_number: number
  numbers: number[]
  game_id: string
  game_name: string
  created_at: string
  is_winner: boolean
}

interface UserCardsModalProps {
  userEmail: string
  onClose: () => void
}

export function UserCardsModal({ userEmail, onClose }: UserCardsModalProps) {
  const [cards, setCards] = useState<UserCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null)

  useEffect(() => {
    loadUserCards()
  }, [userEmail])

  const loadUserCards = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/user-cards?email=${encodeURIComponent(userEmail)}`)
      const data = await response.json()
      
      if (data.success) {
        // Generar números aleatorios únicos para cada cartón
        const cardsWithNumbers = data.cards.map((card: UserCard) => ({
          ...card,
          numbers: generateBingoNumbers()
        }))
        setCards(cardsWithNumbers)
      }
    } catch (error) {
      console.error('Error loading user cards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getBingoColumnLetter = (number: number) => {
    if (number >= 1 && number <= 15) return 'B'
    if (number >= 16 && number <= 30) return 'I'
    if (number >= 31 && number <= 45) return 'N'
    if (number >= 46 && number <= 60) return 'G'
    if (number >= 61 && number <= 75) return 'O'
    return 'B'
  }

  const renderBingoCard = (card: UserCard) => {
    const numbers = card.numbers
    const columns = ['B', 'I', 'N', 'G', 'O']
    const columnNumbers = {
      'B': numbers.filter(n => n >= 1 && n <= 15).sort((a, b) => a - b),
      'I': numbers.filter(n => n >= 16 && n <= 30).sort((a, b) => a - b),
      'N': numbers.filter(n => n >= 31 && n <= 45).sort((a, b) => a - b),
      'G': numbers.filter(n => n >= 46 && n <= 60).sort((a, b) => a - b),
      'O': numbers.filter(n => n >= 61 && n <= 75).sort((a, b) => a - b)
    }

    return (
      <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Cartón #{card.card_number}</h3>
          <p className="text-sm text-gray-600">{card.game_name}</p>
          {card.is_winner && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 mt-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              ¡GANADOR!
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-5 gap-1">
          {columns.map((letter, colIndex) => (
            <div key={letter} className="text-center">
              <div className="bg-blue-600 text-white font-bold py-1 text-sm rounded-t">
                {letter}
              </div>
              <div className="space-y-1">
                {Array.from({ length: 5 }, (_, rowIndex) => {
                  const number = columnNumbers[letter as keyof typeof columnNumbers][rowIndex]
                  return (
                    <div
                      key={`${letter}-${rowIndex}`}
                      className="bg-gray-100 border border-gray-300 rounded text-center py-1 text-sm font-medium min-h-[32px] flex items-center justify-center"
                    >
                      {number || ''}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]"
      onClick={(e) => {
        // Solo cerrar si se hace click en el fondo (no en el contenido del modal)
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <Card 
        className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-4 border-green-400 shadow-2xl"
        onClick={(e) => {
          // Prevenir que el click en el contenido del modal cierre el modal
          e.stopPropagation()
        }}
      >
        <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-3">
                <CheckCircle className="w-8 h-8" />
                MIS CARTONES APROBADOS
              </CardTitle>
              <CardDescription className="text-white/90 text-lg mt-2">
                {cards.length} cartón{cards.length !== 1 ? 'es' : ''} listo{cards.length !== 1 ? 's' : ''} para jugar
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando tus cartones...</p>
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">No tienes cartones aprobados</h3>
              <p className="text-gray-600">Compra cartones y espera la aprobación del administrador</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{cards.length}</div>
                    <div className="text-sm text-green-700">Total Cartones</div>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                      {cards.filter(c => c.is_winner).length}
                    </div>
                    <div className="text-sm text-yellow-700">Cartones Ganadores</div>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {new Set(cards.map(c => c.game_id)).size}
                    </div>
                    <div className="text-sm text-blue-700">Juegos Diferentes</div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de cartones */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                  <div key={card.id} className="relative">
                    <div className="group cursor-pointer" onClick={() => setSelectedCard(card)}>
                      {renderBingoCard(card)}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/90 rounded-full p-2">
                          <Eye className="w-6 h-6 text-gray-700" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalle del cartón */}
      {selectedCard && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[10000]"
          onClick={(e) => {
            // Solo cerrar si se hace click en el fondo (no en el contenido del modal)
            if (e.target === e.currentTarget) {
              setSelectedCard(null)
            }
          }}
        >
          <Card 
            className="w-full max-w-2xl bg-white/95 backdrop-blur-lg border-4 border-blue-400 shadow-2xl"
            onClick={(e) => {
              // Prevenir que el click en el contenido del modal cierre el modal
              e.stopPropagation()
            }}
          >
            <CardHeader className="bg-blue-400 text-white p-6 flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-bold">
                Cartón #{selectedCard.card_number}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedCard(null)} className="text-white hover:bg-white/20">
                <X className="w-6 h-6" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedCard.game_name}</h3>
                <p className="text-gray-600">Creado: {new Date(selectedCard.created_at).toLocaleString('es-CO', { hour12: true })}</p>
                {selectedCard.is_winner && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 mt-2">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    ¡CARTÓN GANADOR!
                  </Badge>
                )}
              </div>
              
              <div className="flex justify-center">
                {renderBingoCard(selectedCard)}
              </div>
              
              <div className="mt-6 text-center">
                <Button
                  onClick={() => {
                    // Aquí podrías implementar la descarga del cartón como imagen
                    console.log('Descargar cartón:', selectedCard.id)
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Cartón
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
