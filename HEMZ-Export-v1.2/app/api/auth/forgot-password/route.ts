import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { sendPasswordResetEmail } from "@/lib/email/resend"

// Generate secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Hash token for storage (never store plain tokens)
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailLower)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    })

    if (!user) {
      // Don't reveal if email exists or not for security
      // But still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link.",
      })
    }

    // Check if account is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: "This account has been deactivated. Please contact support." },
        { status: 403 }
      )
    }

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { user_id: user.id },
    })

    // Generate new token and OTP
    const plainToken = generateToken()
    const otp = generateOTP()
    const hashedToken = hashToken(plainToken)

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    // Store the hashed token
    await prisma.passwordResetToken.create({
      data: {
        user_id: user.id,
        token: hashedToken,
        otp: otp,
        expires_at: expiresAt,
      },
    })

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(
      user.email,
      user.first_name || "there",
      otp
    )

    if (!emailResult.success) {
      console.error("[Forgot Password] Failed to send email:", emailResult.error)
      // Don't fail the request - log the OTP for manual recovery if needed
    }

    // Log for development/debugging
    console.log(`[Password Reset] OTP generated for ${emailLower}: ${otp}`)

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset code.",
      // ONLY FOR DEVELOPMENT - Remove these in production!
      ...(process.env.NODE_ENV === "development" && {
        dev_otp: otp,
        dev_token: plainToken,
      }),
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Failed to process request. Please try again later." },
      { status: 500 }
    )
  }
}
