"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, CheckCircle, XCircle, Clock } from "lucide-react"

interface CardNumber {
  number: number
  status: 'reserved' | 'used' | 'available'
  user_email?: string
  game_id?: string
}

interface CardNumberSelectorProps {
  onSelect: (numbers: number[]) => void
  selectedNumbers?: number[]
  userEmail: string
  quantity: number // Cantidad de cartones a seleccionar
  gameId?: string // ID del juego para filtrar números
  maxCards?: number // Número máximo de cartones disponibles en el juego
  disabled?: boolean // Si el selector está deshabilitado
}

export function CardNumberSelector({ onSelect, selectedNumbers = [], userEmail, quantity, gameId, maxCards = 100, disabled = false }: CardNumberSelectorProps) {
  const [cardNumbers, setCardNumbers] = useState<CardNumber[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<'all' | 'available' | 'reserved' | 'used'>('all')
  const [localSelectedNumbers, setLocalSelectedNumbers] = useState<number[]>(selectedNumbers)

  useEffect(() => {
    loadCardNumbers()
  }, [gameId])

  useEffect(() => {
    setLocalSelectedNumbers(selectedNumbers)
  }, [selectedNumbers])

  const handleNumberClick = (number: number) => {
    const isAlreadySelected = localSelectedNumbers.includes(number)
    
    if (isAlreadySelected) {
      // Deseleccionar
      const newSelection = localSelectedNumbers.filter(n => n !== number)
      setLocalSelectedNumbers(newSelection)
      onSelect(newSelection)
    } else {
      // Seleccionar si no hemos alcanzado el límite
      if (localSelectedNumbers.length < quantity) {
        const newSelection = [...localSelectedNumbers, number]
        setLocalSelectedNumbers(newSelection)
        onSelect(newSelection)
      }
    }
  }

  const loadCardNumbers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/card-numbers${gameId ? `?gameId=${gameId}` : ''}`)
      const data = await response.json()
      
      if (data.success) {
        setCardNumbers(data.cardNumbers)
      }
    } catch (error) {
      console.error('Error loading card numbers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'reserved':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'used':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Disponible</Badge>
      case 'reserved':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Reservado</Badge>
      case 'used':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Usado</Badge>
      default:
        return null
    }
  }

  const filteredNumbers = cardNumbers.filter(card => {
    const matchesSearch = card.number.toString().includes(searchTerm)
    const matchesFilter = filter === 'all' || card.status === filter
    return matchesSearch && matchesFilter
  })

  // La API ya filtra por gameId, usar cardNumbers directamente
  const gameCardNumbers = cardNumbers
  const availableNumbers = Array.from({ length: maxCards }, (_, i) => i + 1).filter(num => 
    !gameCardNumbers.find(card => card.number === num && (card.status === 'reserved' || card.status === 'used' || card.status === 'confirmed'))
  )
  const reservedNumbers = gameCardNumbers.filter(card => card.status === 'reserved')
  const usedNumbers = gameCardNumbers.filter(card => card.status === 'used' || card.status === 'confirmed')

  if (isLoading) {
    return (
      <Card className="bg-white border-2 border-blue-200">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando números de cartón...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-2 border-blue-200">
      <CardHeader className="bg-blue-50 border-b border-blue-200">
        <CardTitle className="text-xl font-bold text-blue-800 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Seleccionar Números de Cartones ({localSelectedNumbers.length}/{quantity})
        </CardTitle>
        <p className="text-blue-600 text-sm">
          Elige {quantity} {quantity === 1 ? 'número' : 'números'} del 1 al {maxCards} para tus cartones. Los números disponibles se marcan en verde.
        </p>
        {localSelectedNumbers.length < quantity && (
          <p className="text-yellow-600 text-sm font-semibold mt-2">
            ⚠️ Selecciona {quantity - localSelectedNumbers.length} {quantity - localSelectedNumbers.length === 1 ? 'número más' : 'números más'}
          </p>
        )}
        {localSelectedNumbers.length === quantity && (
          <p className="text-green-600 text-sm font-semibold mt-2">
            ✅ Has seleccionado todos los números requeridos
          </p>
        )}
      </CardHeader>
      <CardContent className="p-6">
        {/* Filtros y búsqueda */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={disabled}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
                }`}
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              disabled={disabled}
              className={`px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
              }`}
            >
              <option value="all">Todos</option>
              <option value="available">Disponibles</option>
              <option value="reserved">Reservados</option>
              <option value="used">Usados</option>
            </select>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{availableNumbers.length}</div>
              <div className="text-sm text-green-700">Disponibles</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{reservedNumbers.length}</div>
              <div className="text-sm text-yellow-700">Reservados</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{usedNumbers.length}</div>
              <div className="text-sm text-red-700">Usados</div>
            </div>
          </div>
        </div>

        {/* Grid de números */}
        <div className="grid grid-cols-10 gap-2 max-h-96 overflow-y-auto">
          {Array.from({ length: maxCards }, (_, i) => i + 1).map((number) => {
            // Buscar si este número está reservado/usado para ESTE juego específico
            const cardData = cardNumbers.find(card => 
              card.number === number
            )
            const rawStatus = cardData?.status || 'available'
            const status = rawStatus === 'confirmed' ? 'used' : rawStatus
            const isSelected = localSelectedNumbers.includes(number)
            
            // Solo considerar reservado si está reservado para ESTE juego específico
            const isReservedForThisGame = cardData && (cardData.status === 'reserved' || cardData.status === 'used' || cardData.status === 'confirmed')
            const isReservedByUser = cardData?.user_email === userEmail
            const isReservedByOther = isReservedForThisGame && cardData.user_email !== userEmail
            const isAvailable = !isReservedForThisGame
            
            const selectionIndex = localSelectedNumbers.indexOf(number)
            const canSelect = (isAvailable || isReservedByUser || isSelected) && !isReservedByOther

            return (
              <Button
                key={number}
                type="button"
                onClick={() => canSelect && !disabled && handleNumberClick(number)}
                disabled={!canSelect || disabled}
                className={`h-12 w-12 p-0 text-sm font-bold transition-all duration-200 relative ${
                  disabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200'
                    : isSelected
                    ? 'bg-blue-500 text-white shadow-lg scale-110 ring-2 ring-blue-300'
                    : isReservedByOther
                    ? 'bg-red-100 text-red-800 border-2 border-red-300 cursor-not-allowed'
                    : isAvailable
                    ? 'bg-green-100 text-green-800 hover:bg-green-200 border-2 border-green-300'
                    : isReservedByUser
                    ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                }`}
              >
                {number}
                {isSelected && (
                  <span className="absolute -top-1 -right-1 bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border border-blue-500">
                    {selectionIndex + 1}
                  </span>
                )}
              </Button>
            )
          })}
        </div>

        {/* Información de números seleccionados */}
        {localSelectedNumbers.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-blue-800">
                Números seleccionados ({localSelectedNumbers.length}/{quantity}):
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {localSelectedNumbers.map((num, index) => (
                <div key={num} className="flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-full">
                  <span className="text-xs font-bold text-blue-600">{index + 1}.</span>
                  <span className="font-bold text-blue-800">{num}</span>
                  <button type="button"
                    onClick={() => handleNumberClick(num)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="text-blue-600 text-sm">
              Estos números serán reservados para tus cartones. Los números dentro de cada cartón se generarán aleatoriamente.
            </p>
          </div>
        )}

        {/* Leyenda */}
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
            <span>Reservado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
            <span>Usado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

