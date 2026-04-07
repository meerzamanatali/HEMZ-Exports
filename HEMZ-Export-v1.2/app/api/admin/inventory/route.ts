import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/inventory - List all inventory items
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
    const warehouse = searchParams.get('warehouse')

    // Build filter
    const where: any = {}
    if (search) {
      where.product = {
        OR: [
          { title: { contains: search } },
          { sku: { contains: search } },
        ],
      }
    }
    if (warehouse) {
      where.warehouse = warehouse
    }

    // Get total count
    const total = await prisma.inventoryItem.count({ where })

    // Get paginated results with product info
    const items = await prisma.inventoryItem.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        product: {
          select: {
            id: true,
            title: true,
            sku: true,
            type: true,
          },
        },
      },
      orderBy: { updated_at: 'desc' },
    })

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/admin/inventory error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory items' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/inventory - Adjust inventory quantity
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdminSession()
    if (!auth.ok) {
      return auth.response
    }

    const body = await req.json()
    const { id, on_hand, reason, changed_by } = body

    if (!id || typeof on_hand !== 'number') {
      return NextResponse.json(
        { error: 'Inventory ID and on_hand quantity are required' },
        { status: 400 }
      )
    }

    // Get current inventory item
    const currentItem = await prisma.inventoryItem.findUnique({
      where: { id },
    })

    if (!currentItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    // Update inventory and create audit entry
    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: {
        on_hand,
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            sku: true,
          },
        },
        audit: true,
      },
    })

    // Create audit trail entry
    await prisma.inventoryAudit.create({
      data: {
        inventory_id: id,
        reason: reason || 'adjust',
        from_qty: currentItem.on_hand,
        to_qty: on_hand,
        changed_by: changed_by || 'admin',
      },
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('PATCH /api/admin/inventory error:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    )
  }
}

// POST /api/admin/inventory - Create inventory item
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminSession()
    if (!auth.ok) {
      return auth.response
    }

    const body = await req.json()
    const { product_id, warehouse, on_hand, reorder_point, reorder_qty } = body

    if (!product_id || !warehouse) {
      return NextResponse.json(
        { error: 'Product ID and warehouse are required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: product_id },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if inventory item already exists
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        product_id,
        warehouse,
      },
    })

    if (existingItem) {
      return NextResponse.json(
        { error: 'Inventory item already exists for this product and warehouse' },
        { status: 400 }
      )
    }

    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        product_id,
        warehouse,
        on_hand: on_hand || 0,
        reorder_point: reorder_point || 10,
        reorder_qty: reorder_qty || 100,
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            sku: true,
          },
        },
      },
    })

    return NextResponse.json(inventoryItem, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/inventory error:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/inventory - Delete inventory item
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
        { error: 'Inventory ID is required' },
        { status: 400 }
      )
    }

    await prisma.inventoryItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/inventory error:', error)
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    )
  }
}
