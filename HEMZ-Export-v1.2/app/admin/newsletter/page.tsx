"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Loader, Mail, Trash2, RefreshCw, Download, UserCheck, UserX, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Subscriber {
  id: string
  email: string
  status: "subscribed" | "active" | "unsubscribed"
  subscribed_at: string
  unsubscribed_at: string | null
  last_email_opened: string | null
  created_at: string
}

interface StatusCounts {
  subscribed: number
  active: number
  unsubscribed: number
}

export default function NewsletterSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [counts, setCounts] = useState<StatusCounts>({ subscribed: 0, active: 0, unsubscribed: 0 })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [subscriberToDelete, setSubscriberToDelete] = useState<Subscriber | null>(null)
  const { toast } = useToast()
  const limit = 20

  useEffect(() => {
    fetchSubscribers()
  }, [page, statusFilter, search])

  const fetchSubscribers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: statusFilter,
        ...(search && { search }),
      })

      const res = await fetch(`/api/admin/newsletter?${params}`)
      const data = await res.json()

      setSubscribers(data.subscribers || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
      if (data.counts) {
        setCounts(data.counts)
      }
    } catch (error) {
      console.error("Failed to fetch subscribers:", error)
      toast({
        title: "Error",
        description: "Failed to fetch subscribers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (subscriber: Subscriber) => {
    setSubscriberToDelete(subscriber)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async (hardDelete: boolean = false) => {
    if (!subscriberToDelete) return

    setActionLoading(subscriberToDelete.id)
    setDeleteDialogOpen(false)

    try {
      const params = new URLSearchParams({
        id: subscriberToDelete.id,
        ...(hardDelete && { hardDelete: "true" }),
      })

      const res = await fetch(`/api/admin/newsletter?${params}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: hardDelete 
            ? "Subscriber permanently deleted" 
            : "Subscriber unsubscribed successfully",
        })
        fetchSubscribers()
      } else {
        const err = await res.json()
        throw new Error(err.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove subscriber",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
      setSubscriberToDelete(null)
    }
  }

  const handleReactivate = async (id: string, newStatus: "subscribed" | "active" | "unsubscribed" = "subscribed") => {
    setActionLoading(id)

    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: `Subscriber status changed to ${newStatus}`,
        })
        fetchSubscribers()
      } else {
        const err = await res.json()
        throw new Error(err.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscriber status",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ["Email", "Status", "Subscribed At", "Unsubscribed At", "Last Email Opened"].join(","),
      ...subscribers.map((s) =>
        [
          s.email,
          s.status.charAt(0).toUpperCase() + s.status.slice(1),
          new Date(s.subscribed_at).toLocaleDateString(),
          s.unsubscribed_at ? new Date(s.unsubscribed_at).toLocaleDateString() : "",
          s.last_email_opened ? new Date(s.last_email_opened).toLocaleDateString() : "",
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`
    link.click()

    toast({
      title: "Success",
      description: "Subscribers exported to CSV",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Newsletter Subscribers</h1>
          <p className="text-muted-foreground">
            Manage your newsletter mailing list
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportToCSV} disabled={subscribers.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{counts.subscribed + counts.active + counts.unsubscribed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subscribed</p>
                <p className="text-2xl font-bold">{counts.subscribed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{counts.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-900/30">
                <UserX className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unsubscribed</p>
                <p className="text-2xl font-bold">{counts.unsubscribed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="h-10 px-3 border rounded-md bg-background"
            >
              <option value="all">All Subscribers</option>
              <option value="active">Active</option>
              <option value="subscribed">Subscribed</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
            <Button variant="outline" onClick={fetchSubscribers}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscribers Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Subscribers ({total} total, page {page} of {pages})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin" />
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No subscribers found.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Subscribers will appear here when customers sign up for your newsletter.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b">
                      <th className="px-3 py-3">Email</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Subscribed</th>
                      <th className="px-3 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="border-b hover:bg-muted/50">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{subscriber.email}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge 
                            variant="secondary"
                            className={
                              subscriber.status === "active" 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                                : subscriber.status === "subscribed"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                            }
                          >
                            {subscriber.status.charAt(0).toUpperCase() + subscriber.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-sm text-muted-foreground">
                          {new Date(subscriber.subscribed_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {/* Status change dropdown */}
                            <select
                              value={subscriber.status}
                              onChange={(e) => handleReactivate(subscriber.id, e.target.value as "subscribed" | "active" | "unsubscribed")}
                              disabled={actionLoading === subscriber.id}
                              className="h-8 px-2 text-xs border rounded-md bg-background"
                            >
                              <option value="subscribed">Subscribed</option>
                              <option value="active">Active</option>
                              <option value="unsubscribed">Unsubscribed</option>
                            </select>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(subscriber)}
                              disabled={actionLoading === subscriber.id}
                            >
                              {actionLoading === subscriber.id ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === pages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Subscriber</AlertDialogTitle>
            <AlertDialogDescription>
              What would you like to do with {subscriberToDelete?.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {subscriberToDelete?.status !== "unsubscribed" && (
              <Button
                variant="outline"
                onClick={() => handleDelete(false)}
              >
                Unsubscribe Only
              </Button>
            )}
            <AlertDialogAction
              onClick={() => handleDelete(true)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
