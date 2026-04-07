"use client"

import { ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/contexts/cart-context"
import { Badge } from "@/components/ui/badge"

export function CartIcon() {
  const { toggleCart, getTotalItems } = useCart()
  const itemCount = getTotalItems()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleCart}
      className="relative h-9 w-9 px-0 transition-all duration-300 hover:scale-110 hover:bg-primary/10"
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingBag className="h-4 w-4" />
      {itemCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs font-bold bg-primary text-primary-foreground animate-in zoom-in duration-300"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </Badge>
      )}
    </Button>
  )
}
