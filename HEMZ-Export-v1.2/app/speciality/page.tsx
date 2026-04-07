import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, Eye, Palette, Scissors, Award, CheckCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Our Speciality | Premium Cashmere & Pashmina Craftsmanship",
  description:
    "Discover our specialty in hand-woven Kashmiri cashmere shawls, ultra-fine pashmina, and embroidered scarves. Traditional techniques meet modern export standards.",
  openGraph: {
    title: "Our Speciality | Luxury Textiles Export",
    description: "Master craftsmanship in premium cashmere and pashmina textiles",
  },
}

export default function SpecialityPage() {
  const specialties = [
    {
      icon: Sparkles,
      title: "Kashmiri Cashmere Shawls",
      description: "Hand-woven from the finest cashmere fibers, our shawls represent the pinnacle of luxury textiles.",
      features: ["100% Pure Cashmere", "Hand-woven on Traditional Looms", "Natural Dyes", "Lightweight & Warm"],
      image: "/elegant-kashmiri-cashmere-shawl-draped-beautifully.png",
    },
    {
      icon: Eye,
      title: "Ultra-Fine Pashmina",
      description:
        "Sourced from Changthangi goats in Ladakh, our pashmina represents the softest and most luxurious fiber.",
      features: ["Changthangi Goat Fiber", "12-16 Micron Thickness", "Exceptional Softness", "Natural Warmth"],
      image: "/ultra-fine-pashmina-shawl-with-intricate-weave-pat.png",
    },
    {
      icon: Palette,
      title: "Embroidered Masterpieces",
      description: "Traditional Kashmiri embroidery techniques including Sozni, Tilla, and Aari work.",
      features: ["Hand Embroidery", "Silk Thread Work", "Traditional Patterns", "Custom Designs"],
      image: "/kashmiri-embroidered-shawl-with-gold-thread-work.png",
    },
  ]

  const processes = [
    {
      step: "01",
      title: "Fiber Selection",
      description: "Hand-selecting the finest cashmere and pashmina fibers from trusted sources in Kashmir and Ladakh.",
    },
    {
      step: "02",
      title: "Traditional Spinning",
      description: "Converting raw fiber into yarn using traditional spinning wheels (charkha) for optimal texture.",
    },
    {
      step: "03",
      title: "Natural Dyeing",
      description: "Using eco-friendly natural dyes to achieve rich, lasting colors that enhance the fiber's beauty.",
    },
    {
      step: "04",
      title: "Hand Weaving",
      description: "Master weavers create each piece on traditional handlooms, ensuring perfect tension and pattern.",
    },
    {
      step: "05",
      title: "Embellishment",
      description: "Adding intricate embroidery, borders, or finishing touches by skilled artisan specialists.",
    },
    {
      step: "06",
      title: "Quality Control",
      description: "Rigorous inspection for texture, color consistency, and craftsmanship before export packaging.",
    },
  ]

  const techniques = [
    {
      name: "Sozni Embroidery",
      description: "Delicate needle embroidery creating intricate floral and paisley patterns",
      origin: "Traditional Kashmir",
    },
    {
      name: "Tilla Work",
      description: "Metallic thread embroidery adding golden accents and luxury appeal",
      origin: "Mughal Era",
    },
    {
      name: "Aari Work",
      description: "Chain stitch embroidery using a hooked needle for detailed motifs",
      origin: "Persian Influence",
    },
    {
      name: "Kani Weaving",
      description: "Intricate tapestry weaving technique creating complex patterns in the fabric",
      origin: "Ancient Kashmir",
    },
  ]

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Our Specialty: Master Craftsmanship
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Discover the art of traditional Kashmiri textile craftsmanship, where centuries-old techniques meet
                modern export standards to create the world's finest cashmere and pashmina products.
              </p>
            </div>
          </div>
        </section>

        {/* Main Specialties */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-16">
              {specialties.map((specialty, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                    index % 2 === 1 ? "lg:grid-flow-col-dense" : ""
                  }`}
                >
                  <div className={index % 2 === 1 ? "lg:col-start-2" : ""}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <specialty.icon className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="font-serif text-3xl font-bold text-foreground">{specialty.title}</h2>
                    </div>

                    <p className="text-muted-foreground leading-relaxed mb-6">{specialty.description}</p>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {specialty.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-primary" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button asChild>
                      <Link href="/products">View Products</Link>
                    </Button>
                  </div>

                  <div className={index % 2 === 1 ? "lg:col-start-1" : ""}>
                    <Image
                      src={specialty.image || "/placeholder.svg"}
                      alt={specialty.title}
                      width={600}
                      height={400}
                      className="rounded-lg shadow-lg w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Crafting Process */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Our Crafting Process</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From raw fiber to finished masterpiece, every step is carefully executed by skilled artisans
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processes.map((process, index) => (
                <Card key={index} className="relative hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Badge className="text-lg font-bold px-3 py-1">{process.step}</Badge>
                      <CardTitle className="font-serif text-xl">{process.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{process.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Traditional Techniques */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Traditional Techniques</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Preserving ancient craftsmanship methods passed down through generations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {techniques.map((technique, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-serif text-xl font-semibold">{technique.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {technique.origin}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">{technique.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Quality Standards */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Export Quality Standards</h2>
                <p className="text-lg text-muted-foreground">
                  Every product meets international quality standards for luxury textile exports
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <Award className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3 className="font-serif text-lg font-semibold mb-2">Premium Materials</h3>
                    <p className="text-muted-foreground text-sm">
                      Only the finest grade cashmere and pashmina fibers are selected for our products
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="pt-6">
                    <Scissors className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3 className="font-serif text-lg font-semibold mb-2">Precision Crafting</h3>
                    <p className="text-muted-foreground text-sm">
                      Master artisans ensure every stitch, weave, and finish meets luxury standards
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="pt-6">
                    <CheckCircle className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3 className="font-serif text-lg font-semibold mb-2">Quality Assurance</h3>
                    <p className="text-muted-foreground text-sm">
                      Rigorous quality control processes ensure consistency and excellence in every piece
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Experience Our Craftsmanship</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Ready to explore our collection of premium cashmere and pashmina textiles? Browse our products or
                contact our export team for custom requirements.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/products">Browse Collection</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/contact">Request Custom Quote</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
