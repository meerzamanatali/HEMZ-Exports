import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { buildOrderEmailPayload } from "@/lib/orders"
import { emailService } from "@/lib/email/email-service"

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-09-30.clover",
    })
  : null

export async function POST(request: NextRequest) {
  try {
    if (!stripe || !webhookSecret) {
      return NextResponse.json({ success: false, error: "Stripe not configured" }, { status: 500 })
    }

    const body = await request.text()
    const headerStore = await headers()
    const signature = headerStore.get("stripe-signature")

    if (!signature) {
      return NextResponse.json({ success: false, error: "No signature" }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("[Webhook] Signature verification failed:", err)
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 })
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
        break
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break
      case "payment_intent.canceled":
        await handlePaymentCancelled(event.data.object as Stripe.PaymentIntent)
        break
      default:
        break
    }

    return NextResponse.json({ success: true, received: true })
  } catch (error) {
    console.error("[Webhook] Error:", error)
    return NextResponse.json({ success: false, error: "Webhook handler failed" }, { status: 500 })
  }
}

async function findOrderByPaymentIntent(paymentIntent: Stripe.PaymentIntent) {
  const metadataOrderId = paymentIntent.metadata.user_order_id
  if (metadataOrderId) {
    return prisma.userOrder.findUnique({
      where: { id: metadataOrderId },
      include: {
        items: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    })
  }

  return prisma.userOrder.findFirst({
    where: { payment_intent_id: paymentIntent.id },
    include: {
      items: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  })
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const order = await findOrderByPaymentIntent(paymentIntent)
  if (!order || order.payment_status === "succeeded") {
    return
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const freshOrder = await tx.userOrder.findUnique({
      where: { id: order.id },
      include: { items: true, user: { select: { email: true } } },
    })

    if (!freshOrder || freshOrder.payment_status === "succeeded") {
      return freshOrder
    }

    for (const item of freshOrder.items) {
      const matchingVariant = item.product_sku
        ? await tx.productColorVariant.findUnique({
            where: { sku: item.product_sku },
          })
        : null

      if (matchingVariant) {
        await tx.productColorVariant.update({
          where: { id: matchingVariant.id },
          data: {
            in_stock: {
              decrement: item.quantity,
            },
          },
        })
      } else {
        await tx.product.update({
          where: { id: item.product_id },
          data: {
            in_stock: {
              decrement: item.quantity,
            },
          },
        })
      }

      const inventoryItem = await tx.inventoryItem.findFirst({
        where: { product_id: item.product_id },
        orderBy: { created_at: "asc" },
      })

      if (inventoryItem) {
        await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            on_hand: Math.max(0, inventoryItem.on_hand - item.quantity),
          },
        })

        await tx.inventoryAudit.create({
          data: {
            inventory_id: inventoryItem.id,
            reason: "order_paid",
            from_qty: inventoryItem.on_hand,
            to_qty: Math.max(0, inventoryItem.on_hand - item.quantity),
            changed_by: "stripe_webhook",
          },
        })
      }

      const productVariants = await tx.productColorVariant.findMany({
        where: { product_id: item.product_id },
        orderBy: { sort_order: "asc" },
      })

      if (productVariants.length > 0) {
        const totalStock = productVariants.reduce((sum, variant) => sum + Math.max(0, variant.in_stock), 0)
        const isAvailable = productVariants.some((variant) => variant.is_available && variant.in_stock > 0)
        await tx.product.update({
          where: { id: item.product_id },
          data: {
            in_stock: totalStock,
            is_available: isAvailable,
            colors: JSON.stringify(productVariants.map((variant) => variant.name)),
            images: JSON.stringify(
              Array.from(
                new Set(
                  productVariants.flatMap((variant) => {
                    try {
                      const parsed = JSON.parse(variant.images || "[]")
                      return Array.isArray(parsed) ? parsed.map((image) => String(image)) : []
                    } catch {
                      return []
                    }
                  })
                )
              )
            ),
          },
        })
      }
    }

    return tx.userOrder.update({
      where: { id: freshOrder.id },
      data: {
        status: "paid",
        payment_status: "succeeded",
        failure_reason: null,
        failed_at: null,
      },
      include: {
        items: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    })
  })

  if (!updatedOrder) {
    return
  }

  if (updatedOrder.coupon_code) {
    await prisma.coupon.updateMany({
      where: { code: updatedOrder.coupon_code },
      data: { times_used: { increment: 1 } },
    })
  }

  const emailPayload = buildOrderEmailPayload(updatedOrder, updatedOrder.items)
  const sent = await emailService.sendOrderConfirmation(emailPayload)
  if (!sent) {
    console.error("[Webhook] Failed to send order confirmation email for", updatedOrder.order_number)
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const order = await findOrderByPaymentIntent(paymentIntent)
  if (!order) {
    return
  }

  const failureReason =
    paymentIntent.last_payment_error?.message ||
    paymentIntent.cancellation_reason ||
    "Payment failed"

  const updatedOrder = await prisma.userOrder.update({
    where: { id: order.id },
    data: {
      payment_status: "failed",
      failure_reason: failureReason,
      failed_at: new Date(),
    },
    include: {
      items: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  })

  const emailPayload = buildOrderEmailPayload(updatedOrder, updatedOrder.items)
  const sent = await emailService.sendPaymentFailed(emailPayload)
  if (!sent) {
    console.error("[Webhook] Failed to send payment failed email for", updatedOrder.order_number)
  }
}

async function handlePaymentCancelled(paymentIntent: Stripe.PaymentIntent) {
  const order = await findOrderByPaymentIntent(paymentIntent)
  if (!order) {
    return
  }

  await prisma.userOrder.update({
    where: { id: order.id },
    data: {
      payment_status: "cancelled",
      failure_reason: paymentIntent.cancellation_reason || "Payment was cancelled",
      failed_at: new Date(),
    },
  })
}
