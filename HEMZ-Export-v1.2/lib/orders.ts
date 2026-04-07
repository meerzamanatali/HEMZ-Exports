import { prisma } from "@/lib/prisma"
import { formatPrice, generateOrderNumber } from "@/lib/utils"

export type CheckoutAddress = {
  first_name: string
  last_name: string
  company?: string
  address_line_1: string
  address_line_2?: string
  city: string
  state?: string
  postal_code: string
  country: string
  phone?: string
  email?: string
}

export type CheckoutCartItem = {
  variant_id: string
  quantity: number
  price_cents: number
  product_title: string
  variant_sku: string
  variant_attributes: Record<string, string | number | boolean | null | undefined>
}

export const SHIPPING_METHODS = [
  { id: "standard", name: "Standard International", description: "7-14 business days", price: 1500 },
  { id: "express", name: "Express International", description: "3-7 business days", price: 3500 },
  { id: "premium", name: "Premium White Glove", description: "2-5 business days with insurance", price: 7500 },
] as const

export type ShippingMethodId = (typeof SHIPPING_METHODS)[number]["id"]

export const CANCELLATION_REASON_OPTIONS = [
  { value: "ordered_by_mistake", label: "Ordered by mistake" },
  { value: "found_better_price", label: "Found a better price" },
  { value: "shipping_too_slow", label: "Shipping is too slow" },
  { value: "payment_issue", label: "Payment issue" },
  { value: "changed_mind", label: "Changed my mind" },
  { value: "other", label: "Other" },
] as const

export function getShippingMethod(methodId?: string | null) {
  return SHIPPING_METHODS.find((method) => method.id === methodId) || SHIPPING_METHODS[0]
}

export function calculateShippingByMethod(methodId?: string | null) {
  return getShippingMethod(methodId).price
}

export function normalizeAddress(address: CheckoutAddress): CheckoutAddress {
  return {
    first_name: address.first_name?.trim() || "",
    last_name: address.last_name?.trim() || "",
    company: address.company?.trim() || "",
    address_line_1: address.address_line_1?.trim() || "",
    address_line_2: address.address_line_2?.trim() || "",
    city: address.city?.trim() || "",
    state: address.state?.trim() || "",
    postal_code: address.postal_code?.trim() || "",
    country: address.country?.trim() || "US",
    phone: address.phone?.trim() || "",
    email: address.email?.trim() || "",
  }
}

export function validateAddress(address: CheckoutAddress, label: string) {
  const normalized = normalizeAddress(address)
  const requiredFields: Array<keyof CheckoutAddress> = [
    "first_name",
    "last_name",
    "address_line_1",
    "city",
    "postal_code",
    "country",
  ]

  for (const field of requiredFields) {
    if (!normalized[field]) {
      return `${label} ${field.replaceAll("_", " ")} is required`
    }
  }

  if (!normalized.email) {
    return `${label} email is required`
  }

  return null
}

export function calculateOrderDisplayStatus(order: {
  status: string
  payment_status?: string | null
  cancel_request_status?: string | null
}) {
  if (order.cancel_request_status === "pending" && order.status !== "cancelled") {
    return "cancel_requested"
  }

  if (order.payment_status === "failed" && order.status === "pending") {
    return "failed"
  }

  return order.status
}

export function canRequestOrderCancellation(order: {
  status: string
  payment_status?: string | null
  cancel_request_status?: string | null
}) {
  const displayStatus = calculateOrderDisplayStatus(order)
  if (displayStatus === "cancel_requested" || displayStatus === "failed") {
    return false
  }

  return ["pending", "paid", "processing"].includes(order.status)
}

export async function validateCoupon(code: string | null | undefined, subtotalCents: number) {
  if (!code?.trim()) {
    return {
      coupon: null,
      discountCents: 0,
    }
  }

  const normalizedCode = code.trim().toUpperCase()
  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
  })

  if (!coupon) {
    throw new Error("Invalid coupon code")
  }

  const now = new Date()
  if (!coupon.is_active || coupon.valid_from > now || coupon.valid_until < now) {
    throw new Error("Coupon is not active")
  }

  if (coupon.max_uses !== null && coupon.times_used >= coupon.max_uses) {
    throw new Error("Coupon usage limit reached")
  }

  if (subtotalCents < coupon.min_order_cents) {
    throw new Error(`Coupon requires a minimum order of ${formatPrice(coupon.min_order_cents)}`)
  }

  let discountCents = 0
  if (coupon.discount_type === "percent") {
    discountCents = Math.round(subtotalCents * (coupon.discount_value / 100))
  } else {
    discountCents = Math.round(coupon.discount_value * 100)
  }

  if (coupon.max_discount_cents !== null) {
    discountCents = Math.min(discountCents, coupon.max_discount_cents)
  }

  discountCents = Math.max(0, Math.min(discountCents, subtotalCents))

  return {
    coupon,
    discountCents,
  }
}

export function serializeVariantInfo(attributes: CheckoutCartItem["variant_attributes"]) {
  const entries = Object.entries(attributes || {}).filter(([, value]) => value !== undefined && value !== null && value !== "")
  return entries.length === 0 ? null : JSON.stringify(attributes)
}

