import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Get admin credentials from environment
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      console.error("[Admin Auth] Admin credentials not configured in environment")
      return NextResponse.json(
        { success: false, error: "Admin authentication not configured" },
        { status: 500 }
      )
    }

    // Verify email
    if (email.toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Verify password (direct comparison - env vars are server-side only)
    if (password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Create admin session token (simple but secure for single admin)
    const sessionToken = Buffer.from(
      JSON.stringify({
        email: adminEmail,
        role: "admin",
        timestamp: Date.now(),
      })
    ).toString("base64")

    // Set HTTP-only cookie (can't be accessed by JavaScript)
    const cookieStore = await cookies()
    cookieStore.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return NextResponse.json({
      success: true,
      message: "Login successful",
    })
  } catch (error) {
    console.error("[Admin Auth] Login error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred during login" },
      { status: 500 }
    )
  }
}
