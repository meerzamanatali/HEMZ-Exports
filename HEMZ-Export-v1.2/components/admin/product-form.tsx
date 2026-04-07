"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Upload, X } from "lucide-react"

type ProductVariantFormValue = {
  id?: string
  name: string
  color_hex: string
  sku: string
  in_stock: number | string
  is_available: boolean
  images: string[]
}

interface ProductFormProps {
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

function createEmptyVariant(index: number): ProductVariantFormValue {
  return {
    name: "",
    color_hex: "#D4D4D8",
    sku: "",
    in_stock: 0,
    is_available: index === 0,
    images: [],
  }
}

async function uploadImageFiles(files: File[]) {
  const payload = new FormData()
  files.forEach((file) => {
    payload.append("files", file)
  })

  const response = await fetch("/api/admin/uploads/product-images", {
    method: "POST",
    body: payload,
  })

  const result = await response.json().catch(() => null)
  if (!response.ok || !result?.success || !Array.isArray(result.images)) {
    throw new Error(result?.error || "Failed to upload images")
  }

  return result.images as string[]
}

async function dataUrlToFile(dataUrl: string, fileName: string) {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const extension = blob.type.split("/")[1] || "png"
  return new File([blob], `${fileName}.${extension}`, { type: blob.type || "image/png" })
}

function normalizeInitialVariants(initialData?: any): ProductVariantFormValue[] {
  if (Array.isArray(initialData?.variants) && initialData.variants.length > 0) {
    return initialData.variants.map((variant: any, index: number) => ({
      id: typeof variant.id === "string" ? variant.id : undefined,
      name: variant.name || "",
      color_hex: variant.color_hex || "#D4D4D8",
      sku: variant.sku || "",
      in_stock: variant.in_stock ?? 0,
      is_available: Boolean(variant.is_available) && Number(variant.in_stock ?? 0) > 0,
      images: Array.isArray(variant.images)
        ? variant.images
        : Array.isArray(variant.photos)
          ? variant.photos
          : index === 0 && Array.isArray(initialData?.photos)
            ? initialData.photos
            : [],
    }))
  }

  if (Array.isArray(initialData?.photos) && initialData.photos.length > 0) {
    return [
      {
        id: initialData?.id,
        name: Array.isArray(initialData?.colors) && initialData.colors[0] ? initialData.colors[0] : "Default",
        color_hex: "#D4D4D8",
        sku: initialData?.sku || "",
        in_stock: initialData?.in_stock ?? 0,
        is_available: Boolean(initialData?.is_available) && Number(initialData?.in_stock ?? 0) > 0,
        images: initialData.photos,
      },
    ]
  }

  return [createEmptyVariant(0)]
}

export function ProductForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel = "Save Product",
}: ProductFormProps) {
  const [formData, setFormData] = useState({
    id: initialData?.id || "",
    title: initialData?.title || "",
    type: initialData?.type || "",
    material: initialData?.material || "",
    price: initialData?.price || "",
    currency: initialData?.currency || "USD",
    discount: initialData?.discount || 0,
    description: initialData?.description || "",
    care_instructions: initialData?.care_instructions || "",
    moq: initialData?.moq || "",
    lead_time_days: initialData?.lead_time_days || "",
    sizes: Array.isArray(initialData?.sizes) ? initialData.sizes : [],
    sku: initialData?.sku || "",
    variants: normalizeInitialVariants(initialData),
  })

  const [newSize, setNewSize] = useState("")
  const [error, setError] = useState("")
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState<number | null>(null)

  const discountedPrice = formData.price
    ? (parseFloat(String(formData.price)) * (1 - Number(formData.discount || 0) / 100)).toFixed(2)
    : "0.00"

  const inventorySummary = useMemo(() => {
    const totalStock = formData.variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.in_stock || 0)), 0)
    const activeVariants = formData.variants.filter(
      (variant) => variant.name.trim() && variant.is_available && Number(variant.in_stock || 0) > 0
    ).length

    return {
      totalStock,
      activeVariants,
      canPurchase: activeVariants > 0,
    }
  }, [formData.variants])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleVariantChange = (index: number, field: keyof ProductVariantFormValue, value: any) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, variantIndex) => {
        if (variantIndex !== index) {
          return variant
        }

        const nextVariant = {
          ...variant,
          [field]: value,
        }

        if (field === "in_stock") {
          const inStock = Math.max(0, Number(value || 0))
          nextVariant.in_stock = inStock
          if (inStock === 0) {
            nextVariant.is_available = false
          }
        }

        if (field === "is_available" && !value) {
          nextVariant.is_available = false
        }

        return nextVariant
      }),
    }))
  }

  const handleAddSize = () => {
    if (!newSize.trim()) {
      return
    }

    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, newSize.trim()],
    }))
    setNewSize("")
  }

  const handleRemoveSize = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_: string, sizeIndex: number) => sizeIndex !== index),
    }))
  }

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, createEmptyVariant(prev.variants.length)],
    }))
  }

  const removeVariant = (index: number) => {
    setFormData((prev) => {
      const nextVariants = prev.variants.filter((_, variantIndex) => variantIndex !== index)
      return {
        ...prev,
        variants: nextVariants.length > 0 ? nextVariants : [createEmptyVariant(0)],
      }
    })
  }

  const handleVariantImageUpload = async (variantIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) {
      return
    }

    event.target.value = ""

    try {
      setUploadingVariantIndex(variantIndex)
      setError("")
      const uploadedImages = await uploadImageFiles(files)

      setFormData((prev) => ({
        ...prev,
        variants: prev.variants.map((variant, index) =>
          index === variantIndex
            ? {
                ...variant,
                images: [...variant.images, ...uploadedImages],
              }
            : variant
        ),
      }))
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload images")
    } finally {
      setUploadingVariantIndex(null)
    }
  }

  const removeVariantImage = (variantIndex: number, imageIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, index) =>
        index === variantIndex
          ? {
              ...variant,
              images: variant.images.filter((_, currentImageIndex) => currentImageIndex !== imageIndex),
            }
          : variant
      ),
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (!formData.title.trim() || !formData.price) {
      setError("Title and price are required")
      return
    }

    const cleanedVariants = formData.variants
      .map((variant, index) => ({
        ...variant,
        name: variant.name.trim(),
        sku: variant.sku.trim(),
        in_stock: Math.max(0, Number(variant.in_stock || 0)),
        is_available: Boolean(variant.is_available) && Number(variant.in_stock || 0) > 0,
        images: Array.isArray(variant.images) ? variant.images.filter(Boolean) : [],
        sort_order: index,
      }))
      .filter((variant) => variant.name)

    if (cleanedVariants.length === 0) {
      setError("Add at least one color variant")
      return
    }

    if (cleanedVariants.some((variant) => variant.images.length === 0)) {
      setError("Each color variant needs at least one image")
      return
    }

    try {
      const persistedVariants = await Promise.all(
        cleanedVariants.map(async (variant, index) => {
          const inlineImages = variant.images.filter((image) => image.startsWith("data:image"))
          if (inlineImages.length === 0) {
            return variant
          }

          const uploadedImages = await uploadImageFiles(
            await Promise.all(
              inlineImages.map((image, imageIndex) =>
                dataUrlToFile(image, `variant-${index + 1}-${imageIndex + 1}`)
              )
            )
          )

          let uploadedIndex = 0
          return {
            ...variant,
            images: variant.images.map((image) => {
              if (!image.startsWith("data:image")) {
                return image
              }

              const uploadedImage = uploadedImages[uploadedIndex]
              uploadedIndex += 1
              return uploadedImage
            }),
          }
        })
      )

      await onSubmit({
        ...formData,
        discount: Number(formData.discount || 0),
        variants: persistedVariants,
        colors: persistedVariants.map((variant) => variant.name),
        photos: persistedVariants.flatMap((variant) => variant.images),
        in_stock: persistedVariants.reduce((sum, variant) => sum + variant.in_stock, 0),
        is_available: persistedVariants.some((variant) => variant.is_available && variant.in_stock > 0),
      })
    } catch (submitError) {
      setError((submitError as Error).message || "Failed to save product")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <div className="rounded-md bg-red-100 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {initialData ? (
              <div>
                <Label htmlFor="id">System ID</Label>
                <Input id="id" value={formData.id} readOnly disabled />
              </div>
            ) : null}

            <div>
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(event) => handleInputChange("title", event.target.value)}
                placeholder="e.g., Kashmiri Cashmere Shawl"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Product Type</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(event) => handleInputChange("type", event.target.value)}
                placeholder="e.g., Shawl, Scarf, Pashmina"
              />
            </div>

            <div>
              <Label htmlFor="material">Material</Label>
              <Input
                id="material"
                value={formData.material}
                onChange={(event) => handleInputChange("material", event.target.value)}
                placeholder="e.g., 100% Pure Cashmere"
              />
            </div>

            <div>
              <Label htmlFor="sku">Base Product SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(event) => handleInputChange("sku", event.target.value)}
                placeholder="Optional parent SKU"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="price">Price ({formData.currency}) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(event) => handleInputChange("price", event.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                value={formData.discount}
                onChange={(event) => handleInputChange("discount", event.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <Label>Discounted Price</Label>
              <div className="flex h-10 items-center rounded-md border bg-muted px-3">
                <span className="font-medium">
                  {formData.currency} {discountedPrice}
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="moq">Minimum Order Qty (MOQ)</Label>
              <Input
                id="moq"
                type="number"
                value={formData.moq}
                onChange={(event) => handleInputChange("moq", event.target.value)}
                placeholder="25"
              />
            </div>

            <div>
              <Label htmlFor="lead_time_days">Lead Time (days)</Label>
              <Input
                id="lead_time_days"
                type="number"
                value={formData.lead_time_days}
                onChange={(event) => handleInputChange("lead_time_days", event.target.value)}
                placeholder="21"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sizes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newSize}
              onChange={(event) => setNewSize(event.target.value)}
              placeholder="e.g., 70x200 cm"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  handleAddSize()
                }
              }}
            />
            <Button type="button" variant="outline" onClick={handleAddSize}>
              Add Size
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.sizes.map((size: string, index: number) => (
              <Badge key={`${size}-${index}`} variant="secondary" className="gap-1">
                {size}
                <button type="button" onClick={() => handleRemoveSize(index)} aria-label={`Remove ${size}`}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Color Variants</CardTitle>
            <p className="text-sm text-muted-foreground">
              Each color keeps its own stock, SKU, and unlimited image gallery.
            </p>
          </div>
          <Button type="button" onClick={addVariant}>
            <Plus className="mr-2 h-4 w-4" />
            Add Color
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            Storefront status:
            {" "}
            <span className="font-medium text-foreground">
              {inventorySummary.canPurchase ? "Purchasable" : "Not purchasable"}
            </span>
            {" "}
            across {inventorySummary.activeVariants} active color variants with {inventorySummary.totalStock} total units in stock.
          </div>

          {formData.variants.map((variant, variantIndex) => {
            const isLightColor = /^#(?:F{6}|f{6}|FFF|fff)$/.test(variant.color_hex)
            const hasImages = variant.images.length > 0

            return (
              <div key={`${variant.id || "new"}-${variantIndex}`} className="rounded-xl border p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-md border-2 ${isLightColor ? "border-slate-400" : "border-slate-200"}`}
                      style={{ backgroundColor: variant.color_hex || "#D4D4D8" }}
                    />
                    <div>
                      <p className="font-medium">{variant.name || `Color ${variantIndex + 1}`}</p>
                      <p className="text-sm text-muted-foreground">
                        {Number(variant.in_stock || 0)} units • {variant.is_available && Number(variant.in_stock || 0) > 0 ? "Visible" : "Hidden"}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeVariant(variantIndex)}
                    disabled={formData.variants.length === 1}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <Label htmlFor={`variant-name-${variantIndex}`}>Color Name *</Label>
                    <Input
                      id={`variant-name-${variantIndex}`}
                      value={variant.name}
                      onChange={(event) => handleVariantChange(variantIndex, "name", event.target.value)}
                      placeholder="e.g., Ivory"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`variant-hex-${variantIndex}`}>Color Hex *</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`variant-hex-${variantIndex}`}
                        type="color"
                        value={variant.color_hex || "#D4D4D8"}
                        onChange={(event) => handleVariantChange(variantIndex, "color_hex", event.target.value)}
                        className="h-10 w-14 p-1"
                      />
                      <Input
                        value={variant.color_hex}
                        onChange={(event) => handleVariantChange(variantIndex, "color_hex", event.target.value)}
                        placeholder="#F5F5DC"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`variant-sku-${variantIndex}`}>Variant SKU</Label>
                    <Input
                      id={`variant-sku-${variantIndex}`}
                      value={variant.sku}
                      onChange={(event) => handleVariantChange(variantIndex, "sku", event.target.value)}
                      placeholder="Optional SKU override"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`variant-stock-${variantIndex}`}>Stock Quantity *</Label>
                    <Input
                      id={`variant-stock-${variantIndex}`}
                      type="number"
                      min="0"
                      value={variant.in_stock}
                      onChange={(event) => handleVariantChange(variantIndex, "in_stock", event.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <input
                    id={`variant-available-${variantIndex}`}
                    type="checkbox"
                    checked={variant.is_available}
                    onChange={(event) => handleVariantChange(variantIndex, "is_available", event.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`variant-available-${variantIndex}`}>
                    Show this color on the storefront when stock is available
                  </Label>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor={`variant-images-${variantIndex}`}>Color Images</Label>
                    <div className="rounded-lg border-2 border-dashed p-6 text-center">
                      <input
                        id={`variant-images-${variantIndex}`}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(event) => handleVariantImageUpload(variantIndex, event)}
                        className="hidden"
                      />
                      <label htmlFor={`variant-images-${variantIndex}`} className="cursor-pointer">
                        <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="text-sm">
                          {uploadingVariantIndex === variantIndex
                            ? `Uploading images for ${variant.name || `color ${variantIndex + 1}`}...`
                            : `Upload images for ${variant.name || `color ${variantIndex + 1}`}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {variant.images.length} image{variant.images.length === 1 ? "" : "s"} uploaded
                        </p>
                      </label>
                    </div>
                  </div>

                  {hasImages ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      {variant.images.map((image, imageIndex) => (
                        <div key={`${variantIndex}-${imageIndex}`} className="group relative">
                          <div className="relative h-32 w-full overflow-hidden rounded-lg bg-muted">
                            {image.startsWith("/") ? (
                              <Image src={image} alt={`${variant.name} ${imageIndex + 1}`} fill className="object-cover" />
                            ) : (
                              <img src={image} alt={`${variant.name} ${imageIndex + 1}`} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVariantImage(variantIndex, imageIndex)}
                            className="absolute right-1 top-1 rounded bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label={`Remove image ${imageIndex + 1}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">Product Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(event) => handleInputChange("description", event.target.value)}
              placeholder="Brief product description..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="care_instructions">Care Instructions</Label>
            <Textarea
              id="care_instructions"
              value={formData.care_instructions}
              onChange={(event) => handleInputChange("care_instructions", event.target.value)}
              placeholder="How to care for this product..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}
