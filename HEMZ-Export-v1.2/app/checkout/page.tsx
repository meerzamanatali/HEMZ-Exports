"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { ArrowLeft, CreditCard, Lock, Shield, Truck } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useCart } from "@/lib/contexts/cart-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PaymentForm } from "@/components/checkout/payment-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { calculateTax, formatPrice } from "@/lib/utils"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

type Address = {
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

type InitializedOrder = {
  order_id: string
  order_number: string
  client_secret: string
  totals: {
    subtotal_cents: number
    shipping_cents: number
    tax_cents: number
    discount_cents: number
    total_cents: number
  }
}

const countries = [
  { code: "US", name: "United States" },
  { code: "IN", name: "India" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
]

const shippingMethods = [
  { id: "standard", name: "Standard International", description: "7-14 business days", price: 1500 },
  { id: "express", name: "Express International", description: "3-7 business days", price: 3500 },
  { id: "premium", name: "Premium White Glove", description: "2-5 business days with insurance", price: 7500 },
]

const emptyAddress = (): Address => ({
  first_name: "",
  last_name: "",
  company: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "US",
  phone: "",
  email: "",
})

export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { items, getTotalItems, getTotalPrice, clearCart } = useCart()

  const [billingAddress, setBillingAddress] = useState<Address>(emptyAddress())
  const [shippingAddress, setShippingAddress] = useState<Address>(emptyAddress())
  const [sameAsBilling, setSameAsBilling] = useState(true)
  const [selectedShipping, setSelectedShipping] = useState("standard")
  const [couponCode, setCouponCode] = useState("")
  const [discount, setDiscount] = useState(0)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [initializedOrder, setInitializedOrder] = useState<InitializedOrder | null>(null)

  const subtotal = getTotalPrice()
  const totalItems = getTotalItems()
  const shippingCost = shippingMethods.find((method) => method.id === selectedShipping)?.price || 1500
  const taxCost = calculateTax(subtotal, billingAddress.country, billingAddress.state)
  const estimatedTotal = subtotal + shippingCost + taxCost - discount

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!isAuthenticated) {
      router.replace("/login?redirect=/checkout")
      return
    }

    if (items.length === 0) {
      router.replace("/cart")
    }
  }, [authLoading, isAuthenticated, items.length, router])

  useEffect(() => {
    if (!user) {
      return
    }

    const prefilledAddress: Address = {
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      company: user.company || "",
      address_line_1: user.address || "",
      address_line_2: "",
      city: user.city || "",
      state: user.state || "",
      postal_code: user.postal_code || "",
      country: user.country || "US",
      phone: user.phone || "",
      email: user.email || "",
    }

    setBillingAddress((prev) => ({
      ...prefilledAddress,
      ...prev,
      email: prev.email || prefilledAddress.email,
      first_name: prev.first_name || prefilledAddress.first_name,
      last_name: prev.last_name || prefilledAddress.last_name,
      address_line_1: prev.address_line_1 || prefilledAddress.address_line_1,
      city: prev.city || prefilledAddress.city,
      state: prev.state || prefilledAddress.state,
      postal_code: prev.postal_code || prefilledAddress.postal_code,
      country: prev.country || prefilledAddress.country,
      phone: prev.phone || prefilledAddress.phone,
      company: prev.company || prefilledAddress.company,
    }))

    setShippingAddress((prev) => ({
      ...prefilledAddress,
      ...prev,
      email: prev.email || prefilledAddress.email,
      first_name: prev.first_name || prefilledAddress.first_name,
      last_name: prev.last_name || prefilledAddress.last_name,
      address_line_1: prev.address_line_1 || prefilledAddress.address_line_1,
      city: prev.city || prefilledAddress.city,
      state: prev.state || prefilledAddress.state,
      postal_code: prev.postal_code || prefilledAddress.postal_code,
      country: prev.country || prefilledAddress.country,
      phone: prev.phone || prefilledAddress.phone,
      company: prev.company || prefilledAddress.company,
    }))
  }, [user])

  useEffect(() => {
    if (sameAsBilling) {
      setShippingAddress(billingAddress)
    }
  }, [billingAddress, sameAsBilling])

  const invalidateInitializedOrder = () => {
    if (initializedOrder) {
      setInitializedOrder(null)
    }
  }

  const handleAddressChange = (type: "billing" | "shipping", field: keyof Address, value: string) => {
    invalidateInitializedOrder()
    if (type === "billing") {
      setBillingAddress((prev) => ({ ...prev, [field]: value }))
      return
    }

    setShippingAddress((prev) => ({ ...prev, [field]: value }))
  }

  const handleShippingMethodChange = (value: string) => {
    invalidateInitializedOrder()
    setSelectedShipping(value)
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setDiscount(0)
      return
    }

    try {
      setIsApplyingCoupon(true)
      invalidateInitializedOrder()

      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          order_total: subtotal,
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Invalid coupon")
      }

      setDiscount(result.data.discount_amount || 0)
      toast({
        title: "Coupon applied",
        description: `You saved ${formatPrice(result.data.discount_amount || 0)}`,
      })
    } catch (error) {
      setDiscount(0)
      toast({
        title: "Coupon invalid",
        description: error instanceof Error ? error.message : "Failed to apply coupon",
        variant: "destructive",
      })
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const initializeCheckout = async () => {
    try {
      setIsProcessing(true)
      const response = await fetch("/api/checkout/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billing_address: billingAddress,
          shipping_address: sameAsBilling ? billingAddress : shippingAddress,
          items,
          shipping_method: selectedShipping,
          coupon_code: couponCode,
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to initialize checkout")
      }

      setInitializedOrder({
        order_id: result.data.order_id,
        order_number: result.data.order_number,
        client_secret: result.data.client_secret,
        totals: result.data.totals,
      })
    } catch (error) {
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Failed to initialize payment",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (authLoading || !isAuthenticated || items.length === 0) {
    return null
  }

  const displayTotals = initializedOrder?.totals || {
    subtotal_cents: subtotal,
    shipping_cents: shippingCost,
    tax_cents: taxCost,
    discount_cents: discount,
    total_cents: estimatedTotal,
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="font-serif text-3xl font-bold">Checkout</h1>
            <Button variant="outline" asChild>
              <Link href="/cart">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Cart
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AddressFields prefix="billing" address={billingAddress} onChange={(field, value) => handleAddressChange("billing", field, value)} countries={countries} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="same-as-billing"
                      checked={sameAsBilling}
                      onCheckedChange={(checked) => {
                        invalidateInitializedOrder()
                        setSameAsBilling(checked as boolean)
                      }}
                    />
                    <Label htmlFor="same-as-billing">Same as billing address</Label>
                  </div>

                  {!sameAsBilling && (
                    <AddressFields prefix="shipping" address={shippingAddress} onChange={(field, value) => handleAddressChange("shipping", field, value)} countries={countries} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shipping Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {shippingMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      className={`w-full rounded-lg border p-4 text-left transition-all ${
                        selectedShipping === method.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleShippingMethodChange(method.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{method.name}</h4>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>
                        <p className="font-semibold">{formatPrice(method.price)}</p>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.variant_id} className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{item.product_title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {Object.entries(item.variant_attributes)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(" | ")}
                          </p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">{formatPrice(item.price_cents * item.quantity)}</p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => {
                          invalidateInitializedOrder()
                          setCouponCode(e.target.value.toUpperCase())
                        }}
                      />
                      <Button variant="outline" onClick={applyCoupon} disabled={isApplyingCoupon}>
                        {isApplyingCoupon ? "Applying..." : "Apply"}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal ({totalItems} items)</span>
                      <span>{formatPrice(displayTotals.subtotal_cents)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{formatPrice(displayTotals.shipping_cents)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{formatPrice(displayTotals.tax_cents)}</span>
                    </div>
                    {displayTotals.discount_cents > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{formatPrice(displayTotals.discount_cents)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="font-serif">{formatPrice(displayTotals.total_cents)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {initializedOrder ? (
                    <Elements stripe={stripePromise} options={{ clientSecret: initializedOrder.client_secret }}>
                      <PaymentForm
                        clientSecret={initializedOrder.client_secret}
                        orderId={initializedOrder.order_id}
                        onSuccess={(orderId) => {
                          clearCart()
                          router.push(`/checkout/success?order_id=${encodeURIComponent(orderId)}`)
                        }}
                      />
                    </Elements>
                  ) : (
                    <Button onClick={initializeCheckout} disabled={isProcessing} className="w-full" size="lg">
                      <Lock className="mr-2 h-4 w-4" />
                      {isProcessing ? "Preparing payment..." : "Continue to Payment"}
                    </Button>
                  )}

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    <span>Secured by SSL encryption</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function AddressFields({
  prefix,
  address,
  onChange,
  countries,
}: {
  prefix: string
  address: Address
  onChange: (field: keyof Address, value: string) => void
  countries: Array<{ code: string; name: string }>
}) {
  return (
    <>
      <div>
        <Label htmlFor={`${prefix}-email`}>Email *</Label>
        <Input
          id={`${prefix}-email`}
          type="email"
          value={address.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}-first-name`}>First Name *</Label>
          <Input
            id={`${prefix}-first-name`}
            value={address.first_name}
            onChange={(e) => onChange("first_name", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-last-name`}>Last Name *</Label>
          <Input
            id={`${prefix}-last-name`}
            value={address.last_name}
            onChange={(e) => onChange("last_name", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor={`${prefix}-company`}>Company</Label>
        <Input
          id={`${prefix}-company`}
          value={address.company}
          onChange={(e) => onChange("company", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor={`${prefix}-address-1`}>Address Line 1 *</Label>
        <Input
          id={`${prefix}-address-1`}
          value={address.address_line_1}
          onChange={(e) => onChange("address_line_1", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor={`${prefix}-address-2`}>Address Line 2</Label>
        <Input
          id={`${prefix}-address-2`}
          value={address.address_line_2}
          onChange={(e) => onChange("address_line_2", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}-city`}>City *</Label>
          <Input
            id={`${prefix}-city`}
            value={address.city}
            onChange={(e) => onChange("city", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-state`}>State/Province</Label>
          <Input
            id={`${prefix}-state`}
            value={address.state}
            onChange={(e) => onChange("state", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}-postal`}>Postal Code *</Label>
          <Input
            id={`${prefix}-postal`}
            value={address.postal_code}
            onChange={(e) => onChange("postal_code", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-country`}>Country *</Label>
          <Select value={address.country} onValueChange={(value) => onChange("country", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor={`${prefix}-phone`}>Phone</Label>
        <Input
          id={`${prefix}-phone`}
          type="tel"
          value={address.phone}
          onChange={(e) => onChange("phone", e.target.value)}
        />
      </div>
    </>
  )
}
