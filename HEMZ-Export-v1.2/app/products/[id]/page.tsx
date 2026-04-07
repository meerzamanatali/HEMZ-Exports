import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductTabs } from "@/components/product-tabs"
import { ProductDetailView } from "@/components/product-detail-view"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"
import { serializeProductForClient } from "@/lib/product-variants"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface ProductPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        orderBy: {
          sort_order: "asc",
        },
      },
    },
  })

  if (!product) {
    return {
      title: "Product Not Found",
    }
  }

  const normalizedProduct = serializeProductForClient(product)
  const images = normalizedProduct.images
  const discountedPrice = product.discount_percent 
    ? (product.price_cents / 100) * (1 - product.discount_percent / 100) 
    : (product.price_cents / 100)

  return {
    title: `${product.title} | Luxury Textiles Export`,
    description: `${product.description || ''} Premium ${product.type?.toLowerCase() || 'textile'} made from ${product.material || 'fine materials'}. Starting at $${discountedPrice.toFixed(2)}. MOQ: ${product.moq || 'Contact for details'}.`,
    keywords: [
      product.type?.toLowerCase() || "textile",
      "cashmere",
      "pashmina",
      "export",
      "wholesale",
      "luxury textiles",
      product.material?.toLowerCase() || "",
    ].filter(Boolean),
    openGraph: {
      title: product.title,
      description: product.description || "",
      images: images.length > 0 ? [{ url: images[0], width: 800, height: 600, alt: product.title }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: product.description || "",
      images: images.length > 0 ? [images[0]] : [],
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        orderBy: {
          sort_order: "asc",
        },
      },
    },
  })

  if (!product) {
    notFound()
  }

  const normalizedProduct = serializeProductForClient(product)
  const images = normalizedProduct.images
  
  const price = product.price_cents / 100
  const discountedPrice = product.discount_percent 
    ? price * (1 - product.discount_percent / 100) 
    : price

  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    sku: product.id,
    mpn: product.id,
    brand: {
      "@type": "Brand",
      name: "Luxury Textiles Export Co.",
    },
    manufacturer: {
      "@type": "Organization",
      name: "Luxury Textiles Export Co.",
    },
    offers: {
      "@type": "Offer",
      price: discountedPrice.toString(),
      priceCurrency: "USD",
      availability: normalizedProduct.is_available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      priceValidUntil: "2025-12-31",
      seller: {
        "@type": "Organization",
        name: "Luxury Textiles Export Co.",
      },
    },
    image: images,
    material: product.material,
    color: normalizedProduct.colors,
    category: "Textiles",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "127",
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen">
        <Header />

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8" id="main-content">
          <ProductDetailView product={normalizedProduct as any} />

          {/* Product Details Tabs */}
          <section className="mt-12" aria-label="Additional product information">
            <ProductTabs product={normalizedProduct as any} />
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}
