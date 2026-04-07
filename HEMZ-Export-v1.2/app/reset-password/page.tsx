"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Loader2, Lock, ArrowLeft, CheckCircle2, Eye, EyeOff, Check, X, ShieldCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Step = "verify" | "reset" | "success"

export default function ResetPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = useState<Step>("verify")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [resetToken, setResetToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Password fields
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // OTP input refs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Password strength checks
  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
  }

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean)

  useEffect(() => {
    // Get email from sessionStorage
    const storedEmail = sessionStorage.getItem("reset_email")
    if (storedEmail) {
      setEmail(storedEmail)
    } else {
      // No email stored, redirect to forgot password
      router.push("/forgot-password")
    }

  }, [router])

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError("")

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pastedData.length === 6) {
      setOtp(pastedData.split(""))
      otpRefs.current[5]?.focus()
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    const otpString = otp.join("")
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-otp",
          email,
          otp: otpString,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResetToken(data.resetToken)
        setStep("reset")
        toast({
          title: "Code verified!",
          description: "Now you can set your new password.",
        })
      } else {
        setError(data.error || "Invalid code. Please try again.")
        toast({
          title: "Verification failed",
          description: data.error || "Invalid code. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords
    if (!isPasswordStrong) {
      setError("Password doesn't meet the requirements")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          token: resetToken,
          newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Clear session storage
        sessionStorage.removeItem("reset_email")
        sessionStorage.removeItem("dev_otp")
        sessionStorage.removeItem("dev_token")

        setStep("success")
        toast({
          title: "Password reset successful!",
          description: "You can now log in with your new password.",
        })
      } else {
        setError(data.error || "Failed to reset password. Please try again.")
        toast({
          title: "Reset failed",
          description: data.error || "Failed to reset password. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const PasswordCheck = ({ passed, label }: { passed: boolean; label: string }) => (
    <div className={`flex items-center gap-2 text-xs ${passed ? "text-green-600" : "text-muted-foreground"}`}>
      {passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      <span>{label}</span>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4 bg-gradient-to-b from-background to-muted/30">
        <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          {step === "verify" && (
            <>
              <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-serif">Enter Verification Code</CardTitle>
                <CardDescription>
                  We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleVerifyOtp}>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="sr-only">Verification Code</Label>
                    <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                      {otp.map((digit, index) => (
                        <Input
                          key={index}
                          ref={(el) => { otpRefs.current[index] = el }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className={`w-12 h-14 text-center text-2xl font-bold ${
                            error ? "border-destructive" : ""
                          }`}
                          disabled={isLoading}
                        />
                      ))}
                    </div>
                    {error && (
                      <p className="text-sm text-destructive text-center">{error}</p>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground text-center">
                    Didn&apos;t receive the code?{" "}
                    <Link href="/forgot-password" className="text-primary hover:underline">
                      Resend
                    </Link>
                  </p>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading || otp.join("").length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Code"
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
          )}

          {step === "reset" && (
            <>
              <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-serif">Set New Password</CardTitle>
                <CardDescription>
                  Create a strong password for your account
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleResetPassword}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value)
                          setError("")
                        }}
                        className="pl-10 pr-10"
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {newPassword && (
                      <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-muted/50 rounded-md">
                        <PasswordCheck passed={passwordChecks.length} label="At least 8 characters" />
                        <PasswordCheck passed={passwordChecks.uppercase} label="One uppercase letter" />
                        <PasswordCheck passed={passwordChecks.lowercase} label="One lowercase letter" />
                        <PasswordCheck passed={passwordChecks.number} label="One number" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value)
                          setError("")
                        }}
                        className="pl-10 pr-10"
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-sm text-destructive">Passwords don&apos;t match</p>
                    )}
                  </div>

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading || !isPasswordStrong || newPassword !== confirmPassword}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting password...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </>
          )}

          {step === "success" && (
            <>
              <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-serif">Password Reset Complete!</CardTitle>
                <CardDescription className="text-base">
                  Your password has been successfully reset. You can now log in with your new password.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✨ Your account is now secure with your new password
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full"
                  size="lg"
                >
                  Go to Login
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  )
}
