import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth/require-user"
import { serializeOrder } from "@/lib/orders"

export async function GET() {
  try {
    const auth = await requireUser()
    if (!auth.ok) {
      return auth.response
    }

    const orders = await prisma.userOrder.findMany({
      where: { user_id: auth.user.id },
      include: {
        items: true,
      },
      orderBy: { created_at: "desc" },
    })

    return NextResponse.json({
      success: true,
      orders: orders.map((order) => serializeOrder(order)),
    })
  } catch (error) {
    console.error("[Orders] Failed to fetch orders:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 })
  }
}
