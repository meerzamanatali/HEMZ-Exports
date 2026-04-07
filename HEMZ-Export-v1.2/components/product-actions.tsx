"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Share2, Check, Copy, Facebook, Twitter, Linkedin, Mail } from "lucide-react"
import { useWishlist, type WishlistItem } from "@/lib/contexts/wishlist-context"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface ProductActionsProps {
  product: WishlistItem
}

export function ProductActions({ product }: ProductActionsProps) {
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)

  const isWishlisted = isInWishlist(product.id)

  // Check for native share support on client side
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share)
  }, [])

  const handleWishlistToggle = () => {
    toggleWishlist(product)
    toast({
      title: isWishlisted ? "Removed from Wishlist" : "Added to Wishlist",
      description: isWishlisted
        ? `${product.title} has been removed from your wishlist.`
        : `${product.title} has been added to your wishlist.`,
      duration: 3000,
    })
  }

  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.href
    }
    return ""
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl())
      setCopied(true)
      toast({
        title: "Link Copied!",
        description: "Product link has been copied to clipboard.",
        duration: 3000,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out this amazing product: ${product.title}`,
          url: getShareUrl(),
        })
      } catch (error) {
        // User cancelled or share failed
        if ((error as Error).name !== "AbortError") {
          console.error("Share failed:", error)
        }
      }
    }
  }

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(`Check out ${product.title}!`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}`,
    email: `mailto:?subject=${encodeURIComponent(`Check out: ${product.title}`)}&body=${encodeURIComponent(`I thought you might like this product: ${getShareUrl()}`)}`,
  }

  const openShareWindow = (url: string) => {
    window.open(url, "_blank", "width=600,height=400,noopener,noreferrer")
  }

  return (
    <div className="flex items-center justify-center space-x-4 pt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleWishlistToggle}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        className={isWishlisted ? "text-red-500 hover:text-red-600" : ""}
      >
        <Heart
          className={`w-4 h-4 mr-2 transition-all ${isWishlisted ? "fill-red-500" : ""}`}
          aria-hidden="true"
        />
        {isWishlisted ? "In Wishlist" : "Add to Wishlist"}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" aria-label="Share product">
            <Share2 className="w-4 h-4 mr-2" aria-hidden="true" />
            Share Product
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          {canNativeShare && (
            <>
              <DropdownMenuItem onClick={handleNativeShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share via...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={handleCopyLink}>
            {copied ? (
              <Check className="w-4 h-4 mr-2 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {copied ? "Copied!" : "Copy Link"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openShareWindow(shareLinks.facebook)}>
            <Facebook className="w-4 h-4 mr-2 text-blue-600" />
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openShareWindow(shareLinks.twitter)}>
            <Twitter className="w-4 h-4 mr-2 text-sky-500" />
            Twitter / X
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openShareWindow(shareLinks.linkedin)}>
            <Linkedin className="w-4 h-4 mr-2 text-blue-700" />
            LinkedIn
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={shareLinks.email}>
              <Mail className="w-4 h-4 mr-2 text-gray-600" />
              Email
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
