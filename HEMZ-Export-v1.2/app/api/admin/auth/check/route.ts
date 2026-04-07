import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("admin_session")

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 401 }
      )
    }

    // Verify session token
    try {
      const sessionData = JSON.parse(
        Buffer.from(sessionCookie.value, "base64").toString()
      )

      // Verify session is valid admin session
      if (sessionData.role !== "admin" || !sessionData.email) {
        return NextResponse.json(
          { success: false, authenticated: false },
          { status: 401 }
        )
      }

      // Check if session is expired (24 hours)
      const sessionAge = Date.now() - sessionData.timestamp
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
      if (sessionAge > maxAge) {
        // Clear expired session
        cookieStore.delete("admin_session")
        return NextResponse.json(
          { success: false, authenticated: false, error: "Session expired" },
          { status: 401 }
        )
      }

      return NextResponse.json({
        success: true,
        authenticated: true,
        email: sessionData.email,
      })
    } catch {
      // Invalid session token
      cookieStore.delete("admin_session")
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("[Admin Auth] Check error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred" },
      { status: 500 }
    )
  }
}
