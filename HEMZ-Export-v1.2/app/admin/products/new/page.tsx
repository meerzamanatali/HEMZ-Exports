"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProductForm } from "@/components/admin/product-form"
import { useToast } from "@/hooks/use-toast"

export default function NewProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          type: data.type,
          material: data.material,
          sku: data.sku,
          price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
          discount: typeof data.discount === 'string' ? parseInt(data.discount, 10) : data.discount,
          description: data.description,
          care_instructions: data.care_instructions,
          moq: data.moq ? parseInt(String(data.moq), 10) : undefined,
          lead_time_days: data.lead_time_days ? parseInt(String(data.lead_time_days), 10) : undefined,
          sizes: Array.isArray(data.sizes) ? data.sizes : [],
          variants: Array.isArray(data.variants) ? data.variants : [],
          is_available: data.is_available,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to create product')
      }

      toast({
        title: "Success",
        description: "Product created successfully!",
      })

      router.push("/admin/products")
      router.refresh()
      return
    } catch (error) {
      console.error('Product creation error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Add Product</h1>
          <p className="text-muted-foreground">Create a new product</p>
        </div>
        <Link href="/admin/products">
          <Button variant="outline">Back to Products</Button>
        </Link>
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Create Product"
      />
    </div>
  )
}
