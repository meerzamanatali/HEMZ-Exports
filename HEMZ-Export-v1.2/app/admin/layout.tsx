import type React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

// Admin authentication check using session cookie
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("admin_session")

  if (!sessionCookie?.value) {
    redirect("/admin-login")
  }

  try {
    // Verify session token
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, "base64").toString()
    )

    // Verify session is valid admin session
    if (sessionData.role !== "admin" || !sessionData.email) {
      redirect("/admin-login")
    }

    // Check if session is expired (24 hours)
    const sessionAge = Date.now() - sessionData.timestamp
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    if (sessionAge > maxAge) {
      redirect("/admin-login")
    }

    return sessionData.email
  } catch {
    redirect("/admin-login")
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await checkAdminAuth()

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 ml-64 pt-16">{children}</main>
      </div>
    </div>
  )
}
