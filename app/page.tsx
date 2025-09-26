import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-medium tracking-tight">Bingo</div>
            <div className="flex gap-3">
              <Button asChild variant="ghost" size="sm">
                <Link href="/test-bingo">Probar Bingo</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">Iniciar Sesión</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/sign-up">Registrarse</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6">
        <section className="py-24 text-center animate-fade-in-up">
          <h1 className="font-medium text-foreground mb-6 text-balance">
            Experiencia de bingo
            <br />
            <span className="text-muted-foreground">completamente digital</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-12 text-pretty max-w-2xl mx-auto leading-relaxed">
            Juega bingo en tiempo real con cartones digitales, sorteos automáticos y la emoción de ganar desde la
            comodidad de tu hogar.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg" className="px-8 py-6 text-base modern-hover">
              <Link href="/test-bingo">Probar Bingo Ahora</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 py-6 text-base modern-hover bg-transparent">
              <Link href="/auth/sign-up">Crear Cuenta</Link>
            </Button>
          </div>
        </section>

        <section className="py-24">
          <div className="text-center mb-16">
            <h2 className="font-medium text-foreground mb-4">¿Por qué elegir nuestro bingo?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Una experiencia de juego moderna, segura y emocionante
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-24">
            <Card className="border-0 shadow-none bg-muted/30 modern-hover animate-scale-in">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-medium">
                  1
                </div>
                <CardTitle className="text-xl font-medium">Cartones digitales</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Compra cartones únicos generados automáticamente con números aleatorios
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="border-0 shadow-none bg-muted/30 modern-hover animate-scale-in"
              style={{ animationDelay: "0.1s" }}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-medium">
                  2
                </div>
                <CardTitle className="text-xl font-medium">Sorteos en vivo</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Los números se sortean aleatoriamente y aparecen en pantalla al instante
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="border-0 shadow-none bg-muted/30 modern-hover animate-scale-in"
              style={{ animationDelay: "0.2s" }}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-medium">
                  3
                </div>
                <CardTitle className="text-xl font-medium">Detección automática</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  El sistema detecta automáticamente cuando completas una línea
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="py-24">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-medium text-foreground mb-4">Cómo funciona</h2>
              <p className="text-muted-foreground text-lg">Comenzar es muy sencillo</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { step: "01", title: "Regístrate", desc: "Crea tu cuenta y recibe créditos de bienvenida" },
                { step: "02", title: "Compra cartones", desc: "Usa tus créditos para adquirir cartones únicos" },
                { step: "03", title: "Juega en vivo", desc: "Espera los números y marca tu cartón automáticamente" },
                { step: "04", title: "Gana premios", desc: "Completa líneas y gana de forma instantánea" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="text-center animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-4xl font-light text-muted-foreground mb-4">{item.step}</div>
                  <h3 className="text-lg font-medium mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-medium text-foreground mb-6">Listo para comenzar</h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Únete a miles de jugadores que ya disfrutan de la mejor experiencia de bingo online
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild size="lg" className="px-8 py-6 text-base modern-hover">
                <Link href="/test-bingo">Probar Bingo</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8 py-6 text-base modern-hover bg-transparent">
                <Link href="/auth/sign-up">Crear cuenta gratis</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-border/50 mt-24">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center text-muted-foreground">
            <div className="text-xl font-medium mb-2">Bingo</div>
            <p className="text-sm">© 2025 Todos los derechos reservados</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
