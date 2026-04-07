"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, Phone, ShoppingCart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ProductCarousel } from "@/components/product-carousel"
import { ProductActions } from "@/components/product-actions"
import { useCart } from "@/lib/contexts/cart-context"
import { useToast } from "@/hooks/use-toast"

type ProductVariantView = {
  id?: string
  name: string
  color_hex: string
  sku?: string
  images: string[]
  is_available: boolean
  in_stock: number
}

type ProductDetailViewProps = {
  product: {
    id: string
    title: string
    type?: string | null
    material?: string | null
    description?: string | null
    moq?: number | null
    lead_time_days?: number | null
    discount_percent?: number | null
    is_available: boolean
    in_stock: number
    price: number
    variants: ProductVariantView[]
    colors: string[]
    sizes: string[]
    images: string[]
  }
}

function isLightHex(hex?: string | null) {
  return /^#(?:F{6}|f{6}|FFF|fff)$/.test(hex || "")
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const { addItem } = useCart()
  const { toast } = useToast()
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants.find((variant) => variant.is_available && variant.in_stock > 0)?.id ||
      product.variants[0]?.id ||
      ""
  )

  const selectedVariant = useMemo(
    () => product.variants.find((variant) => variant.id === selectedVariantId) || product.variants[0] || null,
    [product.variants, selectedVariantId]
  )
  const cartVariant = selectedVariant || {
    id: product.id,
    name: product.colors[0] || "Default",
    color_hex: "#D4D4D8",
    sku: product.id,
    images: product.images,
    is_available: product.is_available && product.in_stock > 0,
    in_stock: product.in_stock,
  }

  const images = cartVariant.images?.length ? cartVariant.images : product.images
  const discountedPrice = product.discount_percent ? product.price * (1 - product.discount_percent / 100) : product.price
  const canAddToCart = Boolean(cartVariant?.is_available) && Number(cartVariant?.in_stock || 0) > 0

  const handleAddToCart = () => {
    addItem({
      variant_id: cartVariant.id || product.id,
      price_cents: Math.round(discountedPrice * 100),
      product_title: product.title,
      product_image: images[0] || "/placeholder.svg",
      variant_sku: cartVariant.sku || `${product.id}-${cartVariant.name}`,
      variant_attributes: {
        color: cartVariant.name,
      },
    })

    toast({
      title: "Added to cart",
      description: `${product.title} (${cartVariant.name}) has been added to your cart.`,
      duration: 3000,
    })
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
      <div>
        <ProductCarousel images={images} productTitle={`${product.title} ${cartVariant?.name || ""}`.trim()} />
      </div>

      <div className="space-y-6">
        <nav className="mb-6 flex items-center space-x-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link
            href="/products"
            className="flex items-center transition-colors hover:text-primary focus:text-primary focus:outline-none focus:underline"
          >
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Back to Products
          </Link>
        </nav>

        <div>
          <div className="mb-2 flex items-center space-x-2">
            {product.type ? <Badge variant="outline">{product.type}</Badge> : null}
            {canAddToCart ? <Badge className="bg-green-600 text-white">In Stock</Badge> : <Badge variant="secondary">Out of Stock</Badge>}
            {product.discount_percent && product.discount_percent > 0 ? (
              <Badge className="bg-destructive text-destructive-foreground">-{product.discount_percent}% OFF</Badge>
            ) : null}
          </div>

          <h1 className="mb-2 font-serif text-2xl font-bold text-foreground sm:text-3xl">{product.title}</h1>
          <p className="mb-4 text-muted-foreground">
            SKU: {cartVariant?.sku || product.id}
          </p>

          <div className="mb-4 flex items-center space-x-3">
            {product.discount_percent && product.discount_percent > 0 ? (
              <>
                <span className="text-3xl font-bold text-primary">${discountedPrice.toFixed(2)}</span>
                <span className="text-xl text-muted-foreground line-through">${product.price.toFixed(2)}</span>
                <span className="text-sm font-medium text-destructive">
                  Save ${(product.price - discountedPrice).toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold text-primary">${product.price.toFixed(2)}</span>
            )}
          </div>

          <p className="leading-relaxed text-muted-foreground">{product.description}</p>

          <div className="mt-6">
            <Button onClick={handleAddToCart} size="lg" className="w-full sm:w-auto" disabled={!canAddToCart}>
              <ShoppingCart className="mr-2 h-5 w-5" aria-hidden="true" />
              {canAddToCart ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="font-serif text-lg font-semibold">Color Selection</h2>
          {product.variants.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((variant) => {
                  const isSelected = variant.id === selectedVariant?.id
                  const swatchLight = isLightHex(variant.color_hex)
                  return (
                    <button
                      key={variant.id || variant.name}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id || "")}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-2 transition-all ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/30"
                          : swatchLight
                            ? "border-slate-400 hover:border-slate-500"
                            : "border-slate-200 hover:border-slate-400"
                      }`}
                      aria-pressed={isSelected}
                      title={variant.name}
                    >
                      <span
                        className={`h-10 w-10 rounded-md border-2 ${swatchLight ? "border-slate-400" : "border-slate-200"}`}
                        style={{ backgroundColor: variant.color_hex || "#D4D4D8" }}
                      />
                      <span className="text-xs font-medium">{variant.name}</span>
                    </button>
                  )
                })}
              </div>

              <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                <p>
                  Selected color:
                  {" "}
                  <span className="font-medium text-foreground">{selectedVariant?.name || "Not selected"}</span>
                </p>
                <p>
                  Stock:
                  {" "}
                  <span className="font-medium text-foreground">{Number(selectedVariant?.in_stock || 0)} units</span>
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Contact us for available colors.</p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="font-serif text-lg font-semibold">Product Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Material:</span>
              <p className="text-muted-foreground">{product.material || "Contact for details"}</p>
            </div>
            <div>
              <span className="font-medium">Available Sizes:</span>
              <p className="text-muted-foreground">{product.sizes.length ? product.sizes.join(", ") : "Contact for details"}</p>
            </div>
            <div>
              <span className="font-medium">Available Colors:</span>
              <p className="text-muted-foreground">{product.colors.length ? product.colors.join(", ") : "Contact for details"}</p>
            </div>
            <div>
              <span className="font-medium">Lead Time:</span>
              <p className="text-muted-foreground">
                {product.lead_time_days ? `${product.lead_time_days} days` : "Contact for details"}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-3 font-serif text-lg font-semibold">Export Information</h3>
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Minimum Order:</span>
                <span className="font-bold text-primary">{product.moq || "Contact"} pieces</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Production Time:</span>
                <span className="font-bold text-primary">{product.lead_time_days || "Contact"} days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button onClick={handleAddToCart} size="lg" className="w-full" disabled={!canAddToCart}>
            <ShoppingCart className="mr-2 h-5 w-5" aria-hidden="true" />
            {canAddToCart ? "Add Selected Color to Cart" : "Selected Color Out of Stock"}
          </Button>

          <Button asChild size="lg" variant="outline" className="w-full">
            <Link href={`/contact?product=${product.id}`}>
              Request Quote
            </Link>
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="lg" asChild>
              <a href={`mailto:hemzexport@gmail.com?subject=Inquiry about ${encodeURIComponent(product.title)}`}>
                <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                Email Inquiry
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="tel:+911942501234">
                <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                Call Us
              </a>
            </Button>
          </div>

          <ProductActions
            product={{
              id: product.id,
              title: product.title,
              price: discountedPrice,
              image: images[0] || "/placeholder.svg",
              type: product.type || undefined,
              material: product.material || undefined,
              selected_variant_id: cartVariant.id || product.id,
              selected_variant_name: cartVariant.name,
            }}
          />
        </div>
      </div>
    </div>
  )
}
