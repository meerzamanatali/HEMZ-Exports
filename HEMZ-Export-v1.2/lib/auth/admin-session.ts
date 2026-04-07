import { cookies } from "next/headers"
import { NextResponse } from "next/server"

interface AdminSessionPayload {
  email: string
  role: string
  timestamp: number
}

const ADMIN_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000

function parseAdminSession(value?: string | null): AdminSessionPayload | null {
  if (!value) {
    return null
  }

  try {
    const sessionData = JSON.parse(Buffer.from(value, "base64").toString()) as AdminSessionPayload
    if (sessionData.role !== "admin" || !sessionData.email) {
      return null
    }

    if (Date.now() - sessionData.timestamp > ADMIN_SESSION_MAX_AGE_MS) {
      return null
    }

    return sessionData
  } catch {
    return null
  }
}

export async function requireAdminSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("admin_session")
  const session = parseAdminSession(sessionCookie?.value)

  if (!session) {
    cookieStore.delete("admin_session")
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    }
  }

  return {
    ok: true as const,
    session,
  }
}
