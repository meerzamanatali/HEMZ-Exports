import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { setUserSession } from "@/lib/auth/session"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      // Email not found - suggest registration
      return NextResponse.json(
        { 
          error: "No account found with this email address. Please register first to create an account.",
          errorCode: "EMAIL_NOT_FOUND"
        },
        { status: 401 }
      )
    }

    // Check if account is active
    if (!user.is_active) {
      return NextResponse.json(
        { 
          error: "This account has been deactivated. Please contact support for assistance.",
          errorCode: "ACCOUNT_DEACTIVATED"
        },
        { status: 403 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          error: "Incorrect password. Please try again or use 'Forgot Password' to reset it.",
          errorCode: "WRONG_PASSWORD"
        },
        { status: 401 }
      )
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    })

    // Set signed session cookies
    const cookieStore = await cookies()
    setUserSession(cookieStore, user)

    // Return user data (excluding password)
    const userData = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      company: user.company,
      address: user.address,
      city: user.city,
      state: user.state,
      postal_code: user.postal_code,
      country: user.country,
      email_verified: user.email_verified,
      is_active: user.is_active,
      last_login: user.last_login,
      created_at: user.created_at,
    }

    return NextResponse.json({
      success: true,
      message: "Login successful!",
      user: userData,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Failed to login. Please try again later." },
      { status: 500 }
    )
  }
}
