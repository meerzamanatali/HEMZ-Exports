"use client"

import React, { useEffect, useState } from "react"
import InventoryTable from "@/components/admin/inventory-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

type InventoryItem = {
  id: string
  product?: {
    id: string
    title: string
    sku?: string
  }
  warehouse: string
  on_hand: number
  reserved?: number
  reorder_point?: number
  reorder_qty?: number
}

type ProductOption = {
  id: string
  title: string
  sku?: string
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState({
    product_id: "",
    warehouse: "Main Warehouse",
    on_hand: "0",
    reorder_point: "10",
    reorder_qty: "100",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchInventory()
    fetchProducts()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/inventory")
      const data = await res.json()
      setItems(data.items || [])
    } catch (error) {
      console.error("Failed to fetch inventory:", error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products?limit=100")
      const data = await res.json()
      setProducts(Array.isArray(data.products) ? data.products : [])
    } catch (error) {
      console.error("Failed to fetch products:", error)
      setProducts([])
    }
  }

  const handleCreateInventory = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.product_id || !form.warehouse.trim()) {
      toast({
        title: "Missing details",
        description: "Select a product and warehouse before saving.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreating(true)
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: form.product_id,
          warehouse: form.warehouse.trim(),
          on_hand: Number(form.on_hand) || 0,
          reorder_point: Number(form.reorder_point) || 0,
          reorder_qty: Number(form.reorder_qty) || 0,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || "Failed to create inventory item")
      }

      toast({
        title: "Inventory item created",
        description: "You can now manage this stock entry from the table.",
      })

      setForm((prev) => ({
        ...prev,
        product_id: "",
        on_hand: "0",
        reorder_point: "10",
        reorder_qty: "100",
      }))
      await fetchInventory()
    } catch (error) {
      toast({
        title: "Create failed",
        description: error instanceof Error ? error.message : "Failed to create inventory item",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <main className="p-6">
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Manage stock levels and warehouse quantities</p>
        </div>

        <section className="rounded-lg border bg-card p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Create Inventory Item</h2>
            <p className="text-sm text-muted-foreground">
              Add a warehouse stock record for a product so it can be tracked and updated here.
            </p>
          </div>

          <form
            onSubmit={handleCreateInventory}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"
          >
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="product_id">Product</Label>
              <select
                id="product_id"
                value={form.product_id}
                onChange={(e) => setForm((prev) => ({ ...prev, product_id: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                disabled={isCreating}
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title}{product.sku ? ` (${product.sku})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse">Warehouse</Label>
              <Input
                id="warehouse"
                value={form.warehouse}
                onChange={(e) => setForm((prev) => ({ ...prev, warehouse: e.target.value }))}
                disabled={isCreating}
                placeholder="Main Warehouse"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="on_hand">On Hand</Label>
              <Input
                id="on_hand"
                type="number"
                min="0"
                value={form.on_hand}
                onChange={(e) => setForm((prev) => ({ ...prev, on_hand: e.target.value }))}
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_point">Reorder Point</Label>
              <Input
                id="reorder_point"
                type="number"
                min="0"
                value={form.reorder_point}
                onChange={(e) => setForm((prev) => ({ ...prev, reorder_point: e.target.value }))}
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_qty">Reorder Qty</Label>
              <Input
                id="reorder_qty"
                type="number"
                min="0"
                value={form.reorder_qty}
                onChange={(e) => setForm((prev) => ({ ...prev, reorder_qty: e.target.value }))}
                disabled={isCreating}
              />
            </div>

            <div className="md:col-span-2 xl:col-span-5">
              <Button type="submit" disabled={isCreating || products.length === 0}>
                {isCreating ? "Creating..." : "Add Inventory Item"}
              </Button>
            </div>
          </form>
        </section>

        <InventoryTable initialItems={items} loading={loading} onRefresh={fetchInventory} />
      </div>
    </main>
  )
}
