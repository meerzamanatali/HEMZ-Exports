import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth/require-user"
import { serializeOrder } from "@/lib/orders"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser()
    if (!auth.ok) {
      return auth.response
    }

    const { id } = await params
    const order = await prisma.userOrder.findFirst({
      where: {
        id,
        user_id: auth.user.id,
      },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      order: serializeOrder(order),
    })
  } catch (error) {
    console.error("[Order Detail] Failed to fetch order:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch order" }, { status: 500 })
  }
}
