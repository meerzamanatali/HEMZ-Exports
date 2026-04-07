"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, ShoppingCart, Plus, Heart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useCart } from "@/lib/contexts/cart-context"
import { useWishlist } from "@/lib/contexts/wishlist-context"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

interface ProductVariantCardView {
  id?: string
  name: string
  color_hex: string
  sku?: string
  images: string[]
  is_available: boolean
  in_stock: number
}

interface Product {
  id: string
  title: string
  type?: string
  material?: string
  sizes: string[]
  color: string[]
  colors?: string[]
  price: number
  currency?: string
  availability?: string
  discount?: number
  photos: string[]
  description?: string
  care_instructions?: string
  moq: number
  lead_time_days: number
  variants?: ProductVariantCardView[]
  default_variant?: ProductVariantCardView | null
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { toast } = useToast()
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const price =
    (product as any).price ??
    (typeof (product as any).price_cents === "number" ? (product as any).price_cents / 100 : product.price ?? 0)
  const discount = (product as any).discount_percent ?? (product as any).discount ?? 0
  const discountedPrice = discount > 0 ? price * (1 - discount / 100) : price

  const photos = (product as any).photos ?? (product as any).images ?? []
  const variants = Array.isArray((product as any).variants) ? ((product as any).variants as ProductVariantCardView[]) : []
  const selectedVariant =
    (product as any).default_variant ??
    variants.find((variant) => variant.is_available && Number(variant.in_stock || 0) > 0) ??
    variants[0] ??
    null

  const firstPhoto = selectedVariant?.images?.[0] || (photos && photos.length > 0 ? photos[0] : "/placeholder.svg")
  const sizesArr = (product as any).sizes ?? []
  const colorsArr = (product as any).colors ?? (product as any).color ?? []
  const firstSize = sizesArr && sizesArr.length > 0 ? sizesArr[0] : ""
  const firstColor = selectedVariant?.name || (colorsArr && colorsArr.length > 0 ? colorsArr[0] : "")
  const isAvailable = selectedVariant
    ? Boolean(selectedVariant.is_available) && Number(selectedVariant.in_stock || 0) > 0
    : Boolean((product as any).is_available ?? ((product as any).availability === "InStock"))
  const inStock = selectedVariant ? Number(selectedVariant.in_stock || 0) : Number((product as any).in_stock ?? 0)
  const canAddToCart = isAvailable && inStock > 0

  const isWishlisted = isInWishlist(product.id)

  const handleWishlistToggle = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    toggleWishlist({
      id: product.id,
      title: product.title,
      price: discountedPrice,
      image: firstPhoto,
      type: product.type,
      material: product.material,
      selected_variant_id: selectedVariant?.id,
      selected_variant_name: selectedVariant?.name,
    })

