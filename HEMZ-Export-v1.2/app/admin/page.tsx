import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { formatPrice } from "@/lib/utils"
import { DollarSign, Package, ShoppingCart, TrendingDown, TrendingUp, Users } from "lucide-react"

function getDateRanges() {
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const previousMonthEnd = new Date(currentMonthStart.getTime() - 1)

  return {
    currentMonthStart,
    previousMonthStart,
    previousMonthEnd,
  }
}

function calculateChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100
  }

  return Number((((current - previous) / previous) * 100).toFixed(1))
}

function getStatusClasses(status: string) {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800"
    case "processing":
      return "bg-yellow-100 text-yellow-800"
    case "shipped":
      return "bg-blue-100 text-blue-800"
    case "delivered":
      return "bg-emerald-100 text-emerald-800"
    case "refunded":
      return "bg-orange-100 text-orange-800"
    case "failed":
      return "bg-red-100 text-red-800"
    case "cancelled":
      return "bg-gray-100 text-gray-800"
    case "cancel_requested":
      return "bg-amber-100 text-amber-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

export default async function AdminDashboard() {
  const { currentMonthStart, previousMonthStart, previousMonthEnd } = getDateRanges()

  const [
    totalProducts,
    totalCustomers,
    totalOrders,
    deliveredRevenue,
    currentMonthRevenue,
    previousMonthRevenue,
    currentMonthOrdersCount,
    previousMonthOrdersCount,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.user.count(),
    prisma.userOrder.count(),
    prisma.userOrder.aggregate({
      where: {
        status: "delivered",
        delivered_at: {
          not: null,
        },
      },
      _sum: {
        total_cents: true,
      },
    }),
    prisma.userOrder.aggregate({
      where: {
        status: "delivered",
        delivered_at: {
          not: null,
          gte: currentMonthStart,
        },
      },
      _sum: {
        total_cents: true,
      },
    }),
    prisma.userOrder.aggregate({
      where: {
        status: "delivered",
        delivered_at: {
          not: null,
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
      },
      _sum: {
        total_cents: true,
      },
    }),
    prisma.userOrder.count({
      where: {
        created_at: {
          gte: currentMonthStart,
        },
      },
    }),
    prisma.userOrder.count({
      where: {
        created_at: {
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
      },
    }),
    prisma.userOrder.findMany({
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: 6,
    }),
  ])

  const totalRevenueCents = deliveredRevenue._sum.total_cents ?? 0
  const currentMonthRevenueCents = currentMonthRevenue._sum.total_cents ?? 0
  const previousMonthRevenueCents = previousMonthRevenue._sum.total_cents ?? 0

  const revenueChange = calculateChange(currentMonthRevenueCents, previousMonthRevenueCents)
  const ordersChange = calculateChange(currentMonthOrdersCount, previousMonthOrdersCount)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to HEMZ Pashmina Admin</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenueCents)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {revenueChange >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
              )}
              <span className={revenueChange >= 0 ? "text-green-600" : "text-red-600"}>
                {revenueChange >= 0 ? "+" : ""}
                {revenueChange}%
              </span>
              <span className="ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {ordersChange >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
              )}
              <span className={ordersChange >= 0 ? "text-green-600" : "text-red-600"}>
                {ordersChange >= 0 ? "+" : ""}
                {ordersChange}%
              </span>
              <span className="ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <div className="text-xs text-muted-foreground">Live count from catalog</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <div className="text-xs text-muted-foreground">Registered customer accounts</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No orders yet. Recent orders will appear here once customers start checking out.
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => {
                const customerName =
                  `${order.user?.first_name || ""} ${order.user?.last_name || ""}`.trim() || order.user?.email || "Customer"
                const displayStatus =
                  order.cancel_request_status === "pending" && order.status !== "cancelled"
                    ? "cancel_requested"
                    : order.payment_status === "failed" && order.status === "pending"
                      ? "failed"
                      : order.status

                return (
                  <div key={order.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">{customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(order.total_cents)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses(displayStatus)}`}>
                        {displayStatus.replaceAll("_", " ")}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
