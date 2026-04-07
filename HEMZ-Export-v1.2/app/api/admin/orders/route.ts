import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminSession } from "@/lib/auth/admin-session"
import { calculateOrderDisplayStatus, serializeOrder } from "@/lib/orders"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminSession()
    if (!auth.ok) {
      return auth.response
    }

    const { searchParams } = new URL(request.url)
    const search = (searchParams.get("search") || "").trim().toLowerCase()
    const status = (searchParams.get("status") || "all").trim().toLowerCase()

    const orders = await prisma.userOrder.findMany({
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
      orderBy: { created_at: "desc" },
    })

    const filteredOrders = orders.filter((order) => {
      const displayStatus = calculateOrderDisplayStatus(order)
      const customerName = `${order.user?.first_name || ""} ${order.user?.last_name || ""}`.trim().toLowerCase()
      const matchesSearch =
        !search ||
        order.order_number.toLowerCase().includes(search) ||
        (order.user?.email || "").toLowerCase().includes(search) ||
        customerName.includes(search)

      const matchesStatus =
        status === "all" ||
        displayStatus === status ||
        order.status.toLowerCase() === status ||
        (order.payment_status || "").toLowerCase() === status

      return matchesSearch && matchesStatus
    })

    return NextResponse.json({
      success: true,
      orders: filteredOrders.map((order) => serializeOrder(order)),
    })
  } catch (error) {
    console.error("[Admin Orders] Failed to fetch orders:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 })
  }
}
