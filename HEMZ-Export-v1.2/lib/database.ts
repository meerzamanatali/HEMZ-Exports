// Database connection and query utilities for HEMZ Pashmina e-commerce
import { Pool } from "pg"

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Database query wrapper with error handling
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log("[DB] Query executed", { text: text.substring(0, 100), duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error("[DB] Query error", { text: text.substring(0, 100), error })
    throw error
  }
}

// Transaction wrapper
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

// Database health check
export async function healthCheck() {
  try {
    const result = await query("SELECT NOW() as current_time")
    return { healthy: true, timestamp: result.rows[0].current_time }
  } catch (error) {
    return { healthy: false, error: error.message }
  }
}

// Product queries
export const productQueries = {
  // Get all products with variants
  async getAllProducts(limit = 50, offset = 0) {
    const result = await query(
      `
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pv.id,
              'sku', pv.sku,
              'attributes', pv.attributes_json,
              'price_cents', COALESCE(pv.price_cents, p.base_price_cents),
              'stock_quantity', pv.stock_quantity,
              'available_quantity', pv.stock_quantity - pv.reserved_quantity
            )
          ) FILTER (WHERE pv.id IS NOT NULL), 
          '[]'
        ) as variants,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'url', pi.url,
              'alt_text', pi.alt_text,
              'sort_order', pi.sort_order
            ) ORDER BY pi.sort_order
          ) FILTER (WHERE pi.id IS NOT NULL), 
          '[]'
        ) as images
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.variant_id IS NULL
      WHERE p.status = 'active'
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `,
      [limit, offset],
    )
    return result.rows
  },

  // Get single product by slug
  async getProductBySlug(slug: string) {
    const result = await query(
      `
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pv.id,
              'sku', pv.sku,
              'attributes', pv.attributes_json,
              'price_cents', COALESCE(pv.price_cents, p.base_price_cents),
              'stock_quantity', pv.stock_quantity,
              'available_quantity', pv.stock_quantity - pv.reserved_quantity
            )
          ) FILTER (WHERE pv.id IS NOT NULL), 
          '[]'
        ) as variants,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'url', pi.url,
              'alt_text', pi.alt_text,
              'sort_order', pi.sort_order
            ) ORDER BY pi.sort_order
          ) FILTER (WHERE pi.id IS NOT NULL), 
          '[]'
        ) as images
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.slug = $1 AND p.status = 'active'
      GROUP BY p.id
    `,
      [slug],
    )
    return result.rows[0] || null
  },

  // Check stock availability
  async checkStock(variantId: number, quantity: number) {
    const result = await query(
      `
      SELECT 
        stock_quantity,
        reserved_quantity,
        (stock_quantity - reserved_quantity) as available_quantity
      FROM product_variants 
      WHERE id = $1
    `,
      [variantId],
    )

    if (!result.rows[0]) return { available: false, reason: "Variant not found" }

    const { available_quantity } = result.rows[0]
    return {
      available: available_quantity >= quantity,
      available_quantity,
      reason: available_quantity < quantity ? "Insufficient stock" : null,
    }
  },
}

// Cart queries
export const cartQueries = {
  // Get or create cart
  async getOrCreateCart(sessionId: string, userId?: number) {
    // First try to get existing cart
    let result = await query(
      `
      SELECT * FROM carts 
      WHERE session_id = $1 AND (user_id = $2 OR user_id IS NULL)
      AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `,
      [sessionId, userId || null],
    )

    if (result.rows[0]) {
      return result.rows[0]
    }

    // Create new cart
    result = await query(
      `
      INSERT INTO carts (session_id, user_id, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '30 days')
      RETURNING *
    `,
      [sessionId, userId || null],
    )

    return result.rows[0]
  },

  // Update cart items
  async updateCartItems(cartId: number, items: any[]) {
    const result = await query(
      `
      UPDATE carts 
      SET items_json = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `,
      [JSON.stringify(items), cartId],
    )
    return result.rows[0]
  },
}

export default pool
