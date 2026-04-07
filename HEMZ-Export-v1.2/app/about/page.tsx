import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, Users, Globe, Heart, Truck, Shield } from "lucide-react"
import Image from "next/image"

export const metadata: Metadata = {
  title: "About Us | Luxury Textiles Export - Premium Cashmere & Pashmina",
  description:
    "Learn about our heritage in crafting premium cashmere shawls and pashmina. Family-owned export house serving luxury markets worldwide since 1985.",
  openGraph: {
    title: "About Us | Luxury Textiles Export",
    description: "Heritage craftsmanship meets modern export excellence in premium textiles",
  },
}

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: "Heritage Craftsmanship",
      description: "Three generations of textile expertise passed down through our family of artisans",
    },
    {
      icon: Award,
      title: "Premium Quality",
      description: "Hand-selected finest materials with rigorous quality control at every step",
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Trusted by luxury boutiques and wholesalers across 25+ countries worldwide",
    },
    {
      icon: Shield,
      title: "Export Excellence",
      description: "ISO certified with full compliance and documentation for international trade",
    },
  ]

  const milestones = [
    { year: "1985", title: "Company Founded", description: "Started as a small family business in Srinagar, Kashmir" },
    { year: "1995", title: "First Export", description: "Began exporting to European luxury boutiques" },
    {
      year: "2005",
      title: "ISO Certification",
      description: "Achieved ISO 9001:2015 certification for quality management",
    },
    { year: "2015", title: "Global Expansion", description: "Expanded to serve markets in North America and Asia" },
    { year: "2020", title: "Digital Transformation", description: "Launched online platform for global B2B customers" },
    {
      year: "2024",
      title: "Sustainable Future",
      description: "Committed to ethical sourcing and environmental responsibility",
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
                Three Generations of Textile Excellence
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We are Luxury Textiles Export Co., a family-owned export house specializing in premium cashmere and
                pashmina shawls. Sourced from skilled artisans in Kashmir, each piece blends traditional craftsmanship
                with modern design standards for luxury markets worldwide.
              </p>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-6">Our Story</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Founded in 1985 in the heart of Srinagar, Kashmir, our journey began with a simple vision: to share
                    the exquisite beauty of Kashmiri textiles with the world. What started as a small family business
                    has grown into a trusted name in luxury textile exports.
                  </p>
                  <p>
                    Our founder, inspired by the rich textile heritage of Kashmir, established relationships with local
                    artisans who had been perfecting their craft for generations. Today, we work with over 200 skilled
                    craftspeople, ensuring that traditional techniques are preserved while meeting modern quality
                    standards.
                  </p>
                  <p>
                    Every shawl, pashmina, and scarf that bears our name represents hours of meticulous handwork,
                    premium materials sourced directly from the region, and a commitment to excellence that has earned
                    us the trust of luxury boutiques and wholesalers worldwide.
                  </p>
                </div>
              </div>
              <div className="relative">
                <Image
                  src="/traditional-kashmiri-artisan-weaving-cashmere-on-w.png"
                  alt="Traditional Kashmiri artisan weaving cashmere"
                  width={600}
                  height={500}
                  className="rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Our Values</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                The principles that guide our work and define our commitment to excellence
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <value.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-serif text-xl font-semibold mb-2">{value.title}</h3>
                    <p className="text-muted-foreground text-sm">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Our Journey</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Key milestones in our growth from a local family business to a global textile export leader
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <Badge className="text-sm font-bold px-3 py-1">{milestone.year}</Badge>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-xl font-semibold text-foreground mb-1">{milestone.title}</h3>
                      <p className="text-muted-foreground">{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team & Certifications */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Team */}
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-6">Our Team</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Our success is built on the expertise of our dedicated team. From our master weavers who have
                    perfected their craft over decades, to our quality control specialists who ensure every piece meets
                    international standards.
                  </p>
                  <p>
                    Our export team brings years of experience in international trade, understanding the unique
                    requirements of different markets and ensuring smooth, compliant transactions for our global
                    partners.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">200+</div>
                    <div className="text-sm text-muted-foreground">Skilled Artisans</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">25+</div>
                    <div className="text-sm text-muted-foreground">Countries Served</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">39</div>
                    <div className="text-sm text-muted-foreground">Years Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">10,000+</div>
                    <div className="text-sm text-muted-foreground">Products Exported</div>
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-6">Certifications & Standards</h2>
                <div className="space-y-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-3">
                        <Award className="w-6 h-6 text-primary mt-1" />
                        <div>
                          <h3 className="font-semibold mb-1">ISO 9001:2015 Certified</h3>
                          <p className="text-muted-foreground text-sm">
                            Quality management system certification ensuring consistent product quality and customer
                            satisfaction.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-3">
                        <Truck className="w-6 h-6 text-primary mt-1" />
                        <div>
                          <h3 className="font-semibold mb-1">Export License</h3>
                          <p className="text-muted-foreground text-sm">
                            Authorized exporter with all necessary licenses for international textile trade.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-3">
                        <Users className="w-6 h-6 text-primary mt-1" />
                        <div>
                          <h3 className="font-semibold mb-1">Fair Trade Practices</h3>
                          <p className="text-muted-foreground text-sm">
                            Committed to ethical sourcing and fair compensation for all artisans in our supply chain.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
