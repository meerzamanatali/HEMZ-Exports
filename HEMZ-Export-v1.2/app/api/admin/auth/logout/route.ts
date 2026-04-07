import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("admin_session")

    return NextResponse.json({
      success: true,
      message: "Logout successful",
    })
  } catch (error) {
    console.error("[Admin Auth] Logout error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred during logout" },
      { status: 500 }
    )
  }
}
