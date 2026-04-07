"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Loader2, CheckCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function Footer() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [error, setError] = useState("")

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to subscribe")
        return
      }

      // Success - show dialog
      setSuccessMessage(data.message)
      setShowSuccessDialog(true)
      setEmail("") // Clear the input
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <footer className="bg-card border-t animate-in fade-in slide-in-from-bottom duration-800" role="contentinfo">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="animate-in slide-in-from-left duration-600 delay-100">
            <div className="flex items-center space-x-3 mb-4 group">
              <div className="relative h-10 w-10 transition-transform duration-300 group-hover:scale-110">
                <Image src="/hemz-pashmina-logo.png" alt="HEMZ Pashmina Logo" fill className="object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold transition-colors duration-300 group-hover:text-primary">
                  HEMZ
                </span>
                <span className="font-sans text-xs text-muted-foreground uppercase tracking-wider">Pashmina</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-4 transition-colors duration-300 hover:text-foreground">
              Premium cashmere and pashmina export house serving luxury markets worldwide with traditional
              craftsmanship.
            </p>
            <div className="flex space-x-2" role="list" aria-label="Social media links">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 px-0 transition-all duration-300 hover:scale-110 hover:bg-primary/10"
                asChild
              >
                <Link href="https://facebook.com/hemzpashmina" aria-label="Follow us on Facebook">
                  <Facebook className="h-4 w-4 transition-colors duration-300 hover:text-primary" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 px-0 transition-all duration-300 hover:scale-110 hover:bg-primary/10"
                asChild
              >
                <Link href="https://instagram.com/hemzpashmina" aria-label="Follow us on Instagram">
                  <Instagram className="h-4 w-4 transition-colors duration-300 hover:text-primary" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 px-0 transition-all duration-300 hover:scale-110 hover:bg-primary/10"
                asChild
              >
                <Link href="https://linkedin.com/company/hemzpashmina" aria-label="Connect with us on LinkedIn">
                  <Linkedin className="h-4 w-4 transition-colors duration-300 hover:text-primary" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="animate-in slide-in-from-bottom duration-600 delay-200">
            <h3 className="font-serif text-lg font-semibold mb-4 transition-colors duration-300 hover:text-primary">
              Quick Links
            </h3>
            <nav aria-label="Footer navigation">
              <ul className="space-y-2">
                {[
                  { href: "/products", label: "Products" },
                  { href: "/speciality", label: "Our Speciality" },
                  { href: "/about", label: "About Us" },
                  { href: "/contact", label: "Contact" },
                ].map((link, index) => (
                  <li
                    key={link.href}
                    className={`animate-in slide-in-from-left duration-400 delay-${300 + index * 100}`}
                  >
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-2 focus:text-primary focus:outline-none focus:underline relative group"
                    >
                      {link.label}
                      <span className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-primary scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="animate-in slide-in-from-bottom duration-600 delay-300">
            <h3 className="font-serif text-lg font-semibold mb-4 transition-colors duration-300 hover:text-primary">
              Contact Info
            </h3>
            <address className="space-y-3 not-italic">
              <div className="flex items-center space-x-2 text-sm group transition-all duration-300 hover:translate-x-1">
                <Mail
                  className="h-4 w-4 text-primary transition-transform duration-300 group-hover:scale-110"
                  aria-hidden="true"
                />
                <a
                  href="mailto:hemzexport@gmail.com"
                  className="text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  hemzexport@gmail.com
                </a>
              </div>
              <div className="flex items-center space-x-2 text-sm group transition-all duration-300 hover:translate-x-1">
                <Phone
                  className="h-4 w-4 text-primary transition-transform duration-300 group-hover:scale-110"
                  aria-hidden="true"
                />
                <a
                  href="tel:+911942501234"
                  className="text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  +91 194 2501234
                </a>
              </div>
              <div className="flex items-center space-x-2 text-sm group transition-all duration-300 hover:translate-x-1">
                <MapPin
                  className="h-4 w-4 text-primary transition-transform duration-300 group-hover:scale-110"
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">Srinagar, Kashmir, India</span>
              </div>
            </address>
          </div>

          <div className="animate-in slide-in-from-right duration-600 delay-400">
            <h3 className="font-serif text-lg font-semibold mb-4 transition-colors duration-300 hover:text-primary">
              Newsletter
            </h3>
            <p className="text-muted-foreground text-sm mb-4 transition-colors duration-300 hover:text-foreground">
              Subscribe for export updates and new collections
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2" aria-label="Newsletter signup">
              <div className="flex space-x-2 group">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <Input
                  id="newsletter-email"
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError("") // Clear error when user types
                  }}
                  className="flex-1 transition-all duration-300 focus:scale-105 focus:shadow-lg"
                  required
                  disabled={isLoading}
                  aria-describedby="newsletter-description"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="transition-all duration-300 hover:scale-105 hover:shadow-lg group-hover:bg-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </div>
              {error && (
                <p className="text-sm text-destructive animate-in fade-in duration-200">{error}</p>
              )}
            </form>
            <p id="newsletter-description" className="sr-only">
              Subscribe to receive updates about new products and export opportunities
            </p>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center animate-in fade-in duration-800 delay-600">
          <p className="text-muted-foreground text-sm transition-colors duration-300 hover:text-foreground">
            © 2024 HEMZ Pashmina Export Co. All rights reserved. | ISO 9001:2015 Certified
          </p>
        </div>
      </div>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Successfully Subscribed! 🎉
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {successMessage || "Thank you for subscribing to our newsletter!"}
              <br /><br />
              <span className="font-medium text-foreground">
                We're excited to have you with us!
              </span>
              <br />
              You'll be the first to know about our new collections, exclusive offers, and export updates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center sm:justify-center">
            <AlertDialogAction className="min-w-[120px]">
              Got it, thanks!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </footer>
  )
}
