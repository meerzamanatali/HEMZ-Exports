import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/cart - Get cart by session ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Session ID is required" }, { status: 400 })
    }

    const items = await prisma.cartItem.findMany({
      where: { session_id: sessionId },
      include: { product: true },
    })

    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error("[API] Cart GET error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch cart" }, { status: 500 })
  }
}

// POST /api/cart - Add/update/remove cart item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, product_id, quantity = 1, action = "add" } = body

    if (!session_id || !product_id) {
      return NextResponse.json({ success: false, error: "Session ID and product ID are required" }, { status: 400 })
    }

    const existing = await prisma.cartItem.findFirst({
      where: { session_id, product_id },
    })

    if (action === "add") {
      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
        })
      } else {
        await prisma.cartItem.create({
          data: { session_id, product_id, quantity },
        })
      }
    } else if (action === "update") {
      if (existing) {
        if (quantity <= 0) {
          await prisma.cartItem.delete({ where: { id: existing.id } })
        } else {
          await prisma.cartItem.update({
            where: { id: existing.id },
            data: { quantity },
          })
        }
      }
    } else if (action === "remove") {
      if (existing) {
        await prisma.cartItem.delete({ where: { id: existing.id } })
      }
    }

    const items = await prisma.cartItem.findMany({
      where: { session_id },
      include: { product: true },
    })

    return NextResponse.json({ success: true, data: items, message: `Item ${action}ed successfully` })
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

    await prisma.cartItem.deleteMany({ where: { session_id: sessionId } })

    return NextResponse.json({ success: true, message: "Cart cleared successfully" })
  } catch (error) {
    console.error("[API] Cart DELETE error:", error)
    return NextResponse.json({ success: false, error: "Failed to clear cart" }, { status: 500 })
  }
}