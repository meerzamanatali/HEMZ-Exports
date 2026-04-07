"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, Package, Mail, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { formatPrice } from "@/lib/utils"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`)
        const result = await response.json()
        if (response.ok && result.success) {
          setOrder(result.order)
        }
      } catch (error) {
        console.error("Failed to load order:", error)
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderId])

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-6 animate-in zoom-in duration-500" />
            <h1 className="font-serif text-4xl font-bold mb-4 animate-in slide-in-from-bottom duration-500 delay-100">
              Order Confirmed!
            </h1>
            <p className="text-lg text-muted-foreground animate-in slide-in-from-bottom duration-500 delay-200">
              Thank you for your purchase. Your order has been successfully placed.
            </p>
          </div>

          {order && (
            <Card className="mb-8 text-left animate-in slide-in-from-bottom duration-500 delay-250">
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Order Number</span>
                  <span className="font-medium">{order.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="font-medium capitalize">{order.display_status}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment</span>
                  <span className="font-medium capitalize">{order.payment_status}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="font-medium">{formatPrice(order.total_cents)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="text-left mb-8 animate-in slide-in-from-bottom duration-500 delay-300">
            <CardHeader>
              <CardTitle>What happens next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold">Order Confirmation</h3>
                  <p className="text-sm text-muted-foreground">
                    You'll receive an email confirmation with your order details shortly.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold">Processing & Shipping</h3>
                  <p className="text-sm text-muted-foreground">
                    Your order will be processed within 1-2 business days and shipped according to your selected method.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold">Tracking Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Once shipped, you'll receive tracking information to monitor your delivery.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4 animate-in slide-in-from-bottom duration-500 delay-400">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={order ? `/account?tab=orders` : "/products"}>
                {order ? "View My Orders" : "Continue Shopping"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>

            <div className="text-sm text-muted-foreground">
              <p>
                Need help?{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  Contact our support team
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
