import { NextRequest, NextResponse } from "next/server"
import { validateCoupon } from "@/lib/orders"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const code = typeof body.code === "string" ? body.code : ""
    const orderTotal = typeof body.order_total === "number" ? body.order_total : 0

    const { coupon, discountCents } = await validateCoupon(code, orderTotal)

    return NextResponse.json({
      success: true,
      data: {
        code: coupon?.code || null,
        discount_amount: discountCents,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to validate coupon",
      },
      { status: 400 }
    )
  }
}
