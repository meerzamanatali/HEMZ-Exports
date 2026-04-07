import { formatPrice } from "@/lib/utils"
import type { CartItem } from "@/lib/types/ecommerce"

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

function renderItemMeta(item: CartItem) {
  const attributeEntries = Object.entries(item.variant_attributes || {})
  const attributes =
    attributeEntries.length > 0
      ? attributeEntries.map(([key, value]) => `${key}: ${value}`).join(" | ")
      : ""

  return {
    attributes,
    sku: item.variant_sku || "",
  }
}

function getSupportEmail() {
  return process.env.ADMIN_EMAIL || "hemzexport@gmail.com"
}

export function orderConfirmationTemplate(order: any): EmailTemplate {
  const customerName =
    `${order.shipping_address_json?.first_name || ""} ${order.shipping_address_json?.last_name || ""}`.trim() || "there"
  const supportEmail = getSupportEmail()

  const itemsHtml = (order.items_json || [])
    .map((item: CartItem) => {
      const meta = renderItemMeta(item)
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight: 600; color: #1f2937;">${item.product_title}</div>
            ${meta.attributes ? `<div style="font-size: 14px; color: #6b7280; margin-top: 4px;">${meta.attributes}</div>` : ""}
            ${meta.sku ? `<div style="font-size: 14px; color: #6b7280;">SKU: ${meta.sku}</div>` : ""}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatPrice(item.price_cents * item.quantity)}</td>
        </tr>
      `
    })
    .join("")

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - HEMZ Pashmina</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f6f4;">
  <div style="background: white; border-radius: 12px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #c79a6a;">
      <h1 style="margin: 0; color: #c79a6a; font-size: 30px;">HEMZ</h1>
      <p style="margin: 6px 0 0; color: #6b7280; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Pashmina</p>
    </div>

    <h2 style="margin: 0 0 12px; font-size: 24px;">Your Order Is Confirmed</h2>
    <p style="margin: 0 0 20px; color: #4b5563;">Hi ${customerName}, thank you for shopping with HEMZ Pashmina. We have received your payment and your order is now being prepared with care.</p>

    <div style="background: #f8f6f4; border-left: 4px solid #c79a6a; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Order Number</div>
      <div style="font-size: 18px; font-weight: 700;">${order.order_number}</div>
    </div>

    <h3 style="margin: 0 0 16px; font-size: 18px;">Order Details</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background: #f9fafb;">
          <th style="padding: 12px; text-align: left;">Item</th>
          <th style="padding: 12px; text-align: center;">Qty</th>
          <th style="padding: 12px; text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>Subtotal</span><span>${formatPrice(order.subtotal_cents)}</span></div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>Shipping</span><span>${formatPrice(order.shipping_cents)}</span></div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>Tax</span><span>${formatPrice(order.tax_cents)}</span></div>
      ${order.discount_cents > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #15803d;"><span>Discount</span><span>-${formatPrice(order.discount_cents)}</span></div>` : ""}
      <div style="display: flex; justify-content: space-between; padding-top: 12px; margin-top: 12px; border-top: 1px solid #e5e7eb; font-weight: 700; font-size: 18px;"><span>Total</span><span style="color: #c79a6a;">${formatPrice(order.total_cents)}</span></div>
    </div>

    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px; font-size: 18px;">Shipping Address</h3>
      <div style="color: #4b5563;">
        ${order.shipping_address_json.first_name} ${order.shipping_address_json.last_name}<br>
        ${order.shipping_address_json.company ? `${order.shipping_address_json.company}<br>` : ""}
        ${order.shipping_address_json.address_line_1}<br>
        ${order.shipping_address_json.address_line_2 ? `${order.shipping_address_json.address_line_2}<br>` : ""}
        ${order.shipping_address_json.city}${order.shipping_address_json.state ? `, ${order.shipping_address_json.state}` : ""} ${order.shipping_address_json.postal_code}<br>
        ${order.shipping_address_json.country}
      </div>
    </div>

    <div style="background: #f8f6f4; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px; font-size: 18px;">What Happens Next</h3>
      <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
        <li style="margin-bottom: 8px;">We will review and process your order within 1-2 business days.</li>
        <li style="margin-bottom: 8px;">You will receive another email once your parcel ships.</li>
        <li>Reply to this email if you need any help with the order.</li>
      </ul>
    </div>

    <div style="text-align: center; color: #6b7280; font-size: 14px; padding-top: 18px; border-top: 1px solid #e5e7eb;">
      Questions about your order? <a href="mailto:${supportEmail}" style="color: #c79a6a; text-decoration: none;">${supportEmail}</a>
    </div>
  </div>
</body>
</html>
  `

  const text = `
HEMZ PASHMINA - ORDER CONFIRMATION

Hi ${customerName},

Thank you for your order. We have received your payment and your order is now being prepared.

Order Number: ${order.order_number}

ORDER DETAILS
${(order.items_json || [])
  .map((item: CartItem) => {
    const meta = renderItemMeta(item)
    return `- ${item.product_title}${meta.attributes ? ` (${meta.attributes})` : ""} x${item.quantity} - ${formatPrice(item.price_cents * item.quantity)}`
  })
  .join("\n")}

ORDER SUMMARY
Subtotal: ${formatPrice(order.subtotal_cents)}
Shipping: ${formatPrice(order.shipping_cents)}
Tax: ${formatPrice(order.tax_cents)}
${order.discount_cents > 0 ? `Discount: -${formatPrice(order.discount_cents)}\n` : ""}Total: ${formatPrice(order.total_cents)}

SHIPPING ADDRESS
${order.shipping_address_json.first_name} ${order.shipping_address_json.last_name}
${order.shipping_address_json.company ? `${order.shipping_address_json.company}\n` : ""}${order.shipping_address_json.address_line_1}
${order.shipping_address_json.address_line_2 ? `${order.shipping_address_json.address_line_2}\n` : ""}${order.shipping_address_json.city}${order.shipping_address_json.state ? `, ${order.shipping_address_json.state}` : ""} ${order.shipping_address_json.postal_code}
${order.shipping_address_json.country}

WHAT HAPPENS NEXT
- We will review and process your order within 1-2 business days
- You will receive another email once your parcel ships
- Reply to this email if you need any help with the order

Questions? Contact us at ${supportEmail}
  `

  return {
    subject: `Order Confirmation - ${order.order_number} - HEMZ Pashmina`,
    html,
    text,
  }
}

export function shippingConfirmationTemplate(order: any, trackingNumber: string): EmailTemplate {
  const supportEmail = getSupportEmail()
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #c79a6a;">HEMZ Pashmina</h1>
  <h2>Your Order Has Shipped</h2>
  <p>Your order <strong>${order.order_number}</strong> is on the way.</p>
  <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
  <p>If you need help, contact <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
</body>
</html>
  `

  const text = `
HEMZ PASHMINA - YOUR ORDER HAS SHIPPED

Order Number: ${order.order_number}
Tracking Number: ${trackingNumber}

If you need help, contact ${supportEmail}.
  `

  return {
    subject: `Your Order Has Shipped - ${order.order_number} - HEMZ Pashmina`,
    html,
    text,
  }
}

export function paymentFailedTemplate(order: any): EmailTemplate {
  const supportEmail = getSupportEmail()
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #c79a6a;">HEMZ Pashmina</h1>
  <h2>There Was a Problem With Your Payment</h2>
  <p>We could not complete payment for order <strong>${order.order_number}</strong>.</p>
  <p>Please try again or contact <a href="mailto:${supportEmail}">${supportEmail}</a> if you need help.</p>
</body>
</html>
  `

  const text = `
HEMZ PASHMINA - PAYMENT ISSUE

We could not complete payment for order ${order.order_number}.

Please try again or contact ${supportEmail} if you need help.
  `

  return {
    subject: `Payment Issue - Order ${order.order_number} - HEMZ Pashmina`,
    html,
    text,
  }
}
