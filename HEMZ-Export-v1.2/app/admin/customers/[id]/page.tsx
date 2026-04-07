"use client"

import { useState, useEffect, use, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { safeJsonParse } from "@/lib/utils"
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  ShoppingBag, 
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Heart,
  ExternalLink,
  RefreshCw
} from "lucide-react"
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

interface WishlistItem {
  id: string
  product_id: string
  product_title: string
  product_price: number
  product_image: string | null
  added_at: string
}

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
  wishlist?: WishlistItem[]
  wishlist_count?: number
}

export default function CustomerView({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = use(params)
  const id = decodeURIComponent(rawId)
  const router = useRouter()
  const { toast } = useToast()
  
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch customer details
  const fetchCustomer = useCallback(async (showRefreshState = false) => {
    if (showRefreshState) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    try {
      const response = await fetch(`/api/admin/customers/${id}`)
      const result = await safeJsonParse(response)
      
      if (!result.success) {
        setError(result.error || "Failed to load customer details")
        return
      }
      
      const data = result.data
      if (data.success) {
        setCustomer(data.data)
        setError(null)
      } else {
        setError(data.error || "Customer not found")
      }
    } catch (err) {
      setError("Failed to load customer details")
      console.error("[Admin] Failed to fetch customer:", err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [id])

  // Initial load
  useEffect(() => {
    fetchCustomer()
  }, [fetchCustomer])

  // Auto-refresh every 30 seconds when the page is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isLoading && !isRefreshing) {
        fetchCustomer(true)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchCustomer, isLoading, isRefreshing])

  // Refresh handler for manual refresh
  const handleRefresh = () => {
    fetchCustomer(true)
    toast({
      title: "Refreshing...",
      description: "Fetching latest customer data",
      duration: 2000,
    })
  }

  // Delete customer
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/customers/${id}`, {
        method: "DELETE",
      })
      const result = await safeJsonParse(response)
      
      if (result.success && result.data?.success) {
        toast({
          title: "Customer deleted",
          description: "The customer has been permanently deleted.",
        })
        router.push("/admin/customers")
      } else {
        toast({
          title: "Delete failed",
          description: result.data?.error || result.error || "Failed to delete customer",
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
      setIsDeleting(false)
    }
  }

  // Toggle customer status
  const toggleStatus = async () => {
    if (!customer) return
    
    try {
      const newStatus = customer.status === "active" ? false : true
      const response = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: customer.id, is_active: newStatus }),
      })
      
      const result = await safeJsonParse(response)
      
      if (result.success && result.data?.success) {
        setCustomer({
          ...customer,
          status: newStatus ? "active" : "inactive",
        })
        toast({
          title: "Status updated",
          description: `Customer is now ${newStatus ? "active" : "inactive"}`,
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading customer details...</span>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-6 w-6" />
          <h1 className="font-serif text-2xl font-bold">Customer not found</h1>
        </div>
        <p className="text-muted-foreground">{error || `No customer with id: ${id}`}</p>
        <Link href="/admin/customers">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-serif text-3xl font-bold">{customer.name}</h1>
            <Badge 
              variant={customer.status === "active" ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={toggleStatus}
            >
              {customer.status}
            </Badge>
            {customer.email_verified && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground font-mono text-sm">ID: {customer.id}</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh customer data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Link href={`/admin/customers/${encodeURIComponent(customer.id)}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete <strong>{customer.name}</strong> and all their data. 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Customer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-muted-foreground">{customer.email}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-muted-foreground">{customer.phone || "Not provided"}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Company</p>
                <p className="text-muted-foreground">{customer.company || "Not provided"}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Address</p>
                <p className="text-muted-foreground">{customer.address || "Not provided"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Activity & Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <ShoppingBag className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-sm">Total Orders</p>
                <p className="text-2xl font-bold">{customer.orders_count}</p>
              </div>
            </div>
            
            <div>
              <p className="text-muted-foreground text-sm">Total Spent</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat(undefined, { 
                  style: "currency", 
                  currency: "USD" 
                }).format(customer.total_spent)}
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-sm">Joined</p>
                <p className="font-medium">
                  {new Date(customer.joined_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-muted-foreground text-sm">Last Login</p>
              <p className="font-medium">
                {customer.last_login 
                  ? new Date(customer.last_login).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Never"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wishlist Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Wishlist ({customer.wishlist_count || 0} items)
            {isRefreshing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {customer.wishlist && customer.wishlist.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customer.wishlist.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  {item.product_image ? (
                    <img 
                      src={item.product_image} 
                      alt={item.product_title}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product_title}</p>
                    <p className="text-muted-foreground text-sm">
                      {new Intl.NumberFormat(undefined, { 
                        style: "currency", 
                        currency: "USD" 
                      }).format(item.product_price)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Added {new Date(item.added_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link 
                    href={`/products/${item.product_id}`}
                    target="_blank"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No items in wishlist</p>
              <p className="text-sm">Customer hasn&apos;t added any products to their wishlist yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Button */}
      <div>
        <Link href="/admin/customers">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        </Link>
      </div>
    </div>
  )
}

