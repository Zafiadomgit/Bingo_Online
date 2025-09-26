import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, DollarSign, Clock } from "lucide-react"

interface GameStatsProps {
  totalPlayers: number
  prizePool: number
  gameStatus: "waiting" | "active" | "finished"
}

export function GameStats({ totalPlayers, prizePool, gameStatus }: GameStatsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "waiting":
        return "bg-yellow-500"
      case "finished":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "En Juego"
      case "waiting":
        return "Esperando"
      case "finished":
        return "Terminado"
      default:
        return "Desconocido"
    }
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Estadísticas del Juego
          <Badge className={getStatusColor(gameStatus)}>{getStatusText(gameStatus)}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Players */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-600" />
              <span className="text-slate-600">Jugadores:</span>
            </div>
            <span className="font-medium text-slate-800">{totalPlayers}</span>
          </div>

          {/* Prize Pool */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-slate-600" />
              <span className="text-slate-600">Premio:</span>
            </div>
            <span className="font-medium text-green-600">${prizePool.toLocaleString()}</span>
          </div>

          {/* Game Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-600" />
              <span className="text-slate-600">Estado:</span>
            </div>
            <span className="font-medium text-slate-800">{getStatusText(gameStatus)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
