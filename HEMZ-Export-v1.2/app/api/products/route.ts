import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { serializeProductForClient } from '@/lib/product-variants'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    const where: any = { is_available: true }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const total = await prisma.product.count({ where })
    const products = await prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        variants: {
          orderBy: {
            sort_order: 'asc',
          },
        },
      },
    })

    const parsed = products.map((product) => serializeProductForClient(product))

    // Get filter metadata from ALL available products (not just current page)
    const allProducts = await prisma.product.findMany({
      where: { is_available: true },
      select: {
        id: true,
        title: true,
        price_cents: true,
        images: true,
        colors: true,
        sizes: true,
        is_available: true,
        in_stock: true,
        material: true,
        type: true,
        sku: true,
        variants: {
          select: {
            id: true,
            name: true,
            color_hex: true,
            sku: true,
            images: true,
            is_available: true,
            in_stock: true,
            sort_order: true,
            created_at: true,
            updated_at: true,
            product_id: true,
          },
          orderBy: {
            sort_order: 'asc',
          },
        },
      },
    })

    // Calculate max price
    const maxPrice = Math.ceil(
      Math.max(...allProducts.map((p) => p.price_cents / 100), 0)
    )

    // Extract unique colors from all products
    const allColors = new Set<string>()
    allProducts.forEach((product) => {
      serializeProductForClient(product as any).colors.forEach((color: string) => allColors.add(color))
    })

    // Extract unique materials from all products
    const allMaterials = new Set<string>()
    allProducts.forEach((p) => {
      if (p.material) {
        allMaterials.add(p.material)
      }
    })

    // Extract unique types from all products
    const allTypes = new Set<string>()
    allProducts.forEach((p) => {
      if (p.type) {
        allTypes.add(p.type)
      }
    })

    const filterOptions = {
      maxPrice: maxPrice || 1000,
      colors: Array.from(allColors).sort(),
      materials: Array.from(allMaterials).sort(),
      types: Array.from(allTypes).sort(),
    }

    return NextResponse.json({ 
      products: parsed, 
      total, 
      page, 
      pages: Math.ceil(total / limit),
      filterOptions,
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error('GET /api/products error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
