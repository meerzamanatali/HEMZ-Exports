import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getSessionUserId } from "@/lib/auth/session"
import { serializeProductForClient } from "@/lib/product-variants"

async function getUserFromSession() {
  const cookieStore = await cookies()
  const userId = getSessionUserId(cookieStore)

  if (!userId) {
    return null
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, is_active: true },
    })

    if (!user || !user.is_active) {
      return null
    }

    return userId
  } catch {
    return null
  }
}

function isUsableImageSrc(value?: string | null) {
  return Boolean(value && /^(\/|https?:\/\/|data:image)/i.test(value))
}

async function getWishlistImageMap(productIds: string[]) {
  if (productIds.length === 0) {
    return {
      productImageMap: new Map<string, string | null>(),
      variantImageMap: new Map<string, string | null>(),
      variantNameImageMap: new Map<string, string | null>(),
    }
  }

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
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

  const productImageMap = new Map<string, string | null>()
  const variantImageMap = new Map<string, string | null>()
  const variantNameImageMap = new Map<string, string | null>()

  products.forEach((product) => {
    const normalizedProduct = serializeProductForClient(product as any)
    const defaultImage = normalizedProduct.default_variant?.images?.[0] || normalizedProduct.images?.[0] || null
    productImageMap.set(product.id, defaultImage)

    normalizedProduct.variants?.forEach((variant) => {
      if (variant.id) {
        variantImageMap.set(variant.id, variant.images?.[0] || defaultImage)
      }
      if (variant.name) {
        variantNameImageMap.set(`${product.id}:${variant.name.toLowerCase()}`, variant.images?.[0] || defaultImage)
      }
    })
  })

  return { productImageMap, variantImageMap, variantNameImageMap }
}

export async function GET() {
  try {
    const userId = await getUserFromSession()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated", items: [] },
        { status: 401 }
      )
    }

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { user_id: userId },
      orderBy: { added_at: "desc" },
    })
    const { productImageMap, variantImageMap, variantNameImageMap } = await getWishlistImageMap(wishlistItems.map((item) => item.product_id))

    return NextResponse.json({
      success: true,
      items: wishlistItems.map((item) => ({
        id: item.product_id,
        title: item.product_title,
        price: item.product_price,
        image: isUsableImageSrc(item.product_image)
          ? item.product_image
          : (item.selected_variant_id ? variantImageMap.get(item.selected_variant_id) : null) ||
            (item.selected_variant_name ? variantNameImageMap.get(`${item.product_id}:${item.selected_variant_name.toLowerCase()}`) : null) ||
            (item.product_image ? variantNameImageMap.get(`${item.product_id}:${item.product_image.toLowerCase()}`) : null) ||
            productImageMap.get(item.product_id) ||
            null,
        selected_variant_id: item.selected_variant_id,
        selected_variant_name: item.selected_variant_name,
        added_at: item.added_at.toISOString(),
      })),
    })
  } catch (error) {
    console.error("[API] Wishlist GET error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch wishlist", items: [] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromSession()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { productId, title, price, image, selectedVariantId, selectedVariantName } = await request.json()

    if (!productId || !title) {
      return NextResponse.json(
        { success: false, error: "Product ID and title are required" },
        { status: 400 }
      )
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: productId,
        },
      },
    })

    if (existing) {
      await prisma.wishlistItem.update({
        where: { id: existing.id },
        data: {
          product_title: title,
          product_price: Math.round(price || 0),
          product_image: image || null,
          selected_variant_id: selectedVariantId || null,
          selected_variant_name: selectedVariantName || null,
        },
      })

      return NextResponse.json({
        success: true,
        message: "Wishlist item updated",
      })
    }

    const priceInCents = Math.round(price || 0)

    await prisma.wishlistItem.create({
      data: {
        user_id: userId,
        product_id: productId,
        selected_variant_id: selectedVariantId || null,
        selected_variant_name: selectedVariantName || null,
        product_title: title,
        product_price: priceInCents,
        product_image: image || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Item added to wishlist",
    })
  } catch (error) {
    console.error("[API] Wishlist POST error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to add to wishlist" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserFromSession()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      )
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        user_id: userId,
        product_id: productId,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Item removed from wishlist",
    })
  } catch (error) {
    console.error("[API] Wishlist DELETE error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to remove from wishlist" },
      { status: 500 }
    )
  }
}
