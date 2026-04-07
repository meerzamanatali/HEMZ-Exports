import { Card, CardContent } from "@/components/ui/card"
import { Award, Globe, Truck, Shield } from "lucide-react"

const features = [
  {
    icon: Award,
    title: "Premium Quality",
    description: "Hand-selected finest cashmere and pashmina fibers from Kashmir region",
  },
  {
    icon: Globe,
    title: "Global Export",
    description: "Serving luxury boutiques and wholesalers across 25+ countries worldwide",
  },
  {
    icon: Truck,
    title: "Reliable Delivery",
    description: "Consistent lead times and quality control for bulk export orders",
  },
  {
    icon: Shield,
    title: "Export Certified",
    description: "ISO certified with full export compliance and documentation",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">Why Choose Our Textiles</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Combining traditional craftsmanship with modern export standards
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
