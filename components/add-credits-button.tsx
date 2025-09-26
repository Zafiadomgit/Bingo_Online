"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface AddCreditsButtonProps {
  onCreditsAdded: () => void
}

export function AddCreditsButton({ onCreditsAdded }: AddCreditsButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleAddCredits = async () => {
    const creditAmount = Number.parseInt(amount)
    if (!creditAmount || creditAmount <= 0) {
      toast({
        title: "Error",
        description: "Ingresa una cantidad válida",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/add-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: creditAmount }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "¡Créditos agregados!",
          description: `Se agregaron ${creditAmount} créditos a tu cuenta`,
        })
        setAmount("")
        setIsOpen(false)
        onCreditsAdded()
      } else {
        toast({
          title: "Error",
          description: data.error || "No se pudieron agregar los créditos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Add credits error:", error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Agregar Créditos</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Créditos</DialogTitle>
          <DialogDescription>Agrega créditos a tu cuenta para comprar cartones de bingo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Cantidad de créditos</Label>
            <Input
              id="amount"
              type="number"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setAmount("500")} variant="outline" size="sm">
              500
            </Button>
            <Button onClick={() => setAmount("1000")} variant="outline" size="sm">
              1000
            </Button>
            <Button onClick={() => setAmount("2000")} variant="outline" size="sm">
              2000
            </Button>
          </div>
          <Button onClick={handleAddCredits} disabled={isLoading} className="w-full">
            {isLoading ? "Agregando..." : "Agregar Créditos"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
