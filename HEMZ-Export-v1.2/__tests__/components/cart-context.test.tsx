"use client"

// Unit tests for cart context

import { render, screen, fireEvent } from "@testing-library/react"
import { CartProvider, useCart } from "@/lib/contexts/cart-context"

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

// Test component that uses cart context
function TestComponent() {
  const { items, addItem, removeItem, updateQuantity, getTotalItems, getTotalPrice, clearCart } = useCart()

  return (
    <div>
      <div data-testid="total-items">{getTotalItems()}</div>
      <div data-testid="total-price">{getTotalPrice()}</div>
      <button
        onClick={() =>
          addItem({
            variant_id: "TEST-001",
            price_cents: 1000,
            product_title: "Test Product",
            variant_sku: "TEST-001",
            variant_attributes: { color: "red" },
          })
        }
      >
        Add Item
      </button>
      <button onClick={() => removeItem("TEST-001")}>Remove Item</button>
      <button onClick={() => updateQuantity("TEST-001", 2)}>Update Quantity</button>
      <button onClick={clearCart}>Clear Cart</button>
      {items.map((item) => (
        <div key={item.variant_id} data-testid={`item-${item.variant_id}`}>
          {item.product_title} - Qty: {item.quantity}
        </div>
      ))}
    </div>
  )
}

describe("CartContext", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it("should add item to cart", () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    )

    expect(screen.getByTestId("total-items")).toHaveTextContent("0")

    fireEvent.click(screen.getByText("Add Item"))

    expect(screen.getByTestId("total-items")).toHaveTextContent("1")
    expect(screen.getByTestId("total-price")).toHaveTextContent("1000")
    expect(screen.getByTestId("item-TEST-001")).toHaveTextContent("Test Product - Qty: 1")
  })

  it("should update item quantity", () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    )

    fireEvent.click(screen.getByText("Add Item"))
    fireEvent.click(screen.getByText("Update Quantity"))

    expect(screen.getByTestId("total-items")).toHaveTextContent("2")
    expect(screen.getByTestId("total-price")).toHaveTextContent("2000")
    expect(screen.getByTestId("item-TEST-001")).toHaveTextContent("Test Product - Qty: 2")
  })

  it("should remove item from cart", () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    )

    fireEvent.click(screen.getByText("Add Item"))
    expect(screen.getByTestId("total-items")).toHaveTextContent("1")

    fireEvent.click(screen.getByText("Remove Item"))
    expect(screen.getByTestId("total-items")).toHaveTextContent("0")
  })

  it("should clear entire cart", () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    )

    fireEvent.click(screen.getByText("Add Item"))
    expect(screen.getByTestId("total-items")).toHaveTextContent("1")

    fireEvent.click(screen.getByText("Clear Cart"))
    expect(screen.getByTestId("total-items")).toHaveTextContent("0")
  })

  it("should persist cart to localStorage", () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    )

    fireEvent.click(screen.getByText("Add Item"))

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "hemz-cart",
      JSON.stringify([
        {
          variant_id: "TEST-001",
          quantity: 1,
          price_cents: 1000,
          product_title: "Test Product",
          variant_sku: "TEST-001",
          variant_attributes: { color: "red" },
        },
      ]),
    )
  })
})
