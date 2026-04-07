"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminProfile() {
  const router = useRouter()

  const handleLogout = () => {
    // clear demo auth token and redirect
    try {
      localStorage.removeItem("adminToken")
    } catch (e) {
      // ignore
    }
    router.push("/admin/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your admin account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 relative rounded-full overflow-hidden bg-muted">
              <Image src="/hemz-pashmina-logo.png" alt="Admin avatar" fill className="object-cover" />
            </div>

            <div className="flex-1">
              <p className="font-medium">Admin User</p>
              <p className="text-sm text-muted-foreground">admin@hemzpashmina.com</p>

              <div className="mt-4 flex gap-2">
                <Link href="/admin/settings">
                  <Button>Edit Profile</Button>
                </Link>
                <Button variant="destructive" onClick={handleLogout}>Log out</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
