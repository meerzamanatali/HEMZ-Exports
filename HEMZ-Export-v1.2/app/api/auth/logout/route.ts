import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { clearUserSession } from "@/lib/auth/session"

export async function POST() {
  try {
    const cookieStore = await cookies()
    
    clearUserSession(cookieStore)

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    )
  }
}
