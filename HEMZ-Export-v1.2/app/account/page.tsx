"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useAuth, type UpdateProfileData } from "@/lib/contexts/auth-context"
import { useWishlist } from "@/lib/contexts/wishlist-context"
import { useCart } from "@/lib/contexts/cart-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { CANCELLATION_REASON_OPTIONS } from "@/lib/orders"
import { formatPrice } from "@/lib/utils"
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  LogOut,
  ShoppingBag,
  Heart,
  Settings,
  Check,
  X,
  ShoppingCart,
  Trash2,
  ExternalLink,
  RefreshCw,
  Package,
} from "lucide-react"

type UserOrder = {
  id: string
  order_number: string
  status: string
  display_status: string
  payment_status: string
  total_cents: number
  created_at: string
  shipping_name: string
  shipping_address: string
  shipping_city: string
  shipping_state?: string | null
  shipping_postal: string
  shipping_country: string
  shipping_method?: string | null
  tracking_number?: string | null
  cancel_request_status?: string | null
  cancel_request_reason?: string | null
  cancel_request_details?: string | null
  can_request_cancellation: boolean
  items: Array<{
    id: string
    product_title: string
    product_sku?: string | null
    quantity: number
    unit_price_cents: number
    variant_info?: Record<string, string> | null
  }>
}

const orderBadgeClasses: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800",
  paid: "bg-green-100 text-green-800",
  processing: "bg-yellow-100 text-yellow-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800",
  failed: "bg-red-100 text-red-800",
  cancel_requested: "bg-amber-100 text-amber-800",
}

