export type ProductVariantInput = {
  id?: string
  name: string
  color_hex: string
  sku?: string | null
  images: string[]
  is_available: boolean
  in_stock: number
  sort_order: number
}

type ProductRecord = {
  id: string
  title: string
  sku?: string | null
  sizes?: string | null
  colors?: string | null
  images?: string | null
  price_cents: number
  is_available: boolean
  in_stock: number
  [key: string]: unknown
}

type ProductVariantRecord = {
  id: string
  product_id: string
  name: string
  color_hex: string
  sku?: string | null
  images?: string | null
  is_available: boolean
  in_stock: number
  sort_order: number
  created_at: Date
  updated_at: Date
}

type ProductWithOptionalVariants = ProductRecord & {
  variants?: ProductVariantRecord[]
}

export function parseJsonStringArray(value?: string | null): string[] {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : []
  } catch {
    return []
  }
}

function normalizeHexColor(value?: string | null) {
  const normalized = (value || "").trim()
  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return normalized.toUpperCase()
  }

  if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
    const [, r, g, b] = normalized
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }

  return "#D4D4D8"
}

function slugifyVariantPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function buildVariantSku(productTitle: string, variantName: string, fallback?: string | null) {
  if (fallback?.trim()) {
    return fallback.trim()
  }

  const productPart = slugifyVariantPart(productTitle).toUpperCase() || "PRODUCT"
  const variantPart = slugifyVariantPart(variantName).toUpperCase() || "DEFAULT"
  return `${productPart}-${variantPart}`
}

export function normalizeVariantInputs(rawVariants: unknown, productTitle: string): ProductVariantInput[] {
  if (!Array.isArray(rawVariants)) {
    return []
  }

  const normalized = rawVariants
    .map((variant, index) => {
      const entry = typeof variant === "object" && variant !== null ? (variant as Record<string, unknown>) : {}
      const name = String(entry.name || "").trim()
      if (!name) {
        return null
      }

      const images = Array.isArray(entry.images)
        ? entry.images.map((image) => String(image)).filter(Boolean)
        : Array.isArray(entry.photos)
          ? (entry.photos as unknown[]).map((image) => String(image)).filter(Boolean)
          : []

      const inStockValue = Number(entry.in_stock ?? 0)
      const inStock = Number.isFinite(inStockValue) ? Math.max(0, Math.floor(inStockValue)) : 0
      const explicitlyAvailable = entry.is_available !== undefined ? Boolean(entry.is_available) : true
      const isAvailable = explicitlyAvailable && inStock > 0

      return {
        id: typeof entry.id === "string" ? entry.id : undefined,
        name,
        color_hex: normalizeHexColor(typeof entry.color_hex === "string" ? entry.color_hex : typeof entry.hex === "string" ? entry.hex : null),
        sku: buildVariantSku(productTitle, name, typeof entry.sku === "string" ? entry.sku : null),
        images,
        is_available: isAvailable,
        in_stock: inStock,
        sort_order: typeof entry.sort_order === "number" ? entry.sort_order : index,
      }
    })

  return normalized.filter((variant) => Boolean(variant)) as ProductVariantInput[]
}

export function buildLegacyVariants(product: Pick<ProductRecord, "id" | "title" | "sku" | "images" | "colors" | "in_stock" | "is_available">): ProductVariantInput[] {
  const colors = parseJsonStringArray(product.colors)
  const images = parseJsonStringArray(product.images)
  const variantNames = colors.length > 0 ? colors : ["Default"]

  return variantNames.map((name, index) => ({
    id: index === 0 ? product.id : undefined,
    name,
    color_hex: "#D4D4D8",
    sku: buildVariantSku(product.title, name, index === 0 ? product.sku : null),
    images,
    is_available: Boolean(product.is_available) && Number(product.in_stock || 0) > 0,
    in_stock: Math.max(0, Number(product.in_stock || 0)),
    sort_order: index,
  }))
}

export function getNormalizedProductVariants(product: ProductWithOptionalVariants): ProductVariantInput[] {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order || a.created_at.getTime() - b.created_at.getTime())
      .map((variant, index) => ({
        id: variant.id,
        name: variant.name,
        color_hex: normalizeHexColor(variant.color_hex),
        sku: buildVariantSku(product.title, variant.name, variant.sku),
        images: parseJsonStringArray(variant.images),
        is_available: Boolean(variant.is_available) && variant.in_stock > 0,
        in_stock: Math.max(0, Number(variant.in_stock || 0)),
        sort_order: typeof variant.sort_order === "number" ? variant.sort_order : index,
      }))
  }

  return buildLegacyVariants(product)
}

export function buildProductAggregateFromVariants(variants: ProductVariantInput[]) {
  const normalizedVariants = variants
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((variant, index) => ({
      ...variant,
      sort_order: index,
      in_stock: Math.max(0, Number(variant.in_stock || 0)),
      is_available: Boolean(variant.is_available) && Number(variant.in_stock || 0) > 0,
      images: Array.isArray(variant.images) ? variant.images.filter(Boolean) : [],
    }))

  const totalStock = normalizedVariants.reduce((sum, variant) => sum + variant.in_stock, 0)
  const availableVariants = normalizedVariants.filter((variant) => variant.is_available)
  const defaultVariant = availableVariants[0] || normalizedVariants[0] || null
  const allImages = normalizedVariants.flatMap((variant) => variant.images)
  const uniqueImages = Array.from(new Set(allImages))
  const colorNames = normalizedVariants.map((variant) => variant.name)

  return {
    normalizedVariants,
    totalStock,
    isAvailable: availableVariants.length > 0,
    colorNames,
    images: uniqueImages,
    defaultVariant,
  }
}

export function serializeProductForClient(product: ProductWithOptionalVariants) {
  const variants = getNormalizedProductVariants(product)
  const aggregate = buildProductAggregateFromVariants(variants)

  return {
    ...product,
    sizes: parseJsonStringArray(product.sizes),
    colors: aggregate.colorNames,
    images: aggregate.images,
    photos: aggregate.images,
    in_stock: aggregate.totalStock,
    is_available: aggregate.isAvailable,
    price: product.price_cents / 100,
    variants: aggregate.normalizedVariants,
    default_variant_id: aggregate.defaultVariant?.id || null,
    default_variant: aggregate.defaultVariant,
  }
}
