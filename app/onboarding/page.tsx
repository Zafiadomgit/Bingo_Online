"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { OnboardingModal } from "@/components/onboarding-modal"

export default function OnboardingPage() {
  const router = useRouter()

  const handleOnboardingComplete = () => {
    // Redirigir al login después de completar el onboarding
    // El usuario puede iniciar sesión y acceder al sistema
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          ¡Bienvenido a Bingo Fortuna! 🎉
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Te guiaremos paso a paso para que aprendas a jugar
        </p>
        
        {/* El modal se abre automáticamente */}
        <OnboardingModal 
          isOpen={true} 
          onClose={handleOnboardingComplete} 
        />
      </div>
    </div>
  )
}
