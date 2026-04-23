"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, ChevronRight, ChevronLeft, Play, CreditCard, Upload, CheckCircle, Gamepad2, Trophy, MessageCircle } from "lucide-react"

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "¡Bienvenido a Bingo Fortuna! 🎉",
      icon: <Play className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg text-center text-gray-700">
            Te guiaremos paso a paso para que aprendas a jugar y disfrutes de la mejor experiencia de bingo online.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-2">🎯 Objetivo del Juego</h3>
            <p className="text-blue-700">
              Completa líneas horizontales, verticales o diagonales en tus cartones para ganar premios increíbles.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "1️⃣ Ver el Próximo Juego",
      icon: <Gamepad2 className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-bold text-green-800 mb-2">📅 Información del Juego</h3>
            <ul className="text-green-700 space-y-2">
              <li>• <strong>Nombre:</strong> Se muestra en la página principal</li>
              <li>• <strong>Fecha y hora:</strong> Cuándo comenzará el juego</li>
              <li>• <strong>Precio por cartón:</strong> Costo de cada cartón</li>
              <li>• <strong>Premios:</strong> 1 línea, 2 líneas, cartón completo</li>
            </ul>
          </div>
          <div className="text-center">
            <Badge variant="outline" className="text-sm">
              💡 Tip: Los juegos programados aparecen automáticamente
            </Badge>
          </div>
        </div>
      )
    },
    {
      title: "2️⃣ Comprar Cartones",
      icon: <CreditCard className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-bold text-yellow-800 mb-2">🛒 Proceso de Compra</h3>
            <ol className="text-yellow-700 space-y-2 list-decimal list-inside">
              <li>Haz clic en <strong>"COMPRAR CARTONES"</strong></li>
              <li>Completa tus datos personales</li>
              <li>Selecciona la cantidad de cartones</li>
              <li>Elige los números de cartón disponibles</li>
            </ol>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="font-bold text-orange-800 mb-2">⚠️ Importante</h3>
            <p className="text-orange-700">
              Solo puedes comprar cartones cuando el juego está en estado <strong>"ESPERANDO"</strong>. 
              Una vez que inicie, no se pueden comprar más cartones.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "3️⃣ Realizar el Pago",
      icon: <CreditCard className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-bold text-purple-800 mb-2">💳 Información de Pago</h3>
            <div className="space-y-2 text-purple-700">
              <p><strong>Pago Móvil:</strong> Se muestra el número específico</p>
              <p><strong>Monto:</strong> Total calculado automáticamente</p>
              <p><strong>Referencia:</strong> Tu cédula o número personal</p>
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-bold text-red-800 mb-2">🚨 ¡MUY IMPORTANTE!</h3>
            <p className="text-red-700">
              <strong>Debes usar EXACTAMENTE el número de pago móvil que aparece en pantalla.</strong> 
              Cada juego tiene su propio número de pago.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "4️⃣ Cargar Comprobante",
      icon: <Upload className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-2">📱 Captura de Pantalla</h3>
            <ol className="text-blue-700 space-y-2 list-decimal list-inside">
              <li>Realiza el pago móvil</li>
              <li>Toma una captura de pantalla del comprobante</li>
              <li>Sube la imagen en el formulario</li>
              <li>Asegúrate de que se vea claramente el monto y referencia</li>
            </ol>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-bold text-green-800 mb-2">✅ Requisitos de la Imagen</h3>
            <ul className="text-green-700 space-y-1">
              <li>• Formato: JPG, PNG, GIF</li>
              <li>• Tamaño máximo: 5MB</li>
              <li>• Debe mostrar claramente el pago</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "5️⃣ Enviar Solicitud",
      icon: <CheckCircle className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-bold text-green-800 mb-2">📤 Proceso de Envío</h3>
            <ol className="text-green-700 space-y-2 list-decimal list-inside">
              <li>Verifica que todos los datos estén correctos</li>
              <li>Confirma que la imagen se cargó correctamente</li>
              <li>Haz clic en <strong>"Comprar X Cartones"</strong></li>
              <li>Espera el mensaje de confirmación</li>
            </ol>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-bold text-yellow-800 mb-2">⏳ Estado de la Solicitud</h3>
            <p className="text-yellow-700">
              Tu solicitud quedará en estado <strong>"PENDIENTE"</strong> hasta que el administrador la revise y apruebe.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "6️⃣ Esperar Aprobación",
      icon: <CheckCircle className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="font-bold text-orange-800 mb-2">👨‍💼 Revisión del Admin</h3>
            <ul className="text-orange-700 space-y-2">
              <li>• El administrador revisa tu comprobante de pago</li>
              <li>• Verifica que el pago sea correcto</li>
              <li>• Genera y asigna tus cartones</li>
              <li>• Aprueba tu solicitud</li>
            </ul>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-2">🔔 Notificaciones</h3>
            <p className="text-blue-700">
              Recibirás una notificación cuando tu solicitud sea aprobada y tus cartones estén listos.
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-bold text-green-800 mb-2">✅ Una vez Aprobado</h3>
            <p className="text-green-700">
              Podrás ver tus cartones en la sección <strong>"Mis Cartones"</strong> y estarás listo para jugar.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "7️⃣ Jugar en Vivo",
      icon: <Gamepad2 className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-bold text-purple-800 mb-2">🎮 Acceso al Juego</h3>
            <ol className="text-purple-700 space-y-2 list-decimal list-inside">
              <li>Ve a la página principal</li>
              <li>Haz clic en <strong>"JUEGO EN VIVO"</strong></li>
              <li>Espera a que el admin inicie el juego</li>
              <li>Los números se llamarán automáticamente</li>
            </ol>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-bold text-green-800 mb-2">🎯 Durante el Juego</h3>
            <ul className="text-green-700 space-y-1">
              <li>• Marca automáticamente los números que salen</li>
              <li>• Ve el progreso de tus cartones</li>
              <li>• Recibe notificaciones si ganas</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "8️⃣ ¡Ganar Premios!",
      icon: <Trophy className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-bold text-yellow-800 mb-2">🏆 Tipos de Premios</h3>
            <ul className="text-yellow-700 space-y-2">
              <li><strong>🥉 1 Línea:</strong> Primera línea horizontal, vertical o diagonal</li>
              <li><strong>🥈 2 Líneas:</strong> Dos líneas completas</li>
              <li><strong>🥇 Cartón Completo:</strong> Todos los números marcados</li>
            </ul>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-bold text-red-800 mb-2">🎉 ¡Felicidades Ganador!</h3>
            <p className="text-red-700">
              Si ganas, aparecerá una notificación especial en pantalla mostrando tu premio.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "9️⃣ Reclamar Premio",
      icon: <MessageCircle className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-bold text-green-800 mb-2">💬 Comunicación</h3>
            <ol className="text-green-700 space-y-2 list-decimal list-inside">
              <li><strong>Tú puedes:</strong> Contactar al admin por WhatsApp/email</li>
              <li><strong>El admin puede:</strong> Contactarte directamente</li>
              <li><strong>Verifica:</strong> Que tu información de contacto esté actualizada</li>
            </ol>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-2">📋 Información Necesaria</h3>
            <ul className="text-blue-700 space-y-1">
              <li>• Nombre completo</li>
              <li>• Número de cartón ganador</li>
              <li>• Tipo de premio ganado</li>
              <li>• Forma de pago preferida</li>
            </ul>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-bold text-purple-800 mb-2">⚡ Proceso Rápido</h3>
            <p className="text-purple-700">
              Los premios se procesan rápidamente una vez verificada la información del ganador.
            </p>
          </div>
        </div>
      )
    }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {steps[currentStep].icon}
              <CardTitle className="text-2xl font-bold">
                {steps[currentStep].title}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="flex-1 bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
            <span className="text-white/90 text-sm font-medium">
              {currentStep + 1} de {steps.length}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
          {steps[currentStep].content}
        </CardContent>

        <div className="flex items-center justify-between p-6 bg-gray-50 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>

          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep 
                    ? 'bg-blue-600' 
                    : index < currentStep 
                    ? 'bg-green-500' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep === steps.length - 1 ? (
            <Button
              onClick={onClose}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" />
              ¡Comenzar a Jugar!
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              className="flex items-center gap-2"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
