import { type NextRequest, NextResponse } from "next/server"
import { cartQueries, productQueries } from "@/lib/database"

// GET /api/cart - Get cart by session ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Session ID is required" }, { status: 400 })
    }

    const cart = await cartQueries.getOrCreateCart(sessionId)

    return NextResponse.json({
      success: true,
      data: cart,
    })
  } catch (error) {
    console.error("[API] Cart GET error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch cart" }, { status: 500 })
  }
}

// POST /api/cart - Add item to cart or update cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, variant_id, quantity = 1, action = "add" } = body

    if (!session_id || !variant_id) {
      return NextResponse.json({ success: false, error: "Session ID and variant ID are required" }, { status: 400 })
    }

    // Get or create cart
    const cart = await cartQueries.getOrCreateCart(session_id)

    // Parse current items
    const currentItems = Array.isArray(cart.items_json) ? cart.items_json : []

    // Check stock availability
    const stockCheck = await productQueries.checkStock(variant_id, quantity)
    if (!stockCheck.available) {
      return NextResponse.json({ success: false, error: stockCheck.reason }, { status: 400 })
    }

    // Find existing item
    const existingItemIndex = currentItems.findIndex((item: any) => item.variant_id === variant_id)

    const updatedItems = [...currentItems]

    if (action === "add") {
      if (existingItemIndex > -1) {
        // Update existing item quantity
        updatedItems[existingItemIndex].quantity += quantity
      } else {
        // Add new item - we need to fetch product details
        // For now, we'll use the provided data from the frontend
        const newItem = {
          variant_id,
          quantity,
          price_cents: body.price_cents,
          product_title: body.product_title,
          variant_sku: body.variant_sku,
          variant_attributes: body.variant_attributes,
        }
        updatedItems.push(newItem)
      }
    } else if (action === "update") {
      if (existingItemIndex > -1) {
        if (quantity <= 0) {
          // Remove item
          updatedItems.splice(existingItemIndex, 1)
        } else {
          // Update quantity
          updatedItems[existingItemIndex].quantity = quantity
        }
      }
    } else if (action === "remove") {
      if (existingItemIndex > -1) {
        updatedItems.splice(existingItemIndex, 1)
      }
    }

    // Update cart in database
    const updatedCart = await cartQueries.updateCartItems(cart.id, updatedItems)

    return NextResponse.json({
      success: true,
      data: updatedCart,
      message: `Item ${action}ed successfully`,
    })
  } catch (error) {
    console.error("[API] Cart POST error:", error)
    return NextResponse.json({ success: false, error: "Failed to update cart" }, { status: 500 })
  }
}

// DELETE /api/cart - Clear cart
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Session ID is required" }, { status: 400 })
    }

    const cart = await cartQueries.getOrCreateCart(sessionId)
    const updatedCart = await cartQueries.updateCartItems(cart.id, [])

    return NextResponse.json({
      success: true,
      data: updatedCart,
      message: "Cart cleared successfully",
    })
  } catch (error) {
    console.error("[API] Cart DELETE error:", error)
    return NextResponse.json({ success: false, error: "Failed to clear cart" }, { status: 500 })
  }
}
