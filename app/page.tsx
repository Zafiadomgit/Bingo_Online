import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {

  return (
    <div className="min-h-screen relative overflow-hidden" style={{background: 'linear-gradient(135deg, #121D40 0%, #143C8C 50%, #123273 100%)'}}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-20 h-20 rounded-full animate-bounce" style={{backgroundColor: '#F2E394', opacity: 0.3}}></div>
        <div className="absolute top-40 right-20 w-16 h-16 rounded-full animate-pulse" style={{backgroundColor: '#D9A13B', opacity: 0.3}}></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 rounded-full animate-bounce animate-delay-1s" style={{backgroundColor: '#F2E394', opacity: 0.3}}></div>
        <div className="absolute bottom-40 right-1/3 w-14 h-14 rounded-full animate-pulse animate-delay-2s" style={{backgroundColor: '#D9A13B', opacity: 0.3}}></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center" style={{color: '#F2E394'}}>
            {/* Logo Principal */}
            <div className="flex justify-center mb-6 md:mb-8">
              <div className="relative w-48 h-48 md:w-96 md:h-96">
                <div className="absolute inset-0 rounded-full animate-pulse" style={{background: 'linear-gradient(90deg, #F2E394 0%, #D9A13B 100%)', filter: 'blur(15px) md:blur(20px)', opacity: 0.7}}></div>
                <Image
                  src="/Logo.jpeg"
                  alt="Bingo Fortuna Logo Principal"
                  fill
                  className="relative rounded-full shadow-2xl animate-bounce border-4 md:border-8 hover:scale-110 transition-transform duration-500 object-cover"
                  style={{borderColor: '#F2E394', boxShadow: '0 0 40px rgba(242, 227, 148, 0.6), 0 0 80px rgba(217, 161, 59, 0.4)'}}
                  priority
                />
              </div>
            </div>
            
            {/* Animated Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-full mb-6 md:mb-8 animate-pulse shadow-2xl" style={{background: 'linear-gradient(90deg, #F2E394 0%, #D9A13B 100%)', color: '#121D40'}}>
              <span className="text-xl md:text-2xl animate-spin">🎯</span>
              <span className="font-bold text-base md:text-lg">BINGO FORTUNA</span>
              <Badge className="animate-bounce text-[10px] md:text-xs" style={{backgroundColor: '#121D40', color: '#F2E394'}}>¡HOT!</Badge>
            </div>
            
            {/* Dynamic Title */}
            <h1 className="text-4xl md:text-8xl font-black mb-4 md:mb-6 animate-pulse drop-shadow-2xl" style={{background: 'linear-gradient(90deg, #F2E394 0%, #D9A13B 50%, #F2E394 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
              ¡BINGO FORTUNA!
            </h1>
            
            {/* Subtitle with animation */}
            <div className="text-lg md:text-3xl mb-8 md:mb-12 max-w-2xl mx-auto px-2" style={{color: '#F2E394'}}>
              <span className="animate-bounce inline-block">🎰</span>
              <span className="mx-2">La casa de apuestas más emocionante</span>
              <span className="animate-bounce inline-block">💰</span>
            </div>
            
            {/* Animated CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center px-4">
              <Link href="/auth/sign-up" className="w-full sm:w-auto">
                <Button size="lg" className="w-full px-8 py-6 md:px-10 md:py-8 text-lg md:text-xl font-bold rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300" style={{background: 'linear-gradient(90deg, #D9A13B 0%, #F2E394 100%)', color: '#121D40'}}>
                  🚀 ¡JUGAR AHORA!
                </Button>
              </Link>
              <Link href="/auth/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full px-8 py-6 md:px-10 md:py-8 text-lg md:text-xl font-bold rounded-full backdrop-blur-sm transform hover:scale-105 transition-all duration-300" style={{border: '4px solid #F2E394', color: '#F2E394', backgroundColor: 'rgba(242, 227, 148, 0.1)'}}>
                  🔑 INICIAR SESIÓN
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Features Section */}
      <div className="relative z-10 py-20 backdrop-blur-sm" style={{backgroundColor: 'rgba(18, 29, 64, 0.2)'}}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-6xl font-black mb-4 drop-shadow-2xl px-2" style={{color: '#F2E394'}}>
              ¡LA CASA GANADORA!
            </h2>
            <p className="text-lg md:text-2xl max-w-3xl mx-auto font-bold px-4" style={{color: '#F2E394'}}>
              🎯 Tecnología de punta para la mejor experiencia de casino 🎯
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-16 px-4">
            <Card className="shadow-2xl transform hover:scale-105 md:hover:scale-110 transition-all duration-500 md:hover:rotate-2" style={{background: 'linear-gradient(135deg, #F2E394 0%, #D9A13B 100%)', border: '4px solid #D9A13B'}}>
              <CardHeader className="text-center p-6 md:p-8">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin" style={{background: 'linear-gradient(90deg, #D9A13B 0%, #F2E394 100%)'}}>
                  <span className="text-3xl md:text-4xl">⚡</span>
                </div>
                <CardTitle className="text-2xl md:text-3xl font-black" style={{color: '#121D40'}}>SÚPER RÁPIDO</CardTitle>
                <CardDescription className="font-bold text-base md:text-lg" style={{color: '#121D40'}}>
                  🚀 Cartones automáticos, sorteos instantáneos 🚀
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 md:px-8 md:pb-8">
                <ul className="space-y-3 font-bold text-base md:text-lg" style={{color: '#121D40'}}>
                  <li>🎯 Cartones digitales automáticos</li>
                  <li>⚡ Sorteos en tiempo real</li>
                  <li>🔥 Sin esperas, sin complicaciones</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-2xl transform hover:scale-105 md:hover:scale-110 transition-all duration-500 md:hover:-rotate-2" style={{background: 'linear-gradient(135deg, #143C8C 0%, #123273 100%)', border: '4px solid #143C8C'}}>
              <CardHeader className="text-center p-6 md:p-8">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce" style={{background: 'linear-gradient(90deg, #143C8C 0%, #123273 100%)'}}>
                  <span className="text-3xl md:text-4xl">💰</span>
                </div>
                <CardTitle className="text-2xl md:text-3xl font-black" style={{color: '#F2E394'}}>PREMIOS ÉPICOS</CardTitle>
                <CardDescription className="font-bold text-base md:text-lg" style={{color: '#F2E394'}}>
                  💎 Gana dinero real con cada partida 💎
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 md:px-8 md:pb-8">
                <ul className="space-y-3 font-bold text-base md:text-lg" style={{color: '#F2E394'}}>
                  <li>🏆 Premios acumulados</li>
                  <li>🎁 Ofertas especiales</li>
                  <li>💸 Pagos instantáneos</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-2xl transform hover:scale-105 md:hover:scale-110 transition-all duration-500 md:hover:rotate-2" style={{background: 'linear-gradient(135deg, #121D40 0%, #123273 100%)', border: '4px solid #121D40'}}>
              <CardHeader className="text-center p-6 md:p-8">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse" style={{background: 'linear-gradient(90deg, #121D40 0%, #123273 100%)'}}>
                  <span className="text-3xl md:text-4xl">🎮</span>
                </div>
                <CardTitle className="text-2xl md:text-3xl font-black" style={{color: '#F2E394'}}>SÚPER DIVERTIDO</CardTitle>
                <CardDescription className="font-bold text-base md:text-lg" style={{color: '#F2E394'}}>
                  🎪 La diversión nunca termina 🎪
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 md:px-8 md:pb-8">
                <ul className="space-y-3 font-bold text-base md:text-lg" style={{color: '#F2E394'}}>
                  <li>🌍 Juega desde cualquier lugar</li>
                  <li>👥 Compite con amigos</li>
                  <li>🎲 Nuevos juegos cada día</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dynamic How it Works */}
      <div className="relative z-10 py-20" style={{background: 'linear-gradient(90deg, #121D40 0%, #143C8C 50%, #123273 100%)'}}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-6xl font-black mb-4 drop-shadow-2xl px-2" style={{color: '#F2E394'}}>
              ¡ES SÚPER FÁCIL!
            </h2>
            <p className="text-lg md:text-2xl font-bold px-4" style={{color: '#F2E394'}}>
              🎯 Solo 3 pasos para empezar a ganar GRANDES PREMIOS 🎯
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 md:gap-8 max-w-5xl mx-auto px-6">
            <div className="text-center transform hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-2xl animate-bounce" style={{background: 'linear-gradient(90deg, #F2E394 0%, #D9A13B 100%)'}}>
                <span className="text-3xl md:text-4xl font-black" style={{color: '#121D40'}}>1</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-3 md:mb-4 drop-shadow-lg" style={{color: '#F2E394'}}>REGÍSTRATE</h3>
              <p className="text-lg md:text-xl font-bold" style={{color: '#F2E394'}}>
                🚀 Crea tu cuenta en segundos y comienza a jugar <span className="font-black text-xl md:text-2xl" style={{color: '#D9A13B'}}>BINGO FORTUNA</span> 🚀
              </p>
            </div>

            <div className="text-center transform hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-2xl animate-bounce animate-delay-0\.5s" style={{background: 'linear-gradient(90deg, #143C8C 0%, #123273 100%)'}}>
                <span className="text-3xl md:text-4xl font-black" style={{color: '#F2E394'}}>2</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-3 md:mb-4 drop-shadow-lg" style={{color: '#F2E394'}}>COMPRA CARTONES</h3>
              <p className="text-lg md:text-xl font-bold" style={{color: '#F2E394'}}>
                💰 Selecciona cuántos cartones quieres y aprovecha nuestras <span className="font-black text-xl md:text-2xl" style={{color: '#D9A13B'}}>OFERTAS ESPECIALES</span> 💰
              </p>
            </div>

            <div className="text-center transform hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-2xl animate-bounce animate-delay-1s" style={{background: 'linear-gradient(90deg, #121D40 0%, #123273 100%)'}}>
                <span className="text-3xl md:text-4xl font-black" style={{color: '#F2E394'}}>3</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-3 md:mb-4 drop-shadow-lg" style={{color: '#F2E394'}}>¡GANA!</h3>
              <p className="text-lg md:text-xl font-bold" style={{color: '#F2E394'}}>
                🏆 Marca tus números automáticamente y gana <span className="font-black text-xl md:text-2xl" style={{color: '#D9A13B'}}>PREMIOS INCREÍBLES</span> 🏆
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic CTA Section */}
      <div className="relative z-10 py-20" style={{background: 'linear-gradient(90deg, #121D40 0%, #143C8C 50%, #123273 100%)'}}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-6xl font-black mb-6 drop-shadow-2xl animate-pulse px-2" style={{color: '#F2E394'}}>
            ¿LISTO PARA GANAR GRANDE?
          </h2>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto font-bold px-4" style={{color: '#F2E394'}}>
            🎯 Únete a miles de jugadores que ya están ganando GRANDES PREMIOS con nuestro Bingo Fortuna 🎯
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center px-4">
            <Link href="/auth/sign-up" className="w-full sm:w-auto">
              <Button size="lg" className="w-full px-10 py-6 md:px-12 md:py-8 text-xl md:text-2xl font-black rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300" style={{background: 'linear-gradient(90deg, #D9A13B 0%, #F2E394 100%)', color: '#121D40'}}>
                🎯 ¡EMPEZAR A GANAR!
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full px-10 py-6 md:px-12 md:py-8 text-xl md:text-2xl font-black rounded-full backdrop-blur-sm transform hover:scale-105 transition-all duration-300" style={{border: '4px solid #F2E394', color: '#F2E394', backgroundColor: 'rgba(242, 227, 148, 0.1)'}}>
                🔑 YA TENGO CUENTA
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Dynamic Footer */}
      <div className="relative z-10 py-8" style={{background: 'linear-gradient(90deg, #121D40 0%, #123273 100%)'}}>
        <div className="container mx-auto px-4 text-center">
          <p className="font-bold text-lg md:text-xl px-4" style={{color: '#F2E394'}}>
            © 2024 Bingo Fortuna - La casa de apuestas más emocionante del mundo digital 🎰
          </p>
        </div>
      </div>
    </div>
  )
}