import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/quotes - List all quotes
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build filter
    const where: any = {}
    if (search) {
      where.OR = [
        { full_name: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } },
        { quote_number: { contains: search } },
      ]
    }
    if (status) {
      where.status = status
    }

    // Get total count
    const total = await prisma.quote.count({ where })

    // Get paginated results
    const quotes = await prisma.quote.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: true,
        product: {
          select: {
            id: true,
            title: true,
            sku: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc',
      },
    })

    return NextResponse.json({
      quotes,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/admin/quotes error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    )
  }
}

// POST /api/admin/quotes - Create new quote
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      full_name,
      company,
      country,
      email,
      phone,
      product_id,
      quantity,
      preferred_delivery,
      message,
      source,
    } = body

    if (!full_name || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
        { status: 400 }
      )
    }

    // Generate quote number
    const lastQuote = await prisma.quote.findFirst({
      orderBy: { created_at: 'desc' },
      select: { quote_number: true },
    })

    let quoteNumber = 'Q-0001'
    if (lastQuote && lastQuote.quote_number) {
      const lastNum = parseInt(lastQuote.quote_number.split('-')[1])
      quoteNumber = `Q-${String(lastNum + 1).padStart(4, '0')}`
    }

    // Find or create customer
    let customer_id = null
    const existingCustomer = await prisma.customer.findUnique({
      where: { email },
    })

    if (existingCustomer) {
      customer_id = existingCustomer.id
    } else if (full_name) {
      // Create new customer
      const newCustomer = await prisma.customer.create({
        data: {
          full_name,
          email,
          phone: phone || '',
          company: company || '',
          country: country || '',
        },
      })
      customer_id = newCustomer.id
    }

    const quote = await prisma.quote.create({
      data: {
        quote_number: quoteNumber,
        full_name,
        email,
        phone: phone || '',
        company: company || '',
        country: country || '',
        product_id: product_id || null,
        quantity: quantity || '',
        preferred_delivery: preferred_delivery || '',
        message: message || '',
        source: source || 'website',
        status: 'new',
        customer_id,
      },
      include: {
        customer: true,
        product: {
          select: {
            id: true,
            title: true,
            sku: true,
          },
        },
      },
    })

    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/quotes error:', error)
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/quotes - Update quote status or details
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, quoted_price_cents, quoted_at } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      )
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: {
        status: status || undefined,
        quoted_price_cents: quoted_price_cents || undefined,
        quoted_at: quoted_at ? new Date(quoted_at) : undefined,
      },
      include: {
        customer: true,
        product: {
          select: {
            id: true,
            title: true,
            sku: true,
          },
        },
      },
    })

    return NextResponse.json(quote)
  } catch (error) {
    console.error('PUT /api/admin/quotes error:', error)
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/quotes - Delete quote
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      )
    }

    await prisma.quote.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/quotes error:', error)
    return NextResponse.json(
      { error: 'Failed to delete quote' },
      { status: 500 }
    )
  }
}
