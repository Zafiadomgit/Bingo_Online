import "./globals.css"
import Image from 'next/image'
import { Toaster } from "@/components/ui/toaster"
import { AutoGameRedirect } from "@/components/auto-game-redirect"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body suppressHydrationWarning={true}>
        {/* Header con Logo */}
        <header className="fixed top-0 left-0 right-0 z-30 shadow-2xl" style={{background: 'linear-gradient(90deg, #121D40 0%, #143C8C 50%, #123273 100%)'}}>
          <div className="container mx-auto px-4 py-2 md:py-3 flex items-center justify-center">
            <div className="flex items-center space-x-3 md:space-x-4">
              <Image
                src="/Logo.jpeg"
                alt="Bingo Fortuna Logo"
                width={45}
                height={45}
                className="rounded-full shadow-lg animate-pulse md:w-[60px] md:h-[60px]"
                priority
              />
              <h1 className="text-xl md:text-3xl font-black drop-shadow-lg" style={{color: '#F2E394'}}>
                BINGO FORTUNA
              </h1>
            </div>
          </div>
        </header>
        
        {/* Contenido principal con padding para el header fijo */}
        <main className="pt-16 md:pt-20">
          {children}
        </main>
        
        {/* Auto-redirect cuando juegos se inician automáticamente */}
        <AutoGameRedirect />
        
        {/* Sistema de notificaciones */}
        <Toaster />
      </body>
    </html>
  )
}
