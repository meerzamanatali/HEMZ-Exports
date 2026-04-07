import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/admin/customers - Get all registered users (customers)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // "active", "inactive", or null for all
    const search = searchParams.get("search")?.toLowerCase()

    // Build where clause
    const where: Record<string, unknown> = {}
    
    if (status === "active") {
      where.is_active = true
    } else if (status === "inactive") {
      where.is_active = false
    }

    // Get all users from the database
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        company: true,
        address: true,
        city: true,
        state: true,
        postal_code: true,
        country: true,
        email_verified: true,
        is_active: true,
        last_login: true,
        created_at: true,
        orders: {
          select: {
            id: true,
            total_cents: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    })

    // Transform to customer format and apply search filter
    const customers = users
      .map((user) => ({
        id: user.id,
        name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown",
        email: user.email,
        phone: user.phone || "",
        company: user.company || "",
        address: [user.address, user.city, user.state, user.postal_code, user.country]
          .filter(Boolean)
          .join(", "),
        orders_count: user.orders.length,
        total_spent: user.orders.reduce((sum, order) => sum + order.total_cents, 0) / 100,
        joined_at: user.created_at.toISOString(),
        last_login: user.last_login?.toISOString() || null,
        status: user.is_active ? "active" : "inactive",
        email_verified: user.email_verified,
      }))
      .filter((customer) => {
        if (!search) return true
        return (
          customer.id.toLowerCase().includes(search) ||
          customer.name.toLowerCase().includes(search) ||
          customer.email.toLowerCase().includes(search) ||
          customer.phone.toLowerCase().includes(search) ||
          customer.address.toLowerCase().includes(search)
        )
      })

    return NextResponse.json({
      success: true,
      data: customers,
      total: customers.length,
    })
  } catch (error) {
    console.error("[API] Admin customers GET error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch customers" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/customers/:id - Update customer status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, is_active } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { is_active },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        is_active: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `Customer ${is_active ? "activated" : "deactivated"} successfully`,
    })
  } catch (error) {
    console.error("[API] Admin customers PATCH error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update customer" },
      { status: 500 }
    )
  }
}
