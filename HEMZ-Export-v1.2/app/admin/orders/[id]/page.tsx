"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CreditCard, Loader2, Mail, Package, Phone, Truck, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"

type AdminOrder = {
  id: string
  order_number: string
  status: string
  display_status: string
  payment_status: string
  created_at: string
  total_cents: number
  subtotal_cents: number
  shipping_cents: number
  tax_cents: number
  currency: string
  payment_gateway?: string | null
  payment_intent_id?: string | null
  shipping_method?: string | null
  shipping_name: string
  shipping_address: string
  shipping_city: string
  shipping_state?: string | null
  shipping_postal: string
  shipping_country: string
  shipping_phone?: string | null
  billing_name: string
  billing_address: string
  billing_city: string
  billing_state?: string | null
  billing_postal: string
  billing_country: string
  billing_phone?: string | null
  tracking_number?: string | null
  notes?: string | null
  failure_reason?: string | null
  cancel_request_status?: string | null
  cancel_request_reason?: string | null
  cancel_request_details?: string | null
  user?: {
    first_name?: string | null
    last_name?: string | null
    email: string
    phone?: string | null
  } | null
  items: Array<{
    id: string
    product_title: string
    product_sku?: string | null
    quantity: number
    unit_price_cents: number
    variant_info?: Record<string, string> | null
  }>
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
]

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [orderStatus, setOrderStatus] = useState("pending")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [carrier, setCarrier] = useState("")
  const [notes, setNotes] = useState("")
  const [cancelDecision, setCancelDecision] = useState("unchanged")

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/orders/${encodeURIComponent(params.id)}`)
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to fetch order")
        }

        setOrder(result.order)
        setOrderStatus(result.order.status)
        setTrackingNumber(result.order.tracking_number || "")
        setCarrier(result.order.carrier || "")
        setNotes(result.order.notes || "")
      } catch (error) {
        toast({
          title: "Order unavailable",
          description: error instanceof Error ? error.message : "Failed to load order",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [params.id, toast])

  const handleUpdateOrder = async () => {
    if (!order) {
      return
    }

    try {
      setSaving(true)
      const payload: Record<string, string> = {
        status: orderStatus,
        tracking_number: trackingNumber,
        carrier,
        notes,
      }

      if (cancelDecision !== "unchanged") {
        payload.cancel_request_status = cancelDecision
      }

      const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update order")
      }

      setOrder(result.order)
      setOrderStatus(result.order.status)
      setCancelDecision("unchanged")
      toast({
        title: "Order updated",
        description: "The order details have been saved.",
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update order",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
        <p className="text-muted-foreground">Order not found.</p>
      </div>
    )
  }

  const customerName = `${order.user?.first_name || ""} ${order.user?.last_name || ""}`.trim() || order.shipping_name

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
          <div>
            <h1 className="font-serif text-3xl font-bold">Order {order.order_number}</h1>
            <p className="text-muted-foreground">
              Created on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{order.display_status.replaceAll("_", " ")}</Badge>
          <Badge variant="outline">{order.payment_status}</Badge>
          <Button onClick={handleUpdateOrder} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{item.product_title}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                      {item.product_sku ? ` • SKU: ${item.product_sku}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(item.unit_price_cents * item.quantity)}</p>
                    <p className="text-sm text-muted-foreground">{formatPrice(item.unit_price_cents)} each</p>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal_cents)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatPrice(order.shipping_cents)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatPrice(order.tax_cents)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(order.total_cents)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2 text-sm">
                <p className="font-medium">Contact Details</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{order.user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.user?.phone || order.shipping_phone || order.billing_phone || "Not provided"}</span>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium">Billing Address</p>
                  <p>{order.billing_name}</p>
                  <p>{order.billing_address}</p>
                  <p>
                    {order.billing_city}
                    {order.billing_state ? `, ${order.billing_state}` : ""} {order.billing_postal}
                  </p>
                  <p>{order.billing_country}</p>
                </div>
                <div>
                  <p className="font-medium">Shipping Address</p>
                  <p>{order.shipping_name}</p>
                  <p>{order.shipping_address}</p>
                  <p>
                    {order.shipping_city}
                    {order.shipping_state ? `, ${order.shipping_state}` : ""} {order.shipping_postal}
                  </p>
                  <p>{order.shipping_country}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={orderStatus} onValueChange={setOrderStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tracking">Tracking Number</Label>
                <Input
                  id="tracking"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                />
              </div>

              <div>
                <Label htmlFor="carrier">Carrier</Label>
                <Input
                  id="carrier"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="DHL, UPS, FedEx..."
                />
              </div>

              <div>
                <Label htmlFor="notes">Internal Notes</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes"
                />
              </div>

              {order.cancel_request_status === "pending" && (
                <div>
                  <Label htmlFor="cancel-review">Cancellation Review</Label>
                  <Select value={cancelDecision} onValueChange={setCancelDecision}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unchanged">No change</SelectItem>
                      <SelectItem value="approved">Approve request</SelectItem>
                      <SelectItem value="rejected">Reject request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Gateway</span>
                <span className="font-medium capitalize">{order.payment_gateway || "stripe"}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment ID</span>
                <span className="max-w-[160px] truncate font-mono">{order.payment_intent_id || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount</span>
                <span className="font-medium">{formatPrice(order.total_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Currency</span>
                <span className="font-medium">{order.currency}</span>
              </div>
              {order.failure_reason && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
                  {order.failure_reason}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Method</span>
                <span className="font-medium capitalize">{order.shipping_method || "standard"}</span>
              </div>
              <div className="flex justify-between">
                <span>Cost</span>
                <span className="font-medium">{formatPrice(order.shipping_cents)}</span>
              </div>
              {trackingNumber && (
                <div className="flex justify-between">
                  <span>Tracking</span>
                  <span className="font-mono">{trackingNumber}</span>
                </div>
              )}
              {order.cancel_request_status && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                  <p className="font-medium capitalize">
                    Cancellation request: {order.cancel_request_status}
                  </p>
                  {order.cancel_request_reason && (
                    <p className="text-muted-foreground">
                      Reason: {order.cancel_request_reason.replaceAll("_", " ")}
                    </p>
                  )}
                  {order.cancel_request_details && (
                    <p className="mt-1 text-muted-foreground">{order.cancel_request_details}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
