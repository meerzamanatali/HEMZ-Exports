import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth/require-user"
import {
  CANCELLATION_REASON_OPTIONS,
  canRequestOrderCancellation,
  serializeOrder,
} from "@/lib/orders"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser()
    if (!auth.ok) {
      return auth.response
    }

    const { id } = await params
    const body = await request.json()
    const reason = typeof body.reason === "string" ? body.reason.trim() : ""
    const details = typeof body.details === "string" ? body.details.trim() : ""

    if (!reason || !CANCELLATION_REASON_OPTIONS.some((option) => option.value === reason)) {
      return NextResponse.json({ success: false, error: "A valid cancellation reason is required" }, { status: 400 })
    }

    if (!details) {
      return NextResponse.json({ success: false, error: "Cancellation details are required" }, { status: 400 })
    }

    const existingOrder = await prisma.userOrder.findFirst({
      where: {
        id,
        user_id: auth.user.id,
      },
    })

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    if (!canRequestOrderCancellation(existingOrder)) {
      return NextResponse.json(
        { success: false, error: "This order is no longer eligible for cancellation requests" },
        { status: 400 }
      )
    }

    const order = await prisma.userOrder.update({
      where: { id: existingOrder.id },
      data: {
        cancel_requested_at: new Date(),
        cancel_request_reason: reason,
        cancel_request_details: details,
        cancel_request_status: "pending",
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

    return NextResponse.json({
      success: true,
      message: "Cancellation request submitted",
      order: serializeOrder(order),
    })
  } catch (error) {
    console.error("[Cancel Request] Failed to submit request:", error)
    return NextResponse.json({ success: false, error: "Failed to submit cancellation request" }, { status: 500 })
  }
}
