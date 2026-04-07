import { Button } from "@/components/ui/button"
import Link from "next/link"

export function HeroSection() {
  return (
    <section
      className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden"
      aria-label="Hero banner"
    >
      <div className="absolute inset-0 z-0">
        <img
          src="/luxury-cashmere-shawl-draped-elegantly-on-wooden-b.png"
          alt="Luxury cashmere shawl draped elegantly on wooden surface in natural lighting"
          className="w-full h-full object-cover scale-105 animate-in zoom-in duration-1000"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/40 animate-in fade-in duration-1000"
          aria-hidden="true"
        ></div>
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 text-balance animate-in slide-in-from-bottom duration-800 delay-300">
          Timeless Cashmere & Pashmina
        </h1>
        <p className="text-xl sm:text-2xl text-white/90 mb-8 max-w-2xl mx-auto text-pretty animate-in slide-in-from-bottom duration-800 delay-500">
          Exquisite hand-woven shawls crafted for luxury markets worldwide
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in slide-in-from-bottom duration-800 delay-700">
          <Button
            asChild
            size="lg"
            className="text-lg px-8 py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <Link href="/products">View Collections</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="text-lg px-8 py-3 bg-white/10 border-white/30 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm"
          >
            <Link href="/contact">Request Quote</Link>
          </Button>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  )
}
