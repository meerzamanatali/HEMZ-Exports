"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useAuth } from "./auth-context"

export interface WishlistItem {
  id: string
  title: string
  price: number
  image: string
  type?: string
  material?: string
  selected_variant_id?: string
  selected_variant_name?: string
}

interface WishlistContextType {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (id: string) => void
  isInWishlist: (id: string) => boolean
  toggleWishlist: (item: WishlistItem) => void
  clearWishlist: () => void
  refreshWishlist: () => Promise<void>
  itemCount: number
  isLoading: boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

// Helper function to get the wishlist storage key for guests
function getGuestWishlistStorageKey(): string {
  return "hemz-wishlist-guest"
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Get current user ID
  const userId = user?.id || null

  // Load wishlist from API for authenticated users
  const loadWishlistFromAPI = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/wishlist")
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("[Wishlist] API returned non-JSON response")
        setItems([])
        return
      }
      
      const data = await response.json()
      
      if (data.success && data.items) {
        setItems(data.items.map((item: { id: string; title: string; price: number; image: string; selected_variant_id?: string; selected_variant_name?: string }) => ({
          id: item.id,
          title: item.title,
          price: item.price / 100, // Convert cents to dollars
          image: item.image || "/placeholder.jpg",
          selected_variant_id: item.selected_variant_id,
          selected_variant_name: item.selected_variant_name,
        })))
      } else {
        // API returned error or no items
        setItems([])
      }
    } catch (error) {
      console.error("[Wishlist] Failed to load from API:", error)
      setItems([])
    } finally {
      setIsLoading(false)
      setIsLoaded(true)
    }
  }, [])

  // Load wishlist from localStorage for guests
  const loadWishlistFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(getGuestWishlistStorageKey())
      if (stored) {
        setItems(JSON.parse(stored))
      } else {
        setItems([])
      }
    } catch (error) {
      console.error("[Wishlist] Failed to load from localStorage:", error)
      setItems([])
    }
    setIsLoaded(true)
  }, [])

  // Load wishlist when user changes (login/logout)
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated && userId) {
        // Load from database for logged in users
        loadWishlistFromAPI()
      } else {
        // Load from localStorage for guests
        loadWishlistFromStorage()
      }
    }
  }, [userId, authLoading, isAuthenticated, loadWishlistFromAPI, loadWishlistFromStorage])

  // Save guest wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded && !authLoading && !isAuthenticated) {
      try {
        localStorage.setItem(getGuestWishlistStorageKey(), JSON.stringify(items))
      } catch (error) {
        console.error("[Wishlist] Failed to save to localStorage:", error)
      }
    }
  }, [items, isLoaded, isAuthenticated, authLoading])

  // Add item - sync with API for authenticated users
  const addItem = useCallback(async (item: WishlistItem) => {
    // Optimistically update UI
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) {
        return prev
      }
      return [...prev, item]
    })

    // Sync with database for authenticated users
    if (isAuthenticated) {
      try {
        const response = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: item.id,
            title: item.title,
            price: Math.round(item.price * 100), // Convert to cents
            image: item.image,
            selectedVariantId: item.selected_variant_id,
            selectedVariantName: item.selected_variant_name,
          }),
        })
        
        // Check if response is JSON
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("[Wishlist] API returned non-JSON response")
          setItems((prev) => prev.filter((i) => i.id !== item.id))
          return
        }
        
        const data = await response.json()
        if (!data.success) {
          console.error("[Wishlist] API error adding item:", data.error)
          // Revert optimistic update on failure
          setItems((prev) => prev.filter((i) => i.id !== item.id))
        }
      } catch (error) {
        console.error("[Wishlist] Failed to sync add with API:", error)
        // Revert optimistic update on failure
        setItems((prev) => prev.filter((i) => i.id !== item.id))
      }
    }
  }, [isAuthenticated])

  // Remove item - sync with API for authenticated users
  const removeItem = useCallback(async (id: string) => {
    // Store item for potential rollback
    const itemToRemove = items.find((item) => item.id === id)
    
    // Optimistically update UI
    setItems((prev) => prev.filter((item) => item.id !== id))

    // Sync with database for authenticated users
    if (isAuthenticated) {
      try {
        const response = await fetch(`/api/wishlist?productId=${id}`, {
          method: "DELETE",
        })
        
        // Check if response is JSON
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("[Wishlist] API returned non-JSON response")
          if (itemToRemove) {
            setItems((prev) => [...prev, itemToRemove])
          }
          return
        }
        
        const data = await response.json()
        if (!data.success) {
          console.error("[Wishlist] API error removing item:", data.error)
          // Revert optimistic update on failure
          if (itemToRemove) {
            setItems((prev) => [...prev, itemToRemove])
          }
        }
      } catch (error) {
        console.error("[Wishlist] Failed to sync remove with API:", error)
        // Revert optimistic update on failure
        if (itemToRemove) {
          setItems((prev) => [...prev, itemToRemove])
        }
      }
    }
  }, [isAuthenticated, items])

  const isInWishlist = useCallback((id: string) => {
    return items.some((item) => item.id === id)
  }, [items])

  const toggleWishlist = useCallback((item: WishlistItem) => {
    if (isInWishlist(item.id)) {
      removeItem(item.id)
    } else {
      addItem(item)
    }
  }, [isInWishlist, removeItem, addItem])

  const clearWishlist = useCallback(async () => {
    // Clear all items locally
    const currentItems = [...items]
    setItems([])

    // Sync with database for authenticated users
    if (isAuthenticated) {
      try {
        // Remove each item from database
        await Promise.all(
          currentItems.map((item) =>
            fetch(`/api/wishlist?productId=${item.id}`, { method: "DELETE" })
          )
        )
      } catch (error) {
        console.error("[Wishlist] Failed to sync clear with API:", error)
      }
    }
  }, [items, isAuthenticated])

  // Refresh wishlist from API - useful for syncing after external changes
  const refreshWishlist = useCallback(async () => {
    if (isAuthenticated) {
      await loadWishlistFromAPI()
    }
  }, [isAuthenticated, loadWishlistFromAPI])

  return (
    <WishlistContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        isInWishlist,
        toggleWishlist,
        clearWishlist,
        refreshWishlist,
        itemCount: items.length,
        isLoading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}
