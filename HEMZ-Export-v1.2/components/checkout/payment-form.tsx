"use client"

import type React from "react"

import { useState } from "react"
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CreditCard } from "lucide-react"

interface PaymentFormProps {
  clientSecret: string
  orderId: string
  onSuccess: (orderId: string) => void
}

export function PaymentForm({ clientSecret, orderId, onSuccess }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?order_id=${encodeURIComponent(orderId)}`,
        },
        redirect: "if_required",
      })

      if (error) {
        toast({
          title: "Payment failed",
          description: error.message,
          variant: "destructive",
        })
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        toast({
          title: "Payment successful!",
          description: "Your order has been confirmed.",
        })
        onSuccess(orderId)
      }
    } catch (error) {
      toast({
        title: "Payment error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: "tabs",
          paymentMethodOrder: ["card", "apple_pay", "google_pay"],
        }}
      />

      <Button type="submit" disabled={!stripe || isProcessing} className="w-full" size="lg">
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Complete Order
          </>
        )}
      </Button>

      <div className="text-xs text-muted-foreground text-center">
        <p>Your payment information is secure and encrypted.</p>
        <p>By completing this order, you agree to our Terms of Service.</p>
      </div>
    </form>
  )
}
