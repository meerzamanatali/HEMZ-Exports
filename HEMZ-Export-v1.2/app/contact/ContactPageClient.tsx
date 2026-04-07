"use client"

import { Suspense } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContactForm } from "@/components/contact-form"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Phone, MapPin, Clock, Globe, Award } from "lucide-react"

function ContactFormWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactFormWithParams />
    </Suspense>
  )
}

function ContactFormWithParams() {
  // In a real app, you'd use useSearchParams() here
  // For now, we'll pass undefined since we can't use hooks in server components
  return <ContactForm />
}

export default function ContactPageClient() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">Contact Our Export Team</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ready to place an order or have questions about our premium textiles? Our export specialists are here to
            help you find the perfect products for your market.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h2 className="font-serif text-xl font-semibold mb-4">Get in Touch</h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground text-sm">export@luxurytextiles.com</p>
                      <p className="text-muted-foreground text-sm">hemzexport@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-muted-foreground text-sm">+91 194 2501234</p>
                      <p className="text-muted-foreground text-sm">+91 194 2501235 (WhatsApp)</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-muted-foreground text-sm">
                        Export House, Lal Chowk
                        <br />
                        Srinagar, Kashmir 190001
                        <br />
                        India
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Business Hours</p>
                      <p className="text-muted-foreground text-sm">
                        Monday - Saturday: 9:00 AM - 6:00 PM IST
                        <br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-serif text-lg font-semibold mb-4">Why Choose Us</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <span className="text-sm">Serving 25+ countries worldwide</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="text-sm">ISO 9001:2015 Certified</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm">24-hour quote response time</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <ContactFormWrapper />
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-serif text-lg font-semibold mb-2">Quick Response</h3>
              <p className="text-muted-foreground text-sm">
                We respond to all inquiries within 24 hours with detailed quotes and product information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Globe className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-serif text-lg font-semibold mb-2">Global Shipping</h3>
              <p className="text-muted-foreground text-sm">
                Reliable worldwide shipping with full export documentation and customs support.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Award className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-serif text-lg font-semibold mb-2">Quality Assured</h3>
              <p className="text-muted-foreground text-sm">
                Every product undergoes strict quality control before shipping to ensure premium standards.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
