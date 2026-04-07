import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { clearUserSession, getSessionUserId } from "@/lib/auth/session"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = getSessionUserId(cookieStore)

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      clearUserSession(cookieStore)
      
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      )
    }

    if (!user.is_active) {
      clearUserSession(cookieStore)
      
      return NextResponse.json(
        { error: "Account deactivated" },
        { status: 403 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json(
      { error: "Authentication check failed" },
      { status: 500 }
    )
  }
}