    toast({
      title: isWishlisted ? "Removed from Wishlist" : "Added to Wishlist",
      description: isWishlisted
        ? `${product.title} has been removed from your wishlist.`
        : `${product.title} has been added to your wishlist.`,
      duration: 3000,
    })
  }

  const handleAddToCart = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    setIsAddingToCart(true)

    try {
      addItem({
        variant_id: selectedVariant?.id || product.id,
        price_cents: Math.round(discountedPrice * 100),
        product_title: product.title,
        product_image: firstPhoto,
        variant_sku: selectedVariant?.sku || `${product.id}-${firstSize || "default"}-${firstColor || "default"}`,
        variant_attributes: {
          size: firstSize,
          color: firstColor,
        },
      })

      toast({
        title: "Added to cart",
        description: `${product.title} has been added to your cart.`,
        duration: 3000,
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <Card className="group animate-in slide-in-from-bottom fade-in border-0 shadow-md transition-all duration-500 hover:-translate-y-2 hover:rotate-1 hover:shadow-xl hover:shadow-primary/10">
      <div className="relative overflow-hidden rounded-t-lg">
        <Image
          src={firstPhoto}
          alt={product.title || "Product"}
          width={400}
          height={400}
          className="h-64 w-full object-cover transition-all duration-700 ease-out group-hover:scale-110"
        />
        {discount > 0 ? (
          <Badge className="absolute left-2 top-2 animate-in slide-in-from-left bg-destructive text-destructive-foreground transition-transform duration-500 delay-200 hover:scale-110">
            -{discount}%
          </Badge>
        ) : null}
        {canAddToCart ? (
          <Badge className="absolute right-2 top-2 animate-in slide-in-from-right bg-green-600 text-white transition-transform duration-500 delay-300 hover:scale-110">
            In Stock
          </Badge>
        ) : (
          <Badge className="absolute right-2 top-2 animate-in slide-in-from-right bg-secondary text-secondary-foreground transition-transform duration-500 delay-300 hover:scale-110">
            Out of Stock
          </Badge>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={handleWishlistToggle}
          className={`absolute top-2 z-10 h-8 w-8 rounded-full bg-white/90 shadow-md transition-all duration-300 hover:scale-110 hover:bg-white ${canAddToCart ? "right-20" : "right-2"} ${isWishlisted ? "text-red-500" : "text-gray-600 hover:text-red-500"}`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-4 w-4 transition-all ${isWishlisted ? "fill-red-500" : ""}`} />
        </Button>

        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 backdrop-blur-[2px] transition-all duration-500 group-hover:opacity-100">
          <div className="flex gap-2">
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="scale-75 shadow-lg transition-all duration-300 delay-100 group-hover:scale-100 hover:shadow-xl"
            >
              <Link href={`/products/${product.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Quick View
              </Link>
            </Button>
            <Button
              onClick={handleAddToCart}
              disabled={isAddingToCart || !canAddToCart}
              variant="default"
              size="sm"
              className="scale-75 shadow-lg transition-all duration-300 delay-200 group-hover:scale-100 hover:shadow-xl"
            >
              <Plus className="mr-2 h-4 w-4" />
              {isAddingToCart ? "Adding..." : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="mb-2">
          <Badge
            variant="outline"
            className="text-xs transition-colors duration-300 hover:bg-primary hover:text-primary-foreground"
          >
            {product.type}
          </Badge>
        </div>

        <h3 className="mb-2 line-clamp-2 font-serif text-lg font-semibold transition-colors duration-300 group-hover:text-primary">
          {product.title}
        </h3>

        <p className="mb-2 text-sm text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
          {product.material}
        </p>

        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {discount > 0 ? (
              <>
                <span className="text-lg font-bold text-primary transition-all duration-300 group-hover:scale-105">
                  ${discountedPrice.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground line-through">${price.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-lg font-bold text-primary transition-all duration-300 group-hover:scale-105">
                ${price.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <div className="mb-3 text-xs text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
          MOQ: {product.moq} pieces • Lead time: {product.lead_time_days} days
        </div>

        {variants.length > 0 ? (
          <div className="mb-3 flex items-center gap-2">
            {variants.slice(0, 5).map((variant, index) => {
              const isLightColor = /^#(?:F{6}|f{6}|FFF|fff)$/.test(variant.color_hex || "")
              return (
                <span
                  key={`${variant.id || variant.name}-${index}`}
                  title={variant.name}
                  className={`h-6 w-6 rounded-md border-2 ${isLightColor ? "border-slate-400" : "border-slate-200"}`}
                  style={{ backgroundColor: variant.color_hex || "#D4D4D8" }}
                />
              )
            })}
            {variants.length > 5 ? <span className="text-xs text-muted-foreground">+{variants.length - 5}</span> : null}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            className="flex-1 bg-transparent transition-all duration-300 hover:scale-105 hover:shadow-lg"
            size="sm"
          >
            <Link href={`/products/${product.id}`}>
              <ShoppingCart className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
              Request Quote
            </Link>
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={isAddingToCart || !canAddToCart}
            className="flex-1 transition-all duration-300 hover:scale-105 hover:shadow-lg group-hover:bg-primary group-hover:shadow-primary/25"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
            {isAddingToCart ? "Adding..." : "Add to Cart"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
