"use client"

import { Button } from "@/components/ui/button"
import { Bell, LogOut, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function AdminHeader() {
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
      })
    } catch (e) {
      // ignore
    }
    // Use window.location for guaranteed redirect after logout
    window.location.href = "/admin-login"
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50">
      <div className="flex items-center justify-between h-full px-6">
        <Link href="/admin" className="flex items-center space-x-3">
          <div className="relative h-8 w-8">
            <Image src="/hemz-pashmina-logo.png" alt="HEMZ Pashmina" fill className="object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold text-foreground">HEMZ</span>
            <span className="font-sans text-xs text-muted-foreground uppercase tracking-wider">Admin Panel</span>
          </div>
        </Link>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
          </Button>
          <Link href="/admin/profile">
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
