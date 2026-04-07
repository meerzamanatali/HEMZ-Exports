import { createHmac, timingSafeEqual } from "crypto"

const SESSION_COOKIE_NAME = "session_token"
const LEGACY_USER_ID_COOKIE = "user_id"
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

type CookieStoreLike = {
  get: (name: string) => { value: string } | undefined
  set: (name: string, value: string, options?: Record<string, unknown>) => void
  delete: (name: string) => void
}

interface UserSessionPayload {
  userId: string
  email: string
  exp: number
}

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET || process.env.ADMIN_PASSWORD || "dev-user-session-secret"
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url")
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

function signPayload(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url")
}

export function createUserSessionToken(userId: string, email: string) {
  const payload: UserSessionPayload = {
    userId,
    email,
    exp: Date.now() + SESSION_MAX_AGE_MS,
  }

  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = signPayload(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export function verifyUserSessionToken(token?: string | null): UserSessionPayload | null {
  if (!token) {
    return null
  }

  const [encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature) {
    return null
  }

  const expectedSignature = signPayload(encodedPayload)
  const providedBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as UserSessionPayload
    if (!payload.userId || !payload.email || typeof payload.exp !== "number") {
      return null
    }

    if (payload.exp <= Date.now()) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function setUserSession(
  cookieStore: CookieStoreLike,
  user: { id: string; email: string }
) {
  const token = createUserSessionToken(user.id, user.email)
  const expires = new Date(Date.now() + SESSION_MAX_AGE_MS)
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    expires,
    path: "/",
  }

  cookieStore.set(SESSION_COOKIE_NAME, token, options)
  cookieStore.set(LEGACY_USER_ID_COOKIE, user.id, options)
}

export function clearUserSession(cookieStore: CookieStoreLike) {
  cookieStore.delete(SESSION_COOKIE_NAME)
  cookieStore.delete(LEGACY_USER_ID_COOKIE)
}

export function getSessionUserId(cookieStore: CookieStoreLike) {
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const payload = verifyUserSessionToken(token)
  return payload?.userId || null
}
