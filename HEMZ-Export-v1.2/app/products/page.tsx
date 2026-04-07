"use client"

import { useState, useMemo, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { ProductFilters, type FilterState, type FilterOptions } from "@/components/product-filters"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface PublicProduct {
  id: string
  title: string
  type: string
  sizes: string[]
  currency: string
  availability: string
  discount: number
  photos: string[]
  description: string
  care_instructions: string
  moq: number
  lead_time_days: number
  material?: string
  price?: number
  created_at?: string
  in_stock?: number
  is_available?: boolean
  color?: string[]
  colors?: string[]
  variants?: Array<{
    id?: string
    name: string
    color_hex: string
    sku?: string
    images: string[]
    is_available: boolean
    in_stock: number
  }>
}


export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOptions, setFilterOptions] = useState<FilterOptions | undefined>(undefined)
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    priceRange: [0, 1000],
    colors: [],
    availability: [],
    materials: [],
  })
  const [sortBy, setSortBy] = useState("")
  const [products, setProducts] = useState<PublicProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/products', {
          cache: "no-store",
        })
        const data = await res.json()
        if (mounted) {
          setProducts(data.products || [])
          // Set filter options from API response
          if (data.filterOptions) {
            setFilterOptions(data.filterOptions)
            // Update price range to use max price from products
            setFilters(prev => ({
              ...prev,
              priceRange: [0, data.filterOptions.maxPrice || 1000]
            }))
          }
        }
      } catch (e) {
        console.error('Failed to fetch public products', e)
        if (mounted) setProducts([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchProducts()
    return () => { mounted = false }
  }, [])

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      // Search filter
      const matchesSearch =
        (product.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.material || '').toLowerCase().includes(searchQuery.toLowerCase())

      // Type filter
      const matchesType = filters.types.length === 0 || filters.types.includes(product.type as string)

      // Price filter
      const matchesPrice = (product.price || 0) >= filters.priceRange[0] && (product.price || 0) <= filters.priceRange[1]

      // Color filter
      const productColors = product.colors || product.color || []
      const matchesColor = filters.colors.length === 0 || productColors.some((color) => filters.colors.includes(color))

      // Material filter
      const matchesMaterial = filters.materials.length === 0 || filters.materials.includes(product.material as string)

      return matchesSearch && matchesType && matchesPrice && matchesColor && matchesMaterial
    })

    // Sort products
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0))
        break
      case "price-high":
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
        break
      case "name":
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
        break
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        break
      default:
        break
    }

    return filtered
  }, [products, searchQuery, filters, sortBy])

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-24">Loading products…</div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8" id="main-content">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">Our Product Collection</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Discover our exquisite range of hand-woven cashmere shawls, pashmina, and scarves crafted for luxury markets
            worldwide.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <label htmlFor="product-search" className="sr-only">
              Search products
            </label>
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"
              aria-hidden="true"
            />
            <Input
              id="product-search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-describedby="search-description"
            />
            <p id="search-description" className="sr-only">
              Search through our collection of cashmere shawls, pashmina, and scarves
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0" aria-label="Product filters">
            <ProductFilters 
              onFilterChange={setFilters} 
              onSortChange={setSortBy} 
              filterOptions={filterOptions}
            />
          </aside>

          {/* Products Grid */}
          <section className="flex-1" aria-label="Product results">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-muted-foreground" aria-live="polite">
                Showing {filteredAndSortedProducts.length} products
              </p>
            </div>

            {filteredAndSortedProducts.length === 0 ? (
              <div className="text-center py-12" role="status" aria-live="polite">
                <p className="text-muted-foreground text-lg">No products found matching your criteria.</p>
                <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
                {filteredAndSortedProducts.map((product) => (
                  <div key={product.id} role="listitem">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
