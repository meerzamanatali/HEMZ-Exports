// Unit tests for utility functions

import { formatPrice, generateOrderNumber, calculateShipping, calculateTax, slugify } from "@/lib/utils"

describe("Utility Functions", () => {
  describe("formatPrice", () => {
    it("should format cents to USD currency", () => {
      expect(formatPrice(9999)).toBe("$99.99")
      expect(formatPrice(1000)).toBe("$10.00")
      expect(formatPrice(50)).toBe("$0.50")
    })

    it("should handle different currencies", () => {
      expect(formatPrice(9999, "EUR")).toBe("€99.99")
      expect(formatPrice(9999, "GBP")).toBe("£99.99")
    })

    it("should handle zero and negative values", () => {
      expect(formatPrice(0)).toBe("$0.00")
      expect(formatPrice(-1000)).toBe("-$10.00")
    })
  })

  describe("generateOrderNumber", () => {
    it("should generate unique order numbers", () => {
      const order1 = generateOrderNumber()
      const order2 = generateOrderNumber()

      expect(order1).toMatch(/^HEMZ-[A-Z0-9]+-[A-Z0-9]+$/)
      expect(order2).toMatch(/^HEMZ-[A-Z0-9]+-[A-Z0-9]+$/)
      expect(order1).not.toBe(order2)
    })

    it("should always start with HEMZ-", () => {
      const orderNumber = generateOrderNumber()
      expect(orderNumber).toMatch(/^HEMZ-/)
    })
  })

  describe("calculateShipping", () => {
    it("should calculate shipping based on weight", () => {
      expect(calculateShipping(500)).toBe(1900) // 1500 base + 400 for 0.5kg
      expect(calculateShipping(1000)).toBe(2300) // 1500 base + 800 for 1kg
      expect(calculateShipping(2500)).toBe(3500) // 1500 base + 2000 for 2.5kg
    })

    it("should handle zero weight", () => {
      expect(calculateShipping(0)).toBe(1500) // Just base rate
    })
  })

  describe("calculateTax", () => {
    it("should calculate tax for different countries", () => {
      expect(calculateTax(10000, "US")).toBe(875) // 8.75%
      expect(calculateTax(10000, "IN")).toBe(1800) // 18%
      expect(calculateTax(10000, "GB")).toBe(2000) // 20%
    })

    it("should return 0 for unknown countries", () => {
      expect(calculateTax(10000, "XX")).toBe(0)
    })

    it("should handle zero subtotal", () => {
      expect(calculateTax(0, "US")).toBe(0)
    })
  })

  describe("slugify", () => {
    it("should convert text to URL-friendly slug", () => {
      expect(slugify("Kashmiri Cashmere Shawl")).toBe("kashmiri-cashmere-shawl")
      expect(slugify("Premium Pashmina - Ivory")).toBe("premium-pashmina-ivory")
      expect(slugify("Test & Special Characters!")).toBe("test-special-characters")
    })

    it("should handle empty strings", () => {
      expect(slugify("")).toBe("")
    })

    it("should remove leading and trailing hyphens", () => {
      expect(slugify("---test---")).toBe("test")
    })
  })
})