// ✅ Inner component that uses useSearchParams
function AccountContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading, isAuthenticated, updateProfile, changePassword, logout } = useAuth()
  const { items: wishlistItems, itemCount: wishlistCount, removeItem: removeFromWishlist, refreshWishlist, isLoading: wishlistLoading } = useWishlist()
  const { addItem: addToCart } = useCart()
  const { toast } = useToast()
  const defaultTab = searchParams.get("tab") === "orders" ? "orders" : "profile"

  const [profileData, setProfileData] = useState<UpdateProfileData>({
    first_name: "",
    last_name: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelDetails, setCancelDetails] = useState("")

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/account")
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        company: user.company || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        postal_code: user.postal_code || "",
        country: user.country || "",
      })
    }
  }, [user])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const loadOrders = async () => {
      try {
        setOrdersLoading(true)
        const response = await fetch("/api/orders")
        const result = await response.json()
        if (response.ok && result.success) {
          setOrders(Array.isArray(result.orders) ? result.orders : [])
          return
        }

        throw new Error(result.error || "Failed to load orders")
      } catch (error) {
        toast({
          title: "Orders unavailable",
          description: error instanceof Error ? error.message : "Failed to load orders",
          variant: "destructive",
        })
      } finally {
        setOrdersLoading(false)
      }
    }

    loadOrders()
  }, [isAuthenticated, toast])

  const passwordChecks = {
    length: passwordData.newPassword.length >= 8,
    uppercase: /[A-Z]/.test(passwordData.newPassword),
    lowercase: /[a-z]/.test(passwordData.newPassword),
    number: /[0-9]/.test(passwordData.newPassword),
  }

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean)

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)

    const result = await updateProfile(profileData)

    if (result.success) {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } else {
      toast({
        title: "Update failed",
        description: result.error || "Could not update profile. Please try again.",
        variant: "destructive",
      })
    }

    setIsUpdatingProfile(false)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isPasswordStrong) {
      toast({
        title: "Weak password",
        description: "Password doesn't meet the requirements.",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)

    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword)

    if (result.success) {
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      })
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } else {
      toast({
        title: "Password change failed",
        description: result.error || "Could not change password. Please try again.",
        variant: "destructive",
      })
    }

    setIsChangingPassword(false)
  }

  const handleLogout = async () => {
    await logout()
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    })
    router.push("/")
  }

  const handleCancelRequest = async (orderId: string) => {
    if (!cancelReason || !cancelDetails.trim()) {
      toast({
        title: "Missing cancellation feedback",
        description: "Please choose a reason and add details before sending the request.",
        variant: "destructive",
      })
      return
    }

    try {
      setCancellingOrderId(orderId)
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/cancel-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: cancelReason,
          details: cancelDetails,
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to submit cancellation request")
      }

      setOrders((prev) => prev.map((order) => (order.id === orderId ? result.order : order)))
      setCancelReason("")
      setCancelDetails("")
      toast({
        title: "Request submitted",
        description: "Your cancellation request has been sent for admin review.",
      })
    } catch (error) {
      toast({
        title: "Request failed",
        description: error instanceof Error ? error.message : "Failed to submit cancellation request",
        variant: "destructive",
      })
    } finally {
      setCancellingOrderId(null)
    }
  }

  const PasswordCheck = ({ passed, label }: { passed: boolean; label: string }) => (
    <div className={`flex items-center gap-2 text-xs ${passed ? "text-green-600" : "text-muted-foreground"}`}>
      {passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      <span>{label}</span>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold">My Account</h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {user.first_name}!
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 bg-primary/10 rounded-full">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{orders.length}</p>
                  <p className="text-sm text-muted-foreground">Orders</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <Heart className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{wishlistCount}</p>
                  <p className="text-sm text-muted-foreground">Wishlist Items</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium truncate max-w-[180px]">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.email_verified ? "Verified" : "Not verified"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Orders</span>
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="gap-2">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5">
                    {wishlistCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="address" className="gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Address</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and contact details.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="first_name"
                            name="first_name"
                            value={profileData.first_name}
                            onChange={handleProfileChange}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={profileData.last_name}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          value={user.email}
                          className="pl-10 bg-muted"
                          disabled
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed. Contact support if needed.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={profileData.phone}
                            onChange={handleProfileChange}
                            className="pl-10"
                            placeholder="+1 234 567 8900"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="company"
                            name="company"
                            value={profileData.company}
                            onChange={handleProfileChange}
                            className="pl-10"
                            placeholder="Your Company"
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" disabled={isUpdatingProfile}>
                      {isUpdatingProfile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    My Orders
                    {ordersLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </CardTitle>
                  <CardDescription>
                    Review your recent orders, payment status, and submit cancellation requests before shipment.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orders.length === 0 && !ordersLoading ? (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                      <p className="text-lg font-medium">No orders yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">Once you place an order, it will appear here.</p>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="rounded-lg border p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-1">
                            <p className="font-semibold">{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              Placed on {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Payment: <span className="font-medium capitalize text-foreground">{order.payment_status}</span>
                            </p>
                          </div>
                          <div className="flex flex-col items-start gap-2 md:items-end">
                            <Badge className={orderBadgeClasses[order.display_status] || orderBadgeClasses.pending}>
                              {order.display_status.replaceAll("_", " ")}
                            </Badge>
                            <p className="font-semibold">{formatPrice(order.total_cents)}</p>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-medium">{item.product_title}</p>
                                <p className="text-sm text-muted-foreground">
                                  Qty: {item.quantity}
                                  {item.product_sku ? ` • SKU: ${item.product_sku}` : ""}
                                </p>
                              </div>
                              <p className="font-medium">{formatPrice(item.unit_price_cents * item.quantity)}</p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 rounded-md bg-muted/50 p-3 text-sm">
                          <p className="font-medium">Shipping</p>
                          <p>{order.shipping_name}</p>
                          <p>
                            {order.shipping_address}, {order.shipping_city}
                            {order.shipping_state ? `, ${order.shipping_state}` : ""} {order.shipping_postal}
                          </p>
                          <p>{order.shipping_country}</p>
                          {order.tracking_number && (
                            <p className="mt-2">
                              Tracking: <span className="font-medium">{order.tracking_number}</span>
                            </p>
                          )}
                        </div>

                        {order.cancel_request_status && (
                          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                            <p className="font-medium capitalize">
                              Cancellation request: {order.cancel_request_status}
                            </p>
                            {order.cancel_request_reason && (
                              <p className="text-muted-foreground">
                                Reason: {order.cancel_request_reason.replaceAll("_", " ")}
                              </p>
                            )}
                            {order.cancel_request_details && (
                              <p className="mt-1 text-muted-foreground">{order.cancel_request_details}</p>
                            )}
                          </div>
                        )}

                        {order.can_request_cancellation && (
                          <div className="mt-4 space-y-3 rounded-lg border border-dashed p-4">
                            <p className="font-medium">Request Cancellation</p>
                            <Select value={cancelReason} onValueChange={setCancelReason}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a reason" />
                              </SelectTrigger>
                              <SelectContent>
                                {CANCELLATION_REASON_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Textarea
                              value={cancelDetails}
                              onChange={(e) => setCancelDetails(e.target.value)}
                              placeholder="Tell us why you want to cancel this order."
                            />
                            <Button
                              onClick={() => handleCancelRequest(order.id)}
                              disabled={cancellingOrderId === order.id}
                              variant="outline"
                            >
                              {cancellingOrderId === order.id ? "Submitting..." : "Submit Cancellation Request"}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="address">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                  <CardDescription>
                    Your default shipping address for orders.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={profileData.address}
                        onChange={handleProfileChange}
                        placeholder="123 Main Street, Apt 4"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={profileData.city}
                          onChange={handleProfileChange}
                          placeholder="New York"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State / Province</Label>
                        <Input
                          id="state"
                          name="state"
                          value={profileData.state}
                          onChange={handleProfileChange}
                          placeholder="NY"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Postal Code</Label>
                        <Input
                          id="postal_code"
                          name="postal_code"
                          value={profileData.postal_code}
                          onChange={handleProfileChange}
                          placeholder="10001"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          name="country"
                          value={profileData.country}
                          onChange={handleProfileChange}
                          placeholder="United States"
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={isUpdatingProfile}>
                      {isUpdatingProfile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Address"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="pl-10 pr-10"
                          placeholder="••••••••"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="pl-10 pr-10"
                          placeholder="••••••••"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {passwordData.newPassword && (
                        <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-muted/50 rounded-md">
                          <PasswordCheck passed={passwordChecks.length} label="At least 8 characters" />
                          <PasswordCheck passed={passwordChecks.uppercase} label="One uppercase letter" />
                          <PasswordCheck passed={passwordChecks.lowercase} label="One lowercase letter" />
                          <PasswordCheck passed={passwordChecks.number} label="One number" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="pl-10"
                          placeholder="••••••••"
                        />
                      </div>
                      {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                        <p className="text-sm text-destructive">Passwords don&apos;t match</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isChangingPassword || !passwordData.currentPassword || !isPasswordStrong || passwordData.newPassword !== passwordData.confirmPassword}
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>
                    Irreversible actions for your account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button variant="destructive" disabled>
                    Delete Account (Coming Soon)
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wishlist">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      My Wishlist
                      {wishlistLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </CardTitle>
                    <CardDescription>
                      Products you&apos;ve saved for later. Move them to cart when you&apos;re ready to purchase.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      refreshWishlist()
                      toast({
                        title: "Refreshing wishlist...",
                        description: "Fetching your latest wishlist",
                        duration: 2000,
                      })
                    }}
                    disabled={wishlistLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${wishlistLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {wishlistItems.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Your wishlist is empty</h3>
                      <p className="text-muted-foreground mb-4">
                        Start adding products you love to your wishlist!
                      </p>
                      <Button asChild>
                        <Link href="/products">Browse Products</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {wishlistItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Link href={`/products/${item.id}`} className="shrink-0">
                            <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted">
                              <Image
                                src={item.image || "/placeholder.svg"}
                                alt={item.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link href={`/products/${item.id}`} className="hover:underline">
                              <h4 className="font-medium truncate">{item.title}</h4>
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              {item.type && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                  {item.type}
                                </span>
                              )}
                              {item.material && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                  {item.material}
                                </span>
                              )}
                            </div>
                            <p className="text-lg font-semibold text-primary mt-1">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              onClick={() => {
                                addToCart({
                                  variant_id: item.selected_variant_id || item.id,
                                  price_cents: Math.round(item.price * 100),
                                  product_title: item.title,
                                  product_image: item.image,
                                  variant_sku: item.selected_variant_id || item.id,
                                  variant_attributes: {
                                    color: item.selected_variant_name,
                                    type: item.type,
                                    material: item.material,
                                  },
                                })
                                removeFromWishlist(item.id)
                                toast({
                                  title: "Moved to cart",
                                  description: `${item.title} has been added to your cart.`,
                                })
                              }}
                              className="gap-1"
                            >
                              <ShoppingCart className="h-4 w-4" />
                              <span className="hidden sm:inline">Move to Cart</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                removeFromWishlist(item.id)
                                toast({
                                  title: "Removed from wishlist",
                                  description: `${item.title} has been removed from your wishlist.`,
                                })
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/products/${item.id}`}>
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}

                      <Separator className="my-4" />
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {wishlistCount} item{wishlistCount !== 1 ? "s" : ""} in your wishlist
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            wishlistItems.forEach((item) => {
                              addToCart({
                                variant_id: item.selected_variant_id || item.id,
                                price_cents: Math.round(item.price * 100),
                                product_title: item.title,
                                product_image: item.image,
                                variant_sku: item.selected_variant_id || item.id,
                                variant_attributes: {
                                  color: item.selected_variant_name,
                                  type: item.type,
                                  material: item.material,
                                },
                              })
                              removeFromWishlist(item.id)
                            })
                            toast({
                              title: "All items moved to cart",
                              description: `${wishlistCount} items have been added to your cart.`,
                            })
                          }}
                          className="gap-2"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Move All to Cart
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    }>
      <AccountContent />
    </Suspense>
  )
}