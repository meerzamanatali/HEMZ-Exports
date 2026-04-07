"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Package, Truck, Shield } from "lucide-react"

interface Product {
  id: string
  title: string
  type: string
  material: string
  sizes: string[]
  colors: string[]
  price: number
  price_cents?: number
  is_available: boolean
  discount_percent?: number
  photos?: string[]
  images?: string[]
  description: string
  care_instructions: string
  moq?: number
  lead_time_days?: number
}

interface ProductTabsProps {
  product: Product
}

export function ProductTabs({ product }: ProductTabsProps) {
  const normalizeArray = (val: any): string[] => {
    if (Array.isArray(val)) return val
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val)
        return Array.isArray(parsed) ? parsed : [String(parsed)]
      } catch {
        return val ? [val] : []
      }
    }
    if (val && typeof val === 'object') {
      try {
        return Object.values(val).map((v) => String(v))
      } catch {
        return []
      }
    }
    return []
  }

  const sizes = normalizeArray((product as any).sizes)
  const colors = normalizeArray((product as any).colors)

  const currency = (product as any).currency || 'USD'

  return (
    <Tabs defaultValue="description" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="materials">Materials & Care</TabsTrigger>
        <TabsTrigger value="shipping">Shipping & MOQ</TabsTrigger>
      </TabsList>

      <TabsContent value="description" className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-lg font-semibold mb-2">Product Description</h3>
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h4 className="font-medium mb-2">Product Details</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>
                      <span className="font-medium">Type:</span> {product.type}
                    </li>
                    <li>
                      <span className="font-medium">Material:</span> {product.material}
                    </li>
                    <li>
                      <span className="font-medium">Available Sizes:</span> {sizes.length ? sizes.join(', ') : 'Contact for details'}
                    </li>
                    <li>
                      <span className="font-medium">Available Colors:</span> {colors.length ? colors.join(', ') : 'Contact for details'}
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Export Information</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>
                      <span className="font-medium">Product Code:</span> {product.id}
                    </li>
                    <li>
                      <span className="font-medium">Currency:</span> {currency}
                    </li>
                    <li>
                      <span className="font-medium">Availability:</span>{" "}
                      {product.is_available ? "In Stock" : "Out of Stock"}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="materials" className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-serif text-lg font-semibold mb-2">Material Composition</h3>
                  <p className="text-muted-foreground">{product.material}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Package className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-serif text-lg font-semibold mb-2">Care Instructions</h3>
                  <p className="text-muted-foreground">{product.care_instructions}</p>

                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Additional Care Tips</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Store in a cool, dry place away from direct sunlight</li>
                      <li>• Use cedar blocks or lavender sachets to prevent moths</li>
                      <li>• Avoid contact with perfumes, cosmetics, and sharp objects</li>
                      <li>• Professional cleaning recommended for best results</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="shipping" className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <Truck className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-serif text-lg font-semibold mb-2">Minimum Order Quantity (MOQ)</h3>
                  <p className="text-muted-foreground mb-2">
                    <span className="text-2xl font-bold text-primary">{product.moq}</span> pieces minimum order
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This MOQ ensures optimal pricing for wholesale and export customers while maintaining quality
                    standards.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Package className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-serif text-lg font-semibold mb-2">Lead Time & Shipping</h3>
                  <p className="text-muted-foreground mb-2">
                    <span className="text-xl font-bold text-primary">{product.lead_time_days}</span> days production
                    time
                  </p>

                  <div className="mt-4 space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-1">Production Timeline</h4>
                      <p className="text-sm text-muted-foreground">
                        Includes material sourcing, hand-weaving, quality control, and packaging
                      </p>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-1">Shipping Options</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Express Air Freight: 3-5 days (additional cost)</li>
                        <li>• Standard Air Freight: 7-10 days</li>
                        <li>• Sea Freight: 15-30 days (for large orders)</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-1">Export Documentation</h4>
                      <p className="text-sm text-muted-foreground">
                        All necessary export certificates, invoices, and customs documentation included
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
