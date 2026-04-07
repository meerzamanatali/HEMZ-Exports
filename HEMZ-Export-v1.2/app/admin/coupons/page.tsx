"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Edit, Trash, Search, Loader } from "lucide-react"
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
import couponsData from "@/data/coupons.json"

interface Coupon {
  id: string
  code: string
  type: string
  value: number
  min_order?: number
  uses: number
  max_uses: number
  active: boolean
  start_date: string
  end_date: string
}

export default function AdminCoupons() {
  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [localCoupons, setLocalCoupons] = useState<Coupon[]>(couponsData.coupons || [])
  const { toast } = useToast()

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return localCoupons.filter((c) => {
      if (statusFilter === "active" && !c.active) return false
      if (statusFilter === "inactive" && c.active) return false
      if (!term) return true
      return (
        c.code.toLowerCase().includes(term) ||
        (c.type || "").toLowerCase().includes(term) ||
        (c.id || "").toLowerCase().includes(term)
      )
    })
  }, [localCoupons, q, statusFilter])

  const handleDeleteClick = (coupon: Coupon) => {
    setCouponToDelete(coupon)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!couponToDelete) return

    const id = couponToDelete.id
    setDeletingId(id)
    setDeleteDialogOpen(false)

    // Simulate API call for demo
    setTimeout(() => {
      setLocalCoupons(localCoupons.filter((c) => c.id !== id))
      toast({
        title: "Success",
        description: "Coupon deleted successfully!",
      })
      setDeletingId(null)
      setCouponToDelete(null)
    }, 500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Coupons</h1>
          <p className="text-muted-foreground">Create and manage discount codes</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-md overflow-hidden">
            <div className="p-2 text-muted-foreground">
              <Search className="h-4 w-4" />
            </div>
            <Input placeholder="Search by code or id..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 border rounded-md">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <Link href="/admin/coupons/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Coupon
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Coupons ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground">No coupons found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Type / Value</th>
                    <th className="px-3 py-2">Min Order</th>
                    <th className="px-3 py-2">Uses</th>
                    <th className="px-3 py-2">Active</th>
                    <th className="px-3 py-2">Valid</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-3 py-2 align-top">
                        <div className="font-medium">{c.code}</div>
                        <div className="text-xs text-muted-foreground">{c.id}</div>
                      </td>
                      <td className="px-3 py-2 align-top">{c.type} {c.type === "percent" ? `${c.value}%` : `$${c.value}`}</td>
                      <td className="px-3 py-2 align-top">{c.min_order ? `$${c.min_order}` : "—"}</td>
                      <td className="px-3 py-2 align-top">{c.uses} / {c.max_uses}</td>
                      <td className="px-3 py-2 align-top"><Badge variant={c.active ? undefined : "secondary"}>{c.active ? "Active" : "Inactive"}</Badge></td>
                      <td className="px-3 py-2 align-top">{new Date(c.start_date).toLocaleDateString()} — {new Date(c.end_date).toLocaleDateString()}</td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/coupons/${encodeURIComponent(c.id)}`} className="inline-flex items-center px-2 py-1 rounded bg-muted hover:bg-muted/80">
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link href={`/admin/coupons/${encodeURIComponent(c.id)}/edit`} className="inline-flex items-center px-2 py-1 rounded bg-muted hover:bg-muted/80">
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button 
                            onClick={() => handleDeleteClick(c)}
                            className="inline-flex items-center px-2 py-1 rounded bg-destructive text-destructive-foreground opacity-80 hover:opacity-100" 
                            title="Delete coupon"
                            disabled={deletingId === c.id}
                          >
                            {deletingId === c.id ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the coupon
              {couponToDelete && ` "${couponToDelete.code}"`} from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
