import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { formatPrice } from "@/lib/utils"

type RevenueMonth = {
  label: string
  revenueCents: number
  orders: number
}

function getMonthBuckets(monthCount: number) {
  const now = new Date()
  const buckets: RevenueMonth[] = []

  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    buckets.push({
      label: monthDate.toLocaleDateString(undefined, { month: "short", year: "numeric" }),
      revenueCents: 0,
      orders: 0,
    })
  }

  return buckets
}

function getOrderDisplayStatus(order: {
  status: string
  payment_status: string
  cancel_request_status?: string | null
}) {
  if (order.cancel_request_status === "pending" && order.status !== "cancelled") {
    return "cancel_requested"
  }

  if (order.payment_status === "failed" && order.status === "pending") {
    return "failed"
  }

  return order.status
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-slate-100 text-slate-800"
    case "paid":
      return "bg-green-100 text-green-800"
    case "processing":
      return "bg-yellow-100 text-yellow-800"
    case "shipped":
      return "bg-blue-100 text-blue-800"
    case "delivered":
      return "bg-emerald-100 text-emerald-800"
    case "failed":
      return "bg-red-100 text-red-800"
    case "cancelled":
      return "bg-gray-100 text-gray-800"
    case "cancel_requested":
      return "bg-amber-100 text-amber-800"
    case "refunded":
      return "bg-orange-100 text-orange-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

export default async function AdminReports() {
  const sixMonthsAgo = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1)

  const [orders, products, usersCount, subscribersCount, activeSubscribersCount] = await Promise.all([
    prisma.userOrder.findMany({
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        items: true,
      },
      orderBy: {
        created_at: "desc",
      },
    }),
    prisma.product.findMany({
      include: {
        variants: {
          orderBy: {
            sort_order: "asc",
          },
        },
      },
    }),
    prisma.user.count(),
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({
      where: {
        status: "subscribed",
      },
    }),
  ])

  const productTitleMap = new Map(products.map((product) => [product.id, product.title]))
  const lowStockProducts = products.filter((product) => product.is_available && product.in_stock > 0 && product.in_stock <= 5).length

  const deliveredOrders = orders.filter((order) => order.status === "delivered" && order.delivered_at)
  const paidOrders = orders.filter((order) => order.payment_status === "paid")
  const failedOrders = orders.filter((order) => getOrderDisplayStatus(order) === "failed")
  const cancelledOrders = orders.filter((order) => order.status === "cancelled")
  const cancelRequestedOrders = orders.filter((order) => order.cancel_request_status === "pending" && order.status !== "cancelled")

  const totalDeliveredRevenueCents = deliveredOrders.reduce((sum, order) => sum + order.total_cents, 0)
  const averageDeliveredOrderValueCents = deliveredOrders.length > 0 ? Math.round(totalDeliveredRevenueCents / deliveredOrders.length) : 0
  const conversionRate = orders.length > 0 ? ((paidOrders.length / orders.length) * 100).toFixed(1) : "0.0"

  const revenueByMonth = getMonthBuckets(6)
  deliveredOrders.forEach((order) => {
    if (!order.delivered_at) {
      return
    }

    if (new Date(order.delivered_at) < sixMonthsAgo) {
      return
    }

    const monthLabel = new Date(order.delivered_at).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    })
    const bucket = revenueByMonth.find((entry) => entry.label === monthLabel)
    if (bucket) {
      bucket.revenueCents += order.total_cents
      bucket.orders += 1
    }
  })

  const topProductsMap = new Map<string, { title: string; qty: number; revenueCents: number }>()
  deliveredOrders.forEach((order) => {
    order.items.forEach((item) => {
      const current = topProductsMap.get(item.product_id) || {
        title: item.product_title || productTitleMap.get(item.product_id) || "Unknown product",
        qty: 0,
        revenueCents: 0,
      }

      current.qty += item.quantity
      current.revenueCents += item.unit_price_cents * item.quantity
      topProductsMap.set(item.product_id, current)
    })
  })

  const topProducts = Array.from(topProductsMap.entries())
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 10)

  const topCustomersMap = new Map<string, { name: string; orders: number; spentCents: number }>()
  deliveredOrders.forEach((order) => {
    const customerId = order.user_id
    const current = topCustomersMap.get(customerId) || {
      name: `${order.user?.first_name || ""} ${order.user?.last_name || ""}`.trim() || order.user?.email || "Customer",
      orders: 0,
      spentCents: 0,
    }

    current.orders += 1
    current.spentCents += order.total_cents
    topCustomersMap.set(customerId, current)
  })

  const topCustomers = Array.from(topCustomersMap.entries())
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => b.spentCents - a.spentCents)
    .slice(0, 10)

  const statusBreakdown = [
    { label: "Delivered", value: deliveredOrders.length, key: "delivered" },
    { label: "Paid", value: paidOrders.length, key: "paid" },
    { label: "Failed", value: failedOrders.length, key: "failed" },
    { label: "Cancelled", value: cancelledOrders.length, key: "cancelled" },
    { label: "Cancel Requested", value: cancelRequestedOrders.length, key: "cancel_requested" },
  ]

  const maxRevenue = Math.max(...revenueByMonth.map((month) => month.revenueCents), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Live analytics from orders, products, customers, and subscribers.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Delivered Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalDeliveredRevenueCents)}</div>
            <div className="text-sm text-muted-foreground">{deliveredOrders.length} delivered orders</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(averageDeliveredOrderValueCents)}</div>
            <div className="text-sm text-muted-foreground">Based on delivered orders only</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <div className="text-sm text-muted-foreground">{paidOrders.length} paid of {orders.length} tracked orders</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catalog Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <div className="text-sm text-muted-foreground">
              {lowStockProducts} low-stock products, {usersCount} customers, {activeSubscribersCount}/{subscribersCount} active subscribers
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {revenueByMonth.map((month) => (
              <div key={month.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{month.label}</span>
                  <span className="text-muted-foreground">
                    {formatPrice(month.revenueCents)} from {month.orders} order{month.orders === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${maxRevenue > 0 ? Math.max((month.revenueCents / maxRevenue) * 100, 4) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusBreakdown.map((status) => (
              <div key={status.key} className="flex items-center justify-between rounded-lg border p-3">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(status.key)}`}>
                  {status.label}
                </span>
                <span className="text-lg font-semibold">{status.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Delivered Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                No delivered product sales yet.
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="px-2 py-2">Product</th>
                      <th className="px-2 py-2">Qty Sold</th>
                      <th className="px-2 py-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product) => (
                      <tr key={product.id} className="border-b last:border-0">
                        <td className="px-2 py-3 font-medium">{product.title}</td>
                        <td className="px-2 py-3">{product.qty}</td>
                        <td className="px-2 py-3">{formatPrice(product.revenueCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Customers by Delivered Spend</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                No delivered customer spend yet.
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="px-2 py-2">Customer</th>
                      <th className="px-2 py-2">Orders</th>
                      <th className="px-2 py-2">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b last:border-0">
                        <td className="px-2 py-3 font-medium">{customer.name}</td>
                        <td className="px-2 py-3">{customer.orders}</td>
                        <td className="px-2 py-3">{formatPrice(customer.spentCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Order Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No orders available for reporting yet.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 8).map((order) => {
                const displayStatus = getOrderDisplayStatus(order)
                const customerName =
                  `${order.user?.first_name || ""} ${order.user?.last_name || ""}`.trim() || order.user?.email || "Customer"

                return (
                  <div key={order.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">{customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(order.total_cents)}</p>
                      <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(displayStatus)}`}>
                      {displayStatus.replaceAll("_", " ")}
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
