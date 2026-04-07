import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { clearUserSession, getSessionUserId } from "@/lib/auth/session"

export async function requireUser() {
  const cookieStore = await cookies()
  const userId = getSessionUserId(cookieStore)

  if (!userId) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 }),
    }
  }

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
      created_at: true,
      updated_at: true,
    },
  })

  if (!user || !user.is_active) {
    clearUserSession(cookieStore)
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    }
  }

  return {
    ok: true as const,
    user,
  }
}
