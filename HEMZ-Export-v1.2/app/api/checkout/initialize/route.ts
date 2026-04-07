import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth/require-user"
import {
  createPendingOrderNumber,
  calculateShippingByMethod,
  CheckoutAddress,
  CheckoutCartItem,
  getValidatedCartItems,
  normalizeAddress,
  serializeOrder,
  validateAddress,
  validateCoupon,
} from "@/lib/orders"
import { calculateTax } from "@/lib/utils"

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-09-30.clover",
    })
  : null

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ success: false, error: "Stripe not configured" }, { status: 500 })
    }

    const auth = await requireUser()
    if (!auth.ok) {
      return auth.response
    }

    const body = await request.json()
    const billingAddress = normalizeAddress(body.billing_address as CheckoutAddress)
    const shippingAddress = normalizeAddress(body.shipping_address as CheckoutAddress)
    const items = (Array.isArray(body.items) ? body.items : []) as CheckoutCartItem[]
    const shippingMethod = typeof body.shipping_method === "string" ? body.shipping_method : "standard"
    const couponCode = typeof body.coupon_code === "string" ? body.coupon_code.trim().toUpperCase() : ""

    const billingError = validateAddress(billingAddress, "Billing")
    if (billingError) {
      return NextResponse.json({ success: false, error: billingError }, { status: 400 })
    }

    const shippingError = validateAddress(shippingAddress, "Shipping")
    if (shippingError) {
      return NextResponse.json({ success: false, error: shippingError }, { status: 400 })
    }

    const validatedItems = await getValidatedCartItems(items)
    const subtotalCents = validatedItems.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0
    )
    const shippingCents = calculateShippingByMethod(shippingMethod)
    const taxCents = calculateTax(subtotalCents, billingAddress.country, billingAddress.state)
    const { coupon, discountCents } = await validateCoupon(couponCode, subtotalCents)
    const totalCents = Math.max(0, subtotalCents + shippingCents + taxCents - discountCents)

    if (totalCents < 50) {
      return NextResponse.json({ success: false, error: "Order total is too low" }, { status: 400 })
    }

    const orderNumber = await createPendingOrderNumber()

    const createdOrder = await prisma.$transaction(async (tx) => {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalCents,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        receipt_email: billingAddress.email || auth.user.email,
        shipping: {
          name: `${shippingAddress.first_name} ${shippingAddress.last_name}`.trim(),
          address: {
            line1: shippingAddress.address_line_1,
            line2: shippingAddress.address_line_2 || undefined,
            city: shippingAddress.city,
            state: shippingAddress.state || undefined,
            postal_code: shippingAddress.postal_code,
            country: shippingAddress.country,
          },
          phone: shippingAddress.phone || undefined,
        },
        metadata: {
          order_number: orderNumber,
          user_id: auth.user.id,
        },
      })

      const order = await tx.userOrder.create({
        data: {
          user_id: auth.user.id,
          order_number: orderNumber,
          status: "pending",
          subtotal_cents: subtotalCents,
          discount_cents: discountCents,
          shipping_cents: shippingCents,
          tax_cents: taxCents,
          total_cents: totalCents,
          currency: "USD",
          coupon_code: coupon?.code || null,
          payment_gateway: "stripe",
          payment_intent_id: paymentIntent.id,
          payment_status: "pending",
          billing_name: `${billingAddress.first_name} ${billingAddress.last_name}`.trim(),
          billing_address: [billingAddress.address_line_1, billingAddress.address_line_2].filter(Boolean).join(", "),
          billing_city: billingAddress.city,
          billing_state: billingAddress.state || null,
          billing_postal: billingAddress.postal_code,
          billing_country: billingAddress.country,
          billing_phone: billingAddress.phone || null,
          shipping_name: `${shippingAddress.first_name} ${shippingAddress.last_name}`.trim(),
          shipping_address: [shippingAddress.address_line_1, shippingAddress.address_line_2].filter(Boolean).join(", "),
          shipping_city: shippingAddress.city,
          shipping_state: shippingAddress.state || null,
          shipping_postal: shippingAddress.postal_code,
          shipping_country: shippingAddress.country,
          shipping_phone: shippingAddress.phone || null,
          shipping_method: shippingMethod,
          items: {
            create: validatedItems.map((item) => ({
              product_id: item.product.id,
              product_title: item.productTitle,
              product_sku: item.sku,
              variant_info: item.variantInfo,
              quantity: item.quantity,
              unit_price_cents: item.unitPriceCents,
            })),
          },
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

      await stripe.paymentIntents.update(paymentIntent.id, {
        metadata: {
          order_number: orderNumber,
          user_id: auth.user.id,
          user_order_id: order.id,
        },
      })

      return {
        order,
        paymentIntent,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        client_secret: createdOrder.paymentIntent.client_secret,
        payment_intent_id: createdOrder.paymentIntent.id,
        order_id: createdOrder.order.id,
        order_number: createdOrder.order.order_number,
        totals: {
          subtotal_cents: subtotalCents,
          shipping_cents: shippingCents,
          tax_cents: taxCents,
          discount_cents: discountCents,
          total_cents: totalCents,
        },
        order: serializeOrder(createdOrder.order),
      },
    })
  } catch (error) {
    console.error("[Checkout Initialize] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to initialize checkout" },
      { status: 500 }
    )
  }
}
