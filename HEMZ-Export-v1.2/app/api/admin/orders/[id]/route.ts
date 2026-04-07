import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminSession } from "@/lib/auth/admin-session"
import { serializeOrder } from "@/lib/orders"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminSession()
    if (!auth.ok) {
      return auth.response
    }

    const { id } = await params
    const order = await prisma.userOrder.findUnique({
      where: { id },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone: true,
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
    console.error("[Admin Order Detail] Failed to fetch order:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch order" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminSession()
    if (!auth.ok) {
      return auth.response
    }

    const { id } = await params
    const body = await request.json()

    const currentOrder = await prisma.userOrder.findUnique({
      where: { id },
    })

    if (!currentOrder) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    const updateData: Record<string, string | Date | null> = {}

    if (typeof body.status === "string" && body.status.trim()) {
      updateData.status = body.status.trim()
      if (body.status === "shipped" && !currentOrder.shipped_at) {
        updateData.shipped_at = new Date()
      }
      if (body.status === "delivered" && !currentOrder.delivered_at) {
        updateData.delivered_at = new Date()
      }
      if (body.status === "cancelled") {
        updateData.cancel_request_status = currentOrder.cancel_request_status === "pending" ? "approved" : currentOrder.cancel_request_status
      }
    }

    if (typeof body.tracking_number === "string") {
      updateData.tracking_number = body.tracking_number.trim() || null
    }

    if (typeof body.carrier === "string") {
      updateData.carrier = body.carrier.trim() || null
    }

    if (typeof body.notes === "string") {
      updateData.notes = body.notes.trim() || null
    }

    if (typeof body.cancel_request_status === "string") {
      updateData.cancel_request_status = body.cancel_request_status
      updateData.cancel_reviewed_at = new Date()
      updateData.cancel_reviewed_by = auth.session.email
      if (body.cancel_request_status === "approved") {
        updateData.status = "cancelled"
      }
    }

    const order = await prisma.userOrder.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      order: serializeOrder(order),
    })
  } catch (error) {
    console.error("[Admin Order Detail] Failed to update order:", error)
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 })
  }
}
