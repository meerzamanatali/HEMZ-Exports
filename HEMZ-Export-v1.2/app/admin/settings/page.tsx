"use client"

import { useEffect, useState } from "react"
import { SettingsForm } from "@/components/admin/settings-form"
import { Loader } from "lucide-react"

export default function AdminSettings() {
  const [settingsData, setSettingsData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/settings")
      const data = await res.json()
      setSettingsData(data)
    } catch (error) {
      console.error("Failed to fetch settings:", error)
      setSettingsData({})
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage store configuration, payment methods, and email settings
        </p>
      </div>

      <SettingsForm initialData={settingsData} />
    </div>
  )
}