export function buildOrderEmailPayload(
  order: {
    order_number: string
    subtotal_cents: number
    shipping_cents: number
    tax_cents: number
    total_cents: number
    discount_cents: number
    shipping_name: string
    shipping_address: string
    shipping_city: string
    shipping_state: string | null
    shipping_postal: string
    shipping_country: string
    shipping_phone: string | null
    user: { email: string }
  },
  items: Array<{
    quantity: number
    unit_price_cents: number
    product_title: string
    product_sku?: string | null
    variant_info?: string | null
  }>
) {
  const [firstName, ...lastNameParts] = order.shipping_name.split(" ")

  return {
    email: order.user.email,
    order_number: order.order_number,
    subtotal_cents: order.subtotal_cents,
    shipping_cents: order.shipping_cents,
    tax_cents: order.tax_cents,
    discount_cents: order.discount_cents,
    total_cents: order.total_cents,
    items_json: items.map((item) => ({
      product_title: item.product_title,
      variant_sku: item.product_sku || "",
      variant_attributes: item.variant_info ? JSON.parse(item.variant_info) : {},
      quantity: item.quantity,
      price_cents: item.unit_price_cents,
    })),
    shipping_address_json: {
      first_name: firstName || order.shipping_name,
      last_name: lastNameParts.join(" "),
      address_line_1: order.shipping_address,
      city: order.shipping_city,
      state: order.shipping_state || "",
      postal_code: order.shipping_postal,
      country: order.shipping_country,
      phone: order.shipping_phone || "",
    },
  }
}

export async function getValidatedCartItems(items: CheckoutCartItem[]) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Your cart is empty")
  }

  const productIds = Array.from(new Set(items.map((item) => item.variant_id)))
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
    },
  })
  const variants = await prisma.productColorVariant.findMany({
    where: {
      id: { in: productIds },
    },
    include: {
      product: true,
    },
  })

  const productMap = new Map(products.map((product) => [product.id, product]))
  const variantMap = new Map(variants.map((variant) => [variant.id, variant]))

  return items.map((item) => {
    const variant = variantMap.get(item.variant_id)
    const product = variant?.product || productMap.get(item.variant_id)

    if (!product) {
      throw new Error(`Product not found for cart item ${item.product_title}`)
    }

    const availableStock = variant ? variant.in_stock : product.in_stock
    const isAvailable = variant ? variant.is_available && variant.in_stock > 0 : product.is_available && product.in_stock > 0

    if (!isAvailable || availableStock <= 0) {
      throw new Error(`${product.title} is currently unavailable`)
    }

    if (item.quantity <= 0) {
      throw new Error(`Invalid quantity for ${product.title}`)
    }

    if (availableStock < item.quantity) {
      throw new Error(`Only ${availableStock} units of ${product.title} are available`)
    }

    const unitPriceCents = Math.max(
      0,
      Math.round(product.price_cents * (1 - ((product.discount_percent || 0) / 100)))
    )

    const variantAttributes = {
      ...(item.variant_attributes || {}),
      color: variant?.name || item.variant_attributes?.color,
    }

    return {
      product,
      variant,
      quantity: item.quantity,
      unitPriceCents,
      productTitle: product.title,
      sku: variant?.sku || product.sku || item.variant_sku || product.id,
      variantInfo: serializeVariantInfo(variantAttributes),
    }
  })
}

export async function createPendingOrderNumber() {
  let orderNumber = generateOrderNumber()
  let existing = await prisma.userOrder.findUnique({
    where: { order_number: orderNumber },
    select: { id: true },
  })

  while (existing) {
    orderNumber = generateOrderNumber()
    existing = await prisma.userOrder.findUnique({
      where: { order_number: orderNumber },
      select: { id: true },
    })
  }

  return orderNumber
}

export function serializeOrder(order: any) {
  const displayStatus = calculateOrderDisplayStatus(order)

  return {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    display_status: displayStatus,
    payment_status: order.payment_status,
    total_cents: order.total_cents,
    subtotal_cents: order.subtotal_cents,
    shipping_cents: order.shipping_cents,
    tax_cents: order.tax_cents,
    discount_cents: order.discount_cents,
    coupon_code: order.coupon_code,
    currency: order.currency,
    payment_gateway: order.payment_gateway,
    payment_intent_id: order.payment_intent_id,
    billing_name: order.billing_name,
    billing_address: order.billing_address,
    billing_city: order.billing_city,
    billing_state: order.billing_state,
    billing_postal: order.billing_postal,
    billing_country: order.billing_country,
    billing_phone: order.billing_phone,
    shipping_name: order.shipping_name,
    shipping_address: order.shipping_address,
    shipping_city: order.shipping_city,
    shipping_state: order.shipping_state,
    shipping_postal: order.shipping_postal,
    shipping_country: order.shipping_country,
    shipping_phone: order.shipping_phone,
    shipping_method: order.shipping_method,
    tracking_number: order.tracking_number,
    carrier: order.carrier,
    notes: order.notes,
    failure_reason: order.failure_reason,
    failed_at: order.failed_at,
    cancel_requested_at: order.cancel_requested_at,
    cancel_request_reason: order.cancel_request_reason,
    cancel_request_details: order.cancel_request_details,
    cancel_request_status: order.cancel_request_status,
    cancel_reviewed_at: order.cancel_reviewed_at,
    cancel_reviewed_by: order.cancel_reviewed_by,
    can_request_cancellation: canRequestOrderCancellation(order),
    created_at: order.created_at,
    updated_at: order.updated_at,
    shipped_at: order.shipped_at,
    delivered_at: order.delivered_at,
    user: order.user
      ? {
          id: order.user.id,
          email: order.user.email,
          first_name: order.user.first_name,
          last_name: order.user.last_name,
        }
      : null,
    items: Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product_title: item.product_title,
          product_sku: item.product_sku,
          variant_info: item.variant_info ? JSON.parse(item.variant_info) : null,
          quantity: item.quantity,
          unit_price_cents: item.unit_price_cents,
          created_at: item.created_at,
        }))
      : [],
  }
}
