// TypeScript types for HEMZ Pashmina e-commerce system

export interface Product {
  id: string
  title: string
  slug?: string
  description?: string
  base_price_cents: number
  currency: string
  weight_grams: number
  material?: string
  care_instructions?: string
  moq: number
  lead_time_days: number
  status: "active" | "inactive" | "discontinued"
  variants: ProductVariant[]
  images: ProductImage[]
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  sku: string
  attributes_json: Record<string, any> // {color: "ivory", size: "70x200cm"}
  price_cents?: number // null means use base_price from product
  stock_quantity: number
  reserved_quantity: number
  available_quantity: number
  weight_grams?: number
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  variant_id?: string
  url: string
  alt_text?: string
  sort_order: number
  created_at: string
}

export interface CartItem {
  variant_id: string
  quantity: number
  price_cents: number // Price at time of adding to cart
  product_title: string
  product_image?: string
  variant_sku: string
  variant_attributes: Record<string, any>
}

export interface Cart {
  id: string
  user_id?: string
  session_id: string
  items_json: CartItem[]
  expires_at: string
  created_at: string
  updated_at: string
}

export interface Address {
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

export interface Order {
  id: string
  order_number: string
  user_id?: string
  subtotal_cents: number
  shipping_cents: number
  tax_cents: number
  discount_cents: number
  total_cents: number
  currency: string
  status: OrderStatus
  display_status?: OrderStatus | "failed" | "cancel_requested"
  payment_gateway?: string
  payment_intent_id?: string
  payment_status: PaymentStatus
  coupon_code?: string
  billing_name: string
  billing_address: string
  billing_city: string
  billing_state?: string
  billing_postal: string
  billing_country: string
  billing_phone?: string
  shipping_name: string
  shipping_address: string
  shipping_city: string
  shipping_state?: string
  shipping_postal: string
  shipping_country: string
  shipping_phone?: string
  shipping_method?: string
  tracking_number?: string
  carrier?: string
  notes?: string
  failure_reason?: string
  cancel_request_reason?: string
  cancel_request_details?: string
  cancel_request_status?: "pending" | "approved" | "rejected" | null
  created_at: string
  updated_at: string
  items: UserOrderItemSnapshot[]
}

export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"

export interface UserOrderItemSnapshot {
  id: string
  product_id: string
  product_title: string
  product_sku?: string
  variant_info?: Record<string, any> | null
  quantity: number
  unit_price_cents: number
  created_at?: string
}

export interface Payment {
  id: string
  order_id: string
  gateway: "stripe"
  gateway_payment_id: string
  amount_cents: number
  currency: string
  status: PaymentStatus
  raw_response_json?: Record<string, any>
  created_at: string
  updated_at: string
}

export type PaymentStatus = "pending" | "succeeded" | "failed" | "cancelled" | "refunded"

export interface Coupon {
  id: string
  code: string
  discount_type: "percent" | "fixed"
  discount_value: number
  min_order_cents: number
  max_discount_cents?: number
  max_uses?: number
  times_used: number
  is_active: boolean
  valid_from?: string
  valid_until?: string
  created_at: string
  updated_at?: string
}

export interface ShippingRate {
  id: number
  name: string
  description?: string
  rate_type: "flat" | "weight_based" | "free"
  base_rate_cents: number
  per_kg_cents: number
  free_shipping_threshold_cents?: number
  countries_json: string[]
  active: boolean
  created_at: string
}

export interface TaxRate {
  id: number
  name: string
  rate_percentage: number
  country_code?: string
  state_code?: string
  tax_type: string
  active: boolean
  created_at: string
}

export interface Quote {
  id: string
  quote_number: string
  customer_name: string
  customer_email: string
  customer_company?: string
  customer_country?: string
  items_json: CartItem[]
  total_estimated_cents?: number
  currency: string
  status: "pending" | "approved" | "converted" | "expired"
  order_id?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Checkout types
export interface CheckoutSession {
  cart_id: string
  billing_address: Address
  shipping_address: Address
  shipping_method_id: string
  coupon_code?: string
  payment_method: "stripe"
  subtotal_cents: number
  shipping_cents: number
  tax_cents: number
  discount_cents: number
  total_cents: number
}

export interface PaymentIntent {
  client_secret: string
  payment_intent_id: string
  order_id?: string
  order_number?: string
  amount_cents: number
  currency: string
}
