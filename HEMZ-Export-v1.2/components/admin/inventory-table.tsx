"use client"

import React from "react"
import { useToast } from "@/hooks/use-toast"
import { Loader } from "lucide-react"

type InventoryItem = {
  id: string
  product?: {
    id: string
    title: string
    sku?: string
    type?: string
  }
  warehouse: string
  on_hand: number
  reserved?: number
  reorder_point?: number
  reorder_qty?: number
}

interface InventoryTableProps {
  initialItems: InventoryItem[]
  loading?: boolean
  onRefresh?: () => void
}

export default function InventoryTable({
  initialItems,
  loading,
  onRefresh,
}: InventoryTableProps) {
  const [items, setItems] = React.useState<InventoryItem[]>(initialItems || [])
  const [q, setQ] = React.useState("")
  const [editing, setEditing] = React.useState<Record<string, boolean>>({})
  const [temp, setTemp] = React.useState<Record<string, number>>({})
  const [localLoading, setLocalLoading] = React.useState(loading ?? false)
  const { toast } = useToast()

  React.useEffect(() => {
    setItems(initialItems || [])
  }, [initialItems])

  React.useEffect(() => {
    setLocalLoading(loading ?? false)
  }, [loading])

  const filtered = items.filter((i) => {
    const q_lower = q.toLowerCase()
    return (
      (i.product?.title || "").toLowerCase().includes(q_lower) ||
      (i.product?.sku || "").toLowerCase().includes(q_lower) ||
      (i.warehouse || "").toLowerCase().includes(q_lower)
    )
  })

  const startEdit = (id: string) => {
    setEditing((s) => ({ ...s, [id]: true }))
    const it = items.find((x) => x.id === id)
    setTemp((t) => ({ ...t, [id]: it ? it.on_hand : 0 }))
  }

  const cancelEdit = (id: string) => {
    setEditing((s) => ({ ...s, [id]: false }))
    setTemp((t) => {
      const copy = { ...t }
      delete copy[id]
      return copy
    })
  }

  const saveEdit = async (id: string) => {
    const newVal = Number(temp[id])
    const prev = items.find((i) => i.id === id)
    if (!prev) return
    if (isNaN(newVal) || newVal < 0) {
      toast({ title: "Invalid quantity" })
      return
    }

    // optimistic UI
    const oldItems = items
    setItems((s) => s.map((it) => (it.id === id ? { ...it, on_hand: newVal } : it)))
    setEditing((s) => ({ ...s, [id]: false }))

    try {
      setLocalLoading(true)
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          on_hand: newVal,
          reason: "manual_adjust",
          changed_by: "admin",
        }),
      })

      if (!res.ok) throw new Error("Failed")

      const updated = await res.json()
      toast({ title: "Inventory updated" })

      // ensure consistency
      setItems((s) =>
        s.map((it) => (it.id === id ? { ...it, on_hand: updated.on_hand } : it))
      )
    } catch (e) {
      // rollback on error
      setItems(oldItems)
      setEditing((s) => ({ ...s, [id]: true }))
      toast({ title: "Update failed", variant: "destructive" })
    } finally {
      setLocalLoading(false)
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by product name, SKU, or warehouse..."
          className="border px-3 py-2 rounded flex-1"
        />
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={localLoading}
            className="px-3 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {localLoading ? <Loader className="h-4 w-4 animate-spin" /> : "Refresh"}
          </button>
        )}
      </div>

      {loading || localLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No inventory items found yet. Create one below to start managing stock.
        </div>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted">
              <th className="p-2 text-left">Product</th>
              <th className="p-2 text-left">SKU</th>
              <th className="p-2 text-left">Warehouse</th>
              <th className="p-2 text-right">On Hand</th>
              <th className="p-2 text-right">Reserved</th>
              <th className="p-2 text-right">Reorder Point</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b hover:bg-muted/50">
                <td className="p-2 font-medium">{item.product?.title || "Unknown"}</td>
                <td className="p-2 text-xs">{item.product?.sku || "-"}</td>
                <td className="p-2">{item.warehouse}</td>
                <td className="p-2 text-right">
                  {editing[item.id] ? (
                    <input
                      type="number"
                      min="0"
                      value={temp[item.id] ?? item.on_hand}
                      onChange={(e) =>
                        setTemp((t) => ({ ...t, [item.id]: Number(e.target.value) }))
                      }
                      className="w-16 border px-2 py-1 rounded text-right"
                      autoFocus
                    />
                  ) : (
                    item.on_hand
                  )}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {item.reserved || 0}
                </td>
                <td className="p-2 text-right text-sm text-orange-600">
                  {item.reorder_point || "-"}
                </td>
                <td className="p-2 text-center">
                  {editing[item.id] ? (
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => saveEdit(item.id)}
                        className="px-2 py-1 rounded bg-green-500 text-white text-xs hover:bg-green-600"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => cancelEdit(item.id)}
                        className="px-2 py-1 rounded bg-gray-400 text-white text-xs hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(item.id)}
                      className="px-2 py-1 rounded bg-blue-500 text-white text-xs hover:bg-blue-600"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
