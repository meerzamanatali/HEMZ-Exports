"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  // For development mode - show OTP
  const [devOtp, setDevOtp] = useState<string | null>(null)

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setError("Email is required")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address")
      return false
    }
    setError("")
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail()) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
        
        // Store email in sessionStorage for the reset page
        sessionStorage.setItem("reset_email", email.trim().toLowerCase())
        
        // For development - store OTP
        if (data.dev_otp) {
          setDevOtp(data.dev_otp)
          sessionStorage.setItem("dev_otp", data.dev_otp)
          if (data.dev_token) {
            sessionStorage.setItem("dev_token", data.dev_token)
          }
        }

        toast({
          title: "Reset code sent!",
          description: "Check your email for the password reset code.",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send reset code. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinue = () => {
    router.push("/reset-password")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4 bg-gradient-to-b from-background to-muted/30">
        <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!isSubmitted ? (
            <>
              <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative h-16 w-16">
                    <Image
                      src="/hemz-pashmina-logo.png"
                      alt="HEMZ Pashmina"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <CardTitle className="text-2xl font-serif">Forgot Password?</CardTitle>
                <CardDescription>
                  Enter your email address and we&apos;ll send you a verification code to reset your password.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (error) setError("")
                        }}
                        className={`pl-10 ${error ? "border-destructive" : ""}`}
                        autoComplete="email"
                        disabled={isLoading}
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      "Send Reset Code"
                    )}
                  </Button>

                  <Link
                    href="/login"
                    className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Link>
                </CardFooter>
              </form>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-serif">Check Your Email</CardTitle>
                <CardDescription className="text-base">
                  We&apos;ve sent a verification code to:
                  <br />
                  <span className="font-medium text-foreground">{email}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                  <p className="mb-2">
                    <strong>Didn&apos;t receive the email?</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Check your spam or junk folder</li>
                    <li>Make sure you entered the correct email</li>
                    <li>Wait a few minutes and try again</li>
                  </ul>
                </div>

                {/* Development mode OTP display */}
                {devOtp && process.env.NODE_ENV === "development" && (
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      🔧 Development Mode Only
                    </p>
                    <p className="text-2xl font-mono font-bold text-yellow-900 dark:text-yellow-100 tracking-widest">
                      OTP: {devOtp}
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      This won&apos;t appear in production
                    </p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button
                  onClick={handleContinue}
                  className="w-full"
                  size="lg"
                >
                  Enter Verification Code
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSubmitted(false)
                    setDevOtp(null)
                  }}
                  className="w-full"
                >
                  Try a different email
                </Button>

                <Link
                  href="/login"
                  className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Link>
              </CardFooter>
            </>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  )
}
