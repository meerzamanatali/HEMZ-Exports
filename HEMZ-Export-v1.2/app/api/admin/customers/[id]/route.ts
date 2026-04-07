import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { serializeProductForClient } from "@/lib/product-variants"

function isUsableImageSrc(value?: string | null) {
  return Boolean(value && /^(\/|https?:\/\/|data:image)/i.test(value))
}

// GET /api/admin/customers/:id - Get single customer details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
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
            status: true,
            created_at: true,
          },
          orderBy: {
            created_at: "desc",
          },
        },
        wishlistItems: {
          select: {
            id: true,
            product_id: true,
            selected_variant_id: true,
            selected_variant_name: true,
            product_title: true,
            product_price: true,
            product_image: true,
            added_at: true,
          },
          orderBy: {
            added_at: "desc",
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      )
    }

    const wishlistProductIds = user.wishlistItems.map((item) => item.product_id)
    const wishlistProducts = wishlistProductIds.length > 0
      ? await prisma.product.findMany({
          where: {
            id: {
              in: wishlistProductIds,
            },
          },
          include: {
            variants: {
              orderBy: {
                sort_order: "asc",
              },
            },
          },
        })
      : []
    const wishlistImageMap = new Map<string, string | null>()
    const wishlistVariantImageMap = new Map<string, string | null>()
    const wishlistVariantNameImageMap = new Map<string, string | null>()

    wishlistProducts.forEach((product) => {
      const normalizedProduct = serializeProductForClient(product as any)
      const defaultImage = normalizedProduct.default_variant?.images?.[0] || normalizedProduct.images?.[0] || null

      wishlistImageMap.set(product.id, defaultImage)
      normalizedProduct.variants?.forEach((variant) => {
        if (variant.id) {
          wishlistVariantImageMap.set(variant.id, variant.images?.[0] || defaultImage)
        }
        if (variant.name) {
          wishlistVariantNameImageMap.set(`${product.id}:${variant.name.toLowerCase()}`, variant.images?.[0] || defaultImage)
        }
      })
    })

    // Transform to customer format
    const customer = {
      id: user.id,
      name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown",
      email: user.email,
      phone: user.phone || "",
      company: user.company || "",
      // Combined address for display
      address: [user.address, user.city, user.state, user.postal_code, user.country]
        .filter(Boolean)
        .join(", "),
      // Individual address fields for editing
      street_address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      postal_code: user.postal_code || "",
      country: user.country || "",
      // First/last name for editing
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      orders_count: user.orders.length,
      total_spent: user.orders.reduce((sum, order) => sum + order.total_cents, 0) / 100,
      joined_at: user.created_at.toISOString(),
      last_login: user.last_login?.toISOString() || null,
      status: user.is_active ? "active" : "inactive",
      email_verified: user.email_verified,
      recent_orders: user.orders.slice(0, 5).map((order) => ({
        id: order.id,
        total: order.total_cents / 100,
        status: order.status,
        date: order.created_at.toISOString(),
      })),
      wishlist: user.wishlistItems.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        selected_variant_id: item.selected_variant_id,
        selected_variant_name: item.selected_variant_name,
        product_title: item.product_title,
        product_price: item.product_price / 100,
        product_image: isUsableImageSrc(item.product_image)
          ? item.product_image
          : (item.selected_variant_id ? wishlistVariantImageMap.get(item.selected_variant_id) : null) ||
            (item.selected_variant_name ? wishlistVariantNameImageMap.get(`${item.product_id}:${item.selected_variant_name.toLowerCase()}`) : null) ||
            (item.product_image ? wishlistVariantNameImageMap.get(`${item.product_id}:${item.product_image.toLowerCase()}`) : null) ||
            wishlistImageMap.get(item.product_id) ||
            null,
        added_at: item.added_at.toISOString(),
      })),
      wishlist_count: user.wishlistItems.length,
    }

    return NextResponse.json({
      success: true,
      data: customer,
    })
  } catch (error) {
    console.error("[API] Admin customer GET error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch customer" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/customers/:id - Delete a customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if customer exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, first_name: true, last_name: true },
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      )
    }

    // Delete the user (this will cascade delete related records)
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: `Customer ${existingUser.first_name} ${existingUser.last_name} (${existingUser.email}) has been deleted`,
    })
  } catch (error) {
    console.error("[API] Admin customer DELETE error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete customer" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/customers/:id - Update customer details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { 
      first_name, 
      last_name, 
      phone, 
      company, 
      address, 
      city, 
      state, 
      postal_code, 
      country,
      is_active 
    } = body

    // Build update data
    const updateData: Record<string, unknown> = {}
    
    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name !== undefined) updateData.last_name = last_name
    if (phone !== undefined) updateData.phone = phone
    if (company !== undefined) updateData.company = company
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (postal_code !== undefined) updateData.postal_code = postal_code
    if (country !== undefined) updateData.country = country
    if (is_active !== undefined) updateData.is_active = is_active

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
        is_active: true,
        email_verified: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "Customer updated successfully",
    })
  } catch (error) {
    console.error("[API] Admin customer PATCH error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update customer" },
      { status: 500 }
    )
  }
}
