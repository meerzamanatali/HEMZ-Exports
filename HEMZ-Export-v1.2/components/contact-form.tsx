"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Send } from "lucide-react"
import productsData from "@/data/products.json"

interface ContactFormProps {
  preselectedProduct?: string
}

export function ContactForm({ preselectedProduct }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    fullName: "",
    company: "",
    country: "",
    email: "",
    phone: "",
    productInterest: preselectedProduct || "",
    quantity: "",
    preferredDelivery: "",
    message: "",
    honeypot: "", // Spam protection
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Honeypot spam protection
    if (formData.honeypot) {
      return
    }

    setIsSubmitting(true)

    try {
      // Option 1: Using Formspree (replace with your actual endpoint)
      const response = await fetch("https://formspree.io/f/xovpjewk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          company: formData.company,
          country: formData.country,
          email: formData.email,
          phone: formData.phone,
          productInterest: formData.productInterest,
          quantity: formData.quantity,
          preferredDelivery: formData.preferredDelivery,
          message: formData.message,
        }),
      })

      if (response.ok) {
        // Persist the submission to the local admin quotes store (best-effort)
        try {
          await fetch("/api/admin/quotes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName: formData.fullName,
              company: formData.company,
              country: formData.country,
              email: formData.email,
              phone: formData.phone,
              productInterest: formData.productInterest,
              quantity: formData.quantity,
              preferredDelivery: formData.preferredDelivery,
              message: formData.message,
              source: "formspree",
            }),
          })
        } catch (err) {
          // Ignore save errors; admin email via Formspree still delivered
          console.warn("Failed to persist quote to admin store", err)
        }

        toast({
          title: "Message Sent Successfully!",
          description: "We'll get back to you within 24 hours with a detailed quote.",
        })
        // Reset form
        setFormData({
          fullName: "",
          company: "",
          country: "",
          email: "",
          phone: "",
          productInterest: "",
          quantity: "",
          preferredDelivery: "",
          message: "",
          honeypot: "",
        })
      } else {
        throw new Error("Failed to send message")
      }
    } catch (error) {
      toast({
        title: "Error Sending Message",
        description: "Please try again or contact us directly at hemzexport@gmail.com",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-serif text-2xl text-center">Request a Quote</CardTitle>
        <p className="text-muted-foreground text-center">
          Fill out the form below and we'll send you a detailed quote within 24 hours
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Honeypot field for spam protection */}
          <input
            type="text"
            name="honeypot"
            value={formData.honeypot}
            onChange={(e) => handleInputChange("honeypot", e.target.value)}
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                required
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">
                Company <span className="text-destructive">*</span>
              </Label>
              <Input
                id="company"
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                required
                placeholder="Your company name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">
                Country <span className="text-destructive">*</span>
              </Label>
              <Input
                id="country"
                type="text"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                required
                placeholder="Your country"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productInterest">Product of Interest</Label>
              <Select
                value={formData.productInterest}
                onValueChange={(value) => handleInputChange("productInterest", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Inquiry</SelectItem>
                  {productsData.products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Estimated Quantity</Label>
              <Input
                id="quantity"
                type="text"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                placeholder="e.g., 100 pieces"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredDelivery">Preferred Delivery Month</Label>
            <Input
              id="preferredDelivery"
              type="text"
              value={formData.preferredDelivery}
              onChange={(e) => handleInputChange("preferredDelivery", e.target.value)}
              placeholder="e.g., March 2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              required
              placeholder="Please provide details about your requirements, target market, any specific customizations needed, etc."
              rows={5}
            />
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Message...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Quote Request
                </>
              )}
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              By submitting this form, you agree to our privacy policy. We'll only use your information to provide you
              with a quote and relevant product updates.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
