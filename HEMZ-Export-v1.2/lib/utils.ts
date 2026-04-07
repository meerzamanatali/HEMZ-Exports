import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(cents: number, currency = "USD"): string {
  const amount = cents / 100
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `HEMZ-${timestamp}-${random}`.toUpperCase()
}

export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

export function calculateShipping(weightGrams: number, country = "US"): number {
  // Basic shipping calculation - can be enhanced with real shipping APIs
  const baseRate = 1500 // $15.00 in cents
  const perKgRate = 800 // $8.00 per kg in cents
  const weightKg = weightGrams / 1000

  return baseRate + Math.ceil(weightKg * perKgRate)
}

export function calculateTax(subtotalCents: number, country = "US", state?: string): number {
  // Basic tax calculation - can be enhanced with real tax APIs
  const taxRates: Record<string, number> = {
    US: 0.0875, // 8.75%
    IN: 0.18, // 18% GST
    GB: 0.2, // 20% VAT
    DE: 0.19, // 19% VAT
    CA: 0.13, // 13% HST average
  }

  const rate = taxRates[country] || 0
  return Math.round(subtotalCents * rate)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Safely parse JSON from a fetch response
 * Returns parsed data or null if parsing fails (e.g., server returned HTML)
 */
export async function safeJsonParse<T = any>(response: Response): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("[safeJsonParse] Server returned non-JSON response:", contentType)
      return { success: false, error: "Server returned an unexpected response" }
    }
    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error("[safeJsonParse] Failed to parse JSON:", error)
    return { success: false, error: "Failed to parse server response" }
  }
}
