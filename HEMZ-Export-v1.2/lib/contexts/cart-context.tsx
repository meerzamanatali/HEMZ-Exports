"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from "react"
import type { CartItem } from "@/lib/types/ecommerce"
import { useAuth } from "./auth-context"

interface CartState {
  items: CartItem[]
  isOpen: boolean
  isLoading: boolean
}

interface CartContextType extends CartState {
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  syncWithServer: () => Promise<void>
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { variantId: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_CART" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ITEMS"; payload: CartItem[] }

const CartContext = createContext<CartContextType | undefined>(undefined)

const GUEST_CART_SESSION_KEY = "hemz-guest-cart-session-id"

function createGuestCartSessionId(): string {
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// Helper function to get the cart storage key based on user
function getCartStorageKey(userId: string | null): string {
  if (userId) {
    return `hemz-cart-user-${userId}`
  }
  if (typeof window === "undefined") {
    return "hemz-cart-guest-anonymous"
  }

  let guestSessionId = localStorage.getItem(GUEST_CART_SESSION_KEY)
  if (!guestSessionId) {
    guestSessionId = createGuestCartSessionId()
    localStorage.setItem(GUEST_CART_SESSION_KEY, guestSessionId)
  }

  return `hemz-cart-${guestSessionId}`
}

function rotateGuestCartStorageKey() {
  if (typeof window === "undefined") {
    return
  }

  localStorage.setItem(GUEST_CART_SESSION_KEY, createGuestCartSessionId())
}

function shouldCompactStoredImage(image?: string) {
  if (!image) {
    return false
  }

  return image.startsWith("data:image") || image.length > 512
}

function compactCartItemsForStorage(items: CartItem[]) {
  return items.map((item) => ({
    ...item,
    product_image: shouldCompactStoredImage(item.product_image) ? undefined : item.product_image,
  }))
}

function saveCartToStorage(storageKey: string, items: CartItem[]) {
  if (typeof window === "undefined") {
    return
  }

  const compactedItems = compactCartItemsForStorage(items)

  try {
    localStorage.setItem(storageKey, JSON.stringify(compactedItems))
  } catch (error) {
    console.error("[Cart] Failed to save full cart to localStorage, retrying with stripped images:", error)
    const strippedItems = compactedItems.map((item) => ({
      ...item,
      product_image: undefined,
    }))

    try {
      localStorage.setItem(storageKey, JSON.stringify(strippedItems))
    } catch (retryError) {
      console.error("[Cart] Failed to save compact cart to localStorage:", retryError)
    }
  }
}

function readCartFromStorage(storageKey: string): CartItem[] {
  if (typeof window === "undefined") {
    return []
  }

  const savedCart = localStorage.getItem(storageKey)
  if (!savedCart) {
    return []
  }

  try {
    const parsedCart = JSON.parse(savedCart)
    return Array.isArray(parsedCart) ? parsedCart : []
  } catch (error) {
    console.error("[Cart] Failed to parse cart from localStorage:", error)
    return []
  }
}

function mergeCartItems(baseItems: CartItem[], incomingItems: CartItem[]) {
  const merged = [...baseItems]

  incomingItems.forEach((incomingItem) => {
    const existingItemIndex = merged.findIndex((item) => item.variant_id === incomingItem.variant_id)

    if (existingItemIndex > -1) {
      merged[existingItemIndex] = {
        ...merged[existingItemIndex],
        quantity: merged[existingItemIndex].quantity + incomingItem.quantity,
      }
      return
    }

    merged.push(incomingItem)
  })

  return merged
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex((item) => item.variant_id === action.payload.variant_id)

      if (existingItemIndex > -1) {
        const updatedItems = [...state.items]
        updatedItems[existingItemIndex].quantity += action.payload.quantity
        return { ...state, items: updatedItems }
      }

      return { ...state, items: [...state.items, action.payload] }
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.variant_id !== action.payload),
      }

    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.variant_id !== action.payload.variantId),
        }
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.variant_id === action.payload.variantId ? { ...item, quantity: action.payload.quantity } : item,
        ),
      }
    }

    case "CLEAR_CART":
      return { ...state, items: [] }

    case "TOGGLE_CART":
      return { ...state, isOpen: !state.isOpen }

    case "SET_LOADING":
      return { ...state, isLoading: action.payload }

    case "SET_ITEMS":
      return { ...state, items: action.payload }

    default:
      return state
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const previousUserIdRef = useRef<string | null>(null)
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isOpen: false,
    isLoading: false,
  })

  // Get current user ID for cart storage
  const userId = user?.id || null

  // Load cart from localStorage based on user
  const loadCart = useCallback(() => {
    const storageKey = getCartStorageKey(userId)
    dispatch({ type: "SET_ITEMS", payload: readCartFromStorage(storageKey) })
  }, [userId])

  // Merge guest cart into user cart on login and reset guest cart on logout
  useEffect(() => {
    if (authLoading) {
      return
    }

    const previousUserId = previousUserIdRef.current

    if (!previousUserId && userId) {
      const guestStorageKey = getCartStorageKey(null)
      const userStorageKey = getCartStorageKey(userId)
      const guestCart = readCartFromStorage(guestStorageKey)
      const userCart = readCartFromStorage(userStorageKey)
      const mergedCart = mergeCartItems(userCart, guestCart)

      saveCartToStorage(userStorageKey, mergedCart)
      localStorage.removeItem(guestStorageKey)
      rotateGuestCartStorageKey()
      dispatch({ type: "SET_ITEMS", payload: mergedCart })
    } else if (previousUserId && !userId) {
      rotateGuestCartStorageKey()
      dispatch({ type: "SET_ITEMS", payload: [] })
    } else {
      loadCart()
    }

    previousUserIdRef.current = userId
  }, [userId, authLoading, loadCart])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (!authLoading) {
      const storageKey = getCartStorageKey(userId)
      saveCartToStorage(storageKey, state.items)
    }
  }, [state.items, userId, authLoading])

  useEffect(() => {
    if (authLoading || state.items.length === 0 || state.items.every((item) => item.product_image)) {
      return
    }

    let cancelled = false

    const backfillCartImages = async () => {
      try {
        const response = await fetch("/api/products?limit=200")
        const data = await response.json()
        const products = Array.isArray(data.products) ? data.products : []

        const imageMap = new Map<string, string>()
        products.forEach((product: any) => {
          const defaultImage =
            product?.default_variant?.images?.[0] ||
            product?.images?.[0] ||
            product?.photos?.[0] ||
            "/placeholder.svg"

          imageMap.set(product.id, defaultImage)

          if (Array.isArray(product.variants)) {
            product.variants.forEach((variant: any) => {
              imageMap.set(variant.id, variant?.images?.[0] || defaultImage)
            })
          }
        })

        if (cancelled) {
          return
        }

        const nextItems = state.items.map((item) => ({
          ...item,
          product_image: item.product_image || imageMap.get(item.variant_id) || "/placeholder.svg",
        }))

        dispatch({ type: "SET_ITEMS", payload: nextItems })
      } catch (error) {
        console.error("[Cart] Failed to backfill cart images:", error)
      }
    }

    void backfillCartImages()

    return () => {
      cancelled = true
    }
  }, [state.items, authLoading])

  const addItem = (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    const cartItem: CartItem = {
      ...item,
      quantity: item.quantity || 1,
    }
    dispatch({ type: "ADD_ITEM", payload: cartItem })
  }

  const removeItem = (variantId: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: variantId })
  }

  const updateQuantity = (variantId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { variantId, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" })
  }

  const toggleCart = () => {
    dispatch({ type: "TOGGLE_CART" })
  }

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return state.items.reduce((total, item) => total + item.price_cents * item.quantity, 0)
  }

  const syncWithServer = async () => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      // TODO: Implement server sync when user logs in
      console.log("[Cart] Server sync not implemented yet")
    } catch (error) {
      console.error("[Cart] Failed to sync with server:", error)
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        getTotalItems,
        getTotalPrice,
        syncWithServer,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
