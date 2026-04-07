"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProductForm } from "@/components/admin/product-form"
import { useToast } from "@/hooks/use-toast"

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = decodeURIComponent(params.id as string)
  const { toast } = useToast()
  
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
          cache: "no-store",
        })
        const data = await res.json()

        // API returns single product when queried by id
        const found = data && data.id ? data : null

        if (found) {
          // Map API response to form structure
          setProduct({
            id: found.id,
            title: found.title,
            type: found.type,
            material: found.material,
            price: found.price ?? (typeof found.price_cents === "number" ? found.price_cents / 100 : 0),
            discount: found.discount_percent || 0,
            description: found.description,
            care_instructions: found.care_instructions,
            moq: found.moq,
            lead_time_days: found.lead_time_days,
            sizes: found.sizes || [],
            sku: found.sku || "",
            variants: Array.isArray(found.variants) ? found.variants : [],
          })
        } else {
          setLoadError(`No product with id: ${id}`)
        }
      } catch (err) {
        setLoadError(`Failed to load product: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          id,
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
        throw new Error(err?.details || err?.error || 'Failed to update product')
      }

      toast({
        title: "Success",
        description: "Product updated successfully!",
      })

      router.push("/admin/products")
      router.refresh()
      return
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update product'
      setSubmitError(message)
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      })
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-2xl font-bold">Loading product...</h1>
        <p className="text-muted-foreground">Please wait</p>
      </div>
    )
  }

  if (loadError || !product) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-2xl font-bold">Product not found</h1>
        <p className="text-muted-foreground">{loadError || `No product with id: ${id}`}</p>
        <Link href="/admin/products">
          <Button>Back to Products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Edit Product</h1>
          <p className="text-muted-foreground">Update product details for {product.title}</p>
          {submitError ? <p className="mt-2 text-sm text-destructive">{submitError}</p> : null}
        </div>
        <Link href="/admin/products">
          <Button variant="outline">Back to Products</Button>
        </Link>
      </div>

      <ProductForm
        initialData={product}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        submitLabel="Save Changes"
      />
    </div>
  )
}
