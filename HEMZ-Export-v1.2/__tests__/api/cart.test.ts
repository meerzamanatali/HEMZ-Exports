// Integration tests for cart API

import { POST, GET } from "@/app/api/cart/route"
import { NextRequest } from "next/server"
import jest from "jest"

// Mock database functions
jest.mock("@/lib/database", () => ({
  cartQueries: {
    getOrCreateCart: jest.fn(),
    updateCartItems: jest.fn(),
  },
  productQueries: {
    checkStock: jest.fn(),
  },
}))

describe("/api/cart", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("POST /api/cart", () => {
    it("should add item to cart", async () => {
      const { cartQueries, productQueries } = require("@/lib/database")

      cartQueries.getOrCreateCart.mockResolvedValue({
        id: 1,
        items_json: [],
      })

      productQueries.checkStock.mockResolvedValue({
        available: true,
        available_quantity: 10,
      })

      cartQueries.updateCartItems.mockResolvedValue({
        id: 1,
        items_json: [
          {
            variant_id: 1,
            quantity: 1,
            price_cents: 9500,
            product_title: "Test Product",
            variant_sku: "TEST-001",
            variant_attributes: { color: "red" },
          },
        ],
      })

      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify({
          session_id: "test-session",
          variant_id: 1,
          quantity: 1,
          price_cents: 9500,
          product_title: "Test Product",
          variant_sku: "TEST-001",
          variant_attributes: { color: "red" },
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.items_json).toHaveLength(1)
    })

    it("should return error for insufficient stock", async () => {
      const { cartQueries, productQueries } = require("@/lib/database")

      cartQueries.getOrCreateCart.mockResolvedValue({
        id: 1,
        items_json: [],
      })

      productQueries.checkStock.mockResolvedValue({
        available: false,
        reason: "Insufficient stock",
      })

      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify({
          session_id: "test-session",
          variant_id: 1,
          quantity: 10,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe("Insufficient stock")
    })
  })

  describe("GET /api/cart", () => {
    it("should get cart by session ID", async () => {
      const { cartQueries } = require("@/lib/database")

      cartQueries.getOrCreateCart.mockResolvedValue({
        id: 1,
        session_id: "test-session",
        items_json: [],
      })

      const request = new NextRequest("http://localhost:3000/api/cart?session_id=test-session")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.session_id).toBe("test-session")
    })

    it("should return error for missing session ID", async () => {
      const request = new NextRequest("http://localhost:3000/api/cart")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe("Session ID is required")
    })
  })
})
