import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { sendEmailVerificationOTP } from "@/lib/email/resend"

// Type assertion for Prisma client to access newly generated models
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, first_name, last_name, phone, company } = body

    // Validation
    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { error: "Email, password, first name, and last name are required" },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      )
    }

    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return NextResponse.json(
        { error: "Password must contain at least one uppercase letter, one lowercase letter, and one number" },
        { status: 400 }
      )
    }

    // Check if email already exists as a registered user
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please login instead." },
        { status: 409 }
      )
    }

    // Delete any existing verification tokens for this email
    await db.emailVerificationToken.deleteMany({
      where: { email: emailLower },
    })

    // Generate OTP
    const otp = generateOTP()

    // Hash password before storing
    const salt = await bcrypt.genSalt(12)
    const password_hash = await bcrypt.hash(password, salt)

    // Token expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    // Store verification token with registration data
    await db.emailVerificationToken.create({
      data: {
        email: emailLower,
        otp,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        password_hash,
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        expires_at: expiresAt,
      },
    })

    // Send verification email
    const emailResult = await sendEmailVerificationOTP(
      emailLower,
      first_name.trim(),
      otp
    )

    if (!emailResult.success) {
      console.error("[Registration] Failed to send verification email:", emailResult.error)
      // Still return success in development mode with the OTP for testing
      // In production, this would fail properly
      if (process.env.NODE_ENV === "development") {
        console.log(`[Registration] DEV MODE: OTP for ${emailLower} is ${otp}`)
        return NextResponse.json({
          success: true,
          message: "Verification code generated. Check the console for the OTP (development mode).",
          email: emailLower,
          dev_otp: otp,
          email_error: emailResult.error, // Include the error for debugging
        })
      }
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      )
    }

    console.log(`[Registration] Verification OTP sent to ${emailLower}: ${otp}`)

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email. Please check your inbox.",
      email: emailLower,
      // ONLY FOR DEVELOPMENT
      ...(process.env.NODE_ENV === "development" && {
        dev_otp: otp,
      }),
    })
  } catch (error) {
    console.error("Send verification error:", error)
    return NextResponse.json(
      { error: "Failed to process registration. Please try again later." },
      { status: 500 }
    )
  }
}
