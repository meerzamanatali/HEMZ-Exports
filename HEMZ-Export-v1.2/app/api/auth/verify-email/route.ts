import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { sendWelcomeEmail } from "@/lib/email/resend"
import { setUserSession } from "@/lib/auth/session"

// Type assertion for Prisma client to access newly generated models
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp } = body

    // Validation
    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()

    // Find the verification token
    const verificationToken = await db.emailVerificationToken.findFirst({
      where: {
        email: emailLower,
        otp: otp,
        verified_at: null,
        expires_at: {
          gt: new Date(),
        },
      },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired verification code. Please request a new one." },
        { status: 400 }
      )
    }

    // Check again if user was created in the meantime
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    })

    if (existingUser) {
      // Clean up verification token
      await db.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      })
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      )
    }

    // Create the user account
    const user = await prisma.user.create({
      data: {
        email: emailLower,
        password_hash: verificationToken.password_hash,
        first_name: verificationToken.first_name,
        last_name: verificationToken.last_name,
        phone: verificationToken.phone,
        company: verificationToken.company,
        email_verified: true, // Email is now verified!
        last_login: new Date(),
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        company: true,
        address: true,
        city: true,
        state: true,
        postal_code: true,
        country: true,
        email_verified: true,
        is_active: true,
        last_login: true,
        created_at: true,
      },
    })

    // Mark verification token as used
    await db.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { verified_at: new Date() },
    })

    // Clean up all verification tokens for this email
    await db.emailVerificationToken.deleteMany({
      where: { email: emailLower },
    })

    // Set signed session cookies
    const cookieStore = await cookies()
    setUserSession(cookieStore, user)

    // Send welcome email (don't fail registration if email fails)
    try {
      await sendWelcomeEmail(user.email, user.first_name || "there")
    } catch (emailError) {
      console.error("[Registration] Failed to send welcome email:", emailError)
    }

    return NextResponse.json({
      success: true,
      message: "Email verified! Account created successfully.",
      user,
    })
  } catch (error) {
    console.error("Verify email error:", error)
    return NextResponse.json(
      { error: "Failed to verify email. Please try again later." },
      { status: 500 }
    )
  }
}
