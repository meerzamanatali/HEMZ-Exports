"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { safeJsonParse } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Edit, Trash2, RefreshCw, Users, CheckCircle, XCircle, Loader2 } from "lucide-react"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company: string
  address: string
  orders_count: number
  total_spent: number
  joined_at: string
  last_login: string | null
  status: string
  email_verified: boolean
}

interface CustomersApiResponse {
  success: boolean
  data?: Customer[]
  total?: number
  message?: string
  error?: string
}

function formatCurrency(v: number) {
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" })
}

export default function AdminCustomers() {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const getCustomerArray = (payload: unknown): Customer[] => {
    if (Array.isArray(payload)) {
      return payload as Customer[]
    }

    if (
      payload &&
      typeof payload === "object" &&
      "data" in payload &&
      Array.isArray((payload as CustomersApiResponse).data)
    ) {
      return (payload as CustomersApiResponse).data || []
    }

    return []
  }

  // Fetch customers from API
  const fetchCustomers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/customers")
      const result = await safeJsonParse<CustomersApiResponse>(response)
      
      if (!result.success) {
        setCustomers([])
        setError(result.error || "Failed to load customers")
        return
      }

      if (!response.ok || result.data?.success === false) {
        setCustomers([])
        setError(result.data?.error || "Failed to load customers")
      } else {
        setCustomers(getCustomerArray(result.data))
      }
    } catch (err) {
      setCustomers([])
      setError("Failed to connect to server")
      console.error("[Admin] Failed to fetch customers:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return customers.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false
      if (!q) return true
      return (
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.address || "").toLowerCase().includes(q)
      )
    })
  }, [customers, query, statusFilter])

  // Toggle customer status
  const toggleCustomerStatus = async (customerId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? false : true
      const response = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: customerId, is_active: newStatus }),
      })
      
      const result = await safeJsonParse<{ success: boolean; message?: string; error?: string }>(response)
      
      if (result.success && response.ok && result.data?.success) {
        toast({
          title: "Customer updated",
          description: result.data.message || "Customer updated successfully.",
        })
        fetchCustomers() // Refresh the list
      } else {
        toast({
          title: "Update failed",
          description: result.data?.error || result.error || "Failed to update customer.",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update customer status",
        variant: "destructive",
      })
    }
  }

  // Delete customer
  const deleteCustomer = async (customerId: string, customerName: string) => {
    setDeletingId(customerId)
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: "DELETE",
      })
      
      const result = await safeJsonParse<{ success: boolean; error?: string }>(response)
      
      if (result.success && response.ok && result.data?.success) {
        toast({
          title: "Customer deleted",
          description: `${customerName} has been permanently deleted.`,
        })
        fetchCustomers() // Refresh the list
      } else {
        toast({
          title: "Delete failed",
          description: result.data?.error || result.error || "Failed to delete customer.",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">View and manage registered customers</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCustomers}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          
          <div className="flex items-center border rounded-md overflow-hidden">
            <div className="p-2 text-muted-foreground">
              <Search className="h-4 w-4" />
            </div>
            <Input
              placeholder="Search customers by name, email, phone or id..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 border rounded-md"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter((c) => c.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter((c) => c.status === "inactive").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer List ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading customers...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchCustomers}>Try Again</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {customers.length === 0
                  ? "No registered customers yet. Customers will appear here when they create accounts."
                  : "No customers match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Email / Phone</th>
                    <th className="px-3 py-2">Orders</th>
                    <th className="px-3 py-2">Total Spent</th>
                    <th className="px-3 py-2">Joined</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-t hover:bg-muted/50 transition-colors">
                      <td className="px-3 py-3 align-top">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{c.id.slice(0, 8)}...</div>
                        {c.company && (
                          <div className="text-xs text-muted-foreground">{c.company}</div>
                        )}
                        {c.address && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">{c.address}</div>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="text-sm flex items-center gap-1">
                          {c.email}
                          {c.email_verified && (
                            <CheckCircle className="h-3 w-3 text-green-500" title="Email verified" />
                          )}
                        </div>
                        {c.phone && (
                          <div className="text-xs text-muted-foreground">{c.phone}</div>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">{c.orders_count}</td>
                      <td className="px-3 py-3 align-top">{formatCurrency(c.total_spent)}</td>
                      <td className="px-3 py-3 align-top">
                        <div>{new Date(c.joined_at).toLocaleDateString()}</div>
                        {c.last_login && (
                          <div className="text-xs text-muted-foreground">
                            Last login: {new Date(c.last_login).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <Badge 
                          variant={c.status === "active" ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => toggleCustomerStatus(c.id, c.status)}
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/admin/customers/${encodeURIComponent(c.id)}`} 
                            className="inline-flex items-center px-2 py-1 rounded bg-muted hover:bg-muted/80"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link 
                            href={`/admin/customers/${encodeURIComponent(c.id)}/edit`} 
                            className="inline-flex items-center px-2 py-1 rounded bg-muted hover:bg-muted/80"
                            title="Edit customer"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button 
                                className="inline-flex items-center px-2 py-1 rounded bg-destructive/10 hover:bg-destructive/20 text-destructive"
                                title="Delete customer"
                                disabled={deletingId === c.id}
                              >
                                {deletingId === c.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete <strong>{c.name}</strong> ({c.email}) and all their data. 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteCustomer(c.id, c.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Customer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
    </div>
  )
}
