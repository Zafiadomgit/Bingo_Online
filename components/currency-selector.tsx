"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DollarSign } from "lucide-react"

interface CurrencySelectorProps {
  value: 'USD' | 'VES'
  onChange: (currency: 'USD' | 'VES') => void
  className?: string
}

export function CurrencySelector({ value, onChange, className = "" }: CurrencySelectorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="outline" className="bg-blue-50 border-blue-300">
        <DollarSign className="w-3 h-3 mr-1" />
        Ver en:
      </Badge>
      <Select value={value} onValueChange={(val) => onChange(val as 'USD' | 'VES')}>
        <SelectTrigger className="w-32 bg-white border-2 border-blue-300 hover:border-blue-500 transition-colors">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="USD">
            <div className="flex items-center gap-2">
              <span className="font-bold">$</span>
              <span>USD (Dólares)</span>
            </div>
          </SelectItem>
          <SelectItem value="VES">
            <div className="flex items-center gap-2">
              <span className="font-bold">Bs.</span>
              <span>Bolívares</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
