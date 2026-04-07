import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/auth/admin-session'
import {
  buildLegacyVariants,
  buildProductAggregateFromVariants,
  buildVariantSku,
  normalizeVariantInputs,
  serializeProductForClient,
} from '@/lib/product-variants'

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeRequiredString(value: unknown, fallback = 'General') {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed || fallback
}

function normalizeOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

// GET /api/admin/products - List all products
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminSession()
    if (!auth.ok) {
      return auth.response
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const id = searchParams.get('id') || null
    const type = searchParams.get('type')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // If an id is provided, return the specific product
    if (id) {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          variants: {
            orderBy: {
              sort_order: 'asc',
            },
          },
        },
      })
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      return NextResponse.json(serializeProductForClient(product), {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      })
    }

    // Build filter
    const where: any = {}
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } },
      ]
    }
    if (type) {
      where.type = type
    }

    // Get total count
    const total = await prisma.product.count({ where })

    // Get paginated results
    const products = await prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc',
      },
      include: {
        variants: {
          orderBy: {
            sort_order: 'asc',
          },
        },
      },
    })

    const parsedProducts = products.map((product) => serializeProductForClient(product))

    return NextResponse.json({
      products: parsedProducts,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('GET /api/admin/products error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/admin/products - Create new product
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminSession()
    if (!auth.ok) {
      return auth.response
    }

    const body = await req.json()
    const normalizedVariants = normalizeVariantInputs(body.variants, body.title || "")
    const normalizedPrice = normalizeOptionalNumber(body.price)
    const normalizedDiscount = normalizeOptionalNumber(body.discount ?? body.discount_percent)
    const normalizedMoq = normalizeOptionalNumber(body.moq)
    const normalizedLeadTime = normalizeOptionalNumber(body.lead_time_days)
    const variantsToPersist = normalizedVariants.length > 0
      ? normalizedVariants
      : buildLegacyVariants({
          id: "",
          title: body.title?.trim() || "Product",
          sku: body.sku || null,
          images: body.images ? JSON.stringify(body.images) : body.photos ? JSON.stringify(body.photos) : null,
          colors: body.colors ? JSON.stringify(body.colors) : null,
          in_stock: body.in_stock !== undefined ? Number(body.in_stock) : 0,
          is_available: body.is_available !== false,
        })

    const aggregate = buildProductAggregateFromVariants(
      variantsToPersist.map((variant) => ({
        ...variant,
        sku: buildVariantSku(body.title?.trim() || "Product", variant.name, variant.sku),
      }))
    )

    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        title: body.title.trim(),
        description: normalizeOptionalString(body.description),
        type: normalizeRequiredString(body.type, 'General'),
        material: normalizeOptionalString(body.material),
        price_cents: Math.round((normalizedPrice || 0) * 100),
        discount_percent: normalizedDiscount ?? 0,
        moq: normalizedMoq,
        lead_time_days: normalizedLeadTime,
        sizes: body.sizes ? JSON.stringify(body.sizes) : null,
        colors: JSON.stringify(aggregate.colorNames),
        care_instructions: normalizeOptionalString(body.care_instructions),
        images: JSON.stringify(aggregate.images),
        is_available: aggregate.isAvailable,
        in_stock: aggregate.totalStock,
        sku: normalizeOptionalString(body.sku),
        variants: {
          create: aggregate.normalizedVariants.map((variant) => ({
            name: variant.name,
            color_hex: variant.color_hex,
            sku: variant.sku || null,
            images: JSON.stringify(variant.images),
            is_available: variant.is_available,
            in_stock: variant.in_stock,
            sort_order: variant.sort_order,
          })),
        },
      },
      include: {
        variants: {
          orderBy: {
            sort_order: 'asc',
          },
        },
      },
    })

    return NextResponse.json(serializeProductForClient(product), { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/products error:', error)
    
    // Check for unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { error: 'A product with this title already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/products - Update product
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdminSession()
    if (!auth.ok) {
      return auth.response
    }

    const body = await req.json()
    const { id } = body
    const normalizedVariants = normalizeVariantInputs(body.variants, body.title || "")
    const normalizedPrice = normalizeOptionalNumber(body.price)
    const normalizedDiscount = normalizeOptionalNumber(body.discount ?? body.discount_percent)
    const normalizedMoq = normalizeOptionalNumber(body.moq)
    const normalizedLeadTime = normalizeOptionalNumber(body.lead_time_days)

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: {
            sort_order: 'asc',
          },
        },
      },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const variantsToPersist = normalizedVariants.length > 0
      ? normalizedVariants
      : buildLegacyVariants({
          id: existingProduct.id,
          title: body.title?.trim() || existingProduct.title,
          sku: body.sku ?? existingProduct.sku,
          images: body.images ? JSON.stringify(body.images) : body.photos ? JSON.stringify(body.photos) : existingProduct.images,
          colors: body.colors ? JSON.stringify(body.colors) : existingProduct.colors,
          in_stock: body.in_stock !== undefined ? Number(body.in_stock) : existingProduct.in_stock,
          is_available: body.is_available !== undefined ? body.is_available : existingProduct.is_available,
        })

    const aggregate = buildProductAggregateFromVariants(
      variantsToPersist.map((variant) => ({
        ...variant,
        sku: buildVariantSku(body.title?.trim() || existingProduct.title, variant.name, variant.sku),
      }))
    )

    const product = await prisma.$transaction(async (tx) => {
      await tx.productColorVariant.deleteMany({
        where: { product_id: id },
      })

      return tx.product.update({
        where: { id },
        data: {
          title: normalizeRequiredString(body.title, existingProduct.title),
          description: normalizeOptionalString(body.description),
          type: normalizeRequiredString(body.type, existingProduct.type),
          material: normalizeOptionalString(body.material),
          price_cents: normalizedPrice !== null ? Math.round(normalizedPrice * 100) : existingProduct.price_cents,
          discount_percent: normalizedDiscount,
          moq: normalizedMoq,
          lead_time_days: normalizedLeadTime,
          sizes: body.sizes ? JSON.stringify(body.sizes) : null,
          colors: JSON.stringify(aggregate.colorNames),
          care_instructions: normalizeOptionalString(body.care_instructions),
          images: JSON.stringify(aggregate.images),
          is_available: aggregate.isAvailable,
          in_stock: aggregate.totalStock,
          sku: normalizeOptionalString(body.sku),
          variants: {
            create: aggregate.normalizedVariants.map((variant) => ({
              name: variant.name,
              color_hex: variant.color_hex,
              sku: variant.sku || null,
              images: JSON.stringify(variant.images),
              is_available: variant.is_available,
              in_stock: variant.in_stock,
              sort_order: variant.sort_order,
            })),
          },
        },
        include: {
          variants: {
            orderBy: {
              sort_order: 'asc',
            },
          },
        },
      })
    })

    return NextResponse.json(serializeProductForClient(product))
  } catch (error) {
    console.error('PUT /api/admin/products error:', error)
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { error: 'A product or variant SKU is already in use', details: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products - Delete product
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdminSession()
    if (!auth.ok) {
      return auth.response
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/products error:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
