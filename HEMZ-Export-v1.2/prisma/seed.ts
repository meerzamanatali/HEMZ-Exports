import { prisma } from '../lib/prisma'
import fs from 'fs'
import path from 'path'

async function seed() {
  console.log('Starting database seed...')

  try {
    // Read JSON data files
    const productsRaw = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/products.json'), 'utf-8')
    )
    const customersRaw = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/customers.json'), 'utf-8')
    )
    const couponsRaw = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/coupons.json'), 'utf-8')
    )

    const productsData = productsRaw.products || productsRaw
    const customersData = customersRaw.customers || customersRaw
    const couponsData = couponsRaw.coupons || couponsRaw

    // Seed Products
    console.log('Seeding products...')
    for (const product of productsData) {
      await prisma.product.create({
        data: {
          title: product.title || 'Untitled Product',
          description: product.description,
          type: product.type,
          material: product.material,
          price_cents: Math.round((product.price || 0) * 100),
          discount_percent: product.discount_percent,
          moq: product.moq,
          lead_time_days: product.lead_time_days,
          sizes: product.sizes ? JSON.stringify(product.sizes) : null,
          colors: product.colors ? JSON.stringify(product.colors) : null,
          care_instructions: product.care_instructions,
          images: product.images ? JSON.stringify(product.images) : null,
          is_available: product.is_available !== false,
          in_stock: product.in_stock || 0,
          sku: product.sku,
        },
      })
    }
    console.log(`✓ Seeded ${productsData.length} products`)

    // Seed Customers
    console.log('Seeding customers...')
    for (const customer of customersData) {
      await prisma.customer.create({
        data: {
          full_name: customer.full_name || 'Unknown',
          email: customer.email,
          phone: customer.phone,
          company: customer.company,
          country: customer.country,
          city: customer.city,
          postal_code: customer.postal_code,
          address: customer.address,
          payment_terms: customer.payment_terms,
          tax_id: customer.tax_id,
          is_active: customer.is_active !== false,
        },
      })
    }
    console.log(`✓ Seeded ${customersData.length} customers`)

    // Seed Coupons
    console.log('Seeding coupons...')
    for (const coupon of couponsData) {
      try {
        await prisma.coupon.create({
          data: {
            code: coupon.code,
            description: coupon.description || undefined,
            discount_type: coupon.type === 'percent' ? 'percentage' : 'fixed_amount',
            discount_value: coupon.value || 0,
            valid_from: coupon.start_date ? new Date(coupon.start_date) : new Date(),
            valid_until: coupon.end_date ? new Date(coupon.end_date) : new Date(),
            max_uses: coupon.max_uses,
            times_used: coupon.uses || 0,
            min_order_cents: Math.round((coupon.min_order || 0) * 100),
            max_discount_cents: coupon.max_discount
              ? Math.round(coupon.max_discount * 100)
              : null,
            is_active: coupon.active !== false,
          },
        })
      } catch (e) {
        console.log(`Skipped coupon ${coupon.code}:`, (e as Error).message)
      }
    }
    console.log(`✓ Seeded ${couponsData.length} coupons`)

    console.log('✅ Database seed completed successfully')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seed()
