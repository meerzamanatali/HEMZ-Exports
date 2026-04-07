"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Filter, X } from "lucide-react"

export interface FilterOptions {
  maxPrice: number
  colors: string[]
  materials: string[]
  types: string[]
}

interface FilterProps {
  onFilterChange: (filters: FilterState) => void
  onSortChange: (sort: string) => void
  filterOptions?: FilterOptions
}

export interface FilterState {
  types: string[]
  priceRange: [number, number]
  colors: string[]
  availability: string[]
  materials: string[]
}

// Default fallback values if no filter options provided
const defaultFilterOptions: FilterOptions = {
  maxPrice: 1000,
  colors: [],
  materials: [],
  types: ["Shawl", "Pashmina", "Scarf"],
}

export function ProductFilters({ onFilterChange, onSortChange, filterOptions }: FilterProps) {
  const options = filterOptions || defaultFilterOptions
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    priceRange: [0, options.maxPrice],
    colors: [],
    availability: [],
    materials: [],
  })

  // Update price range when filterOptions change (e.g., when max price is loaded)
  useEffect(() => {
    if (filterOptions && filters.priceRange[1] !== filterOptions.maxPrice) {
      setFilters(prev => ({
        ...prev,
        priceRange: [prev.priceRange[0], filterOptions.maxPrice]
      }))
    }
  }, [filterOptions?.maxPrice])

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFilterChange(updatedFilters)
  }

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      types: [],
      priceRange: [0, options.maxPrice],
      colors: [],
      availability: [],
      materials: [],
    }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  const handleTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked ? [...filters.types, type] : filters.types.filter((t) => t !== type)
    updateFilters({ types: newTypes })
  }

  const handleColorChange = (color: string, checked: boolean) => {
    const newColors = checked ? [...filters.colors, color] : filters.colors.filter((c) => c !== color)
    updateFilters({ colors: newColors })
  }

  const handleMaterialChange = (material: string, checked: boolean) => {
    const newMaterials = checked ? [...filters.materials, material] : filters.materials.filter((m) => m !== material)
    updateFilters({ materials: newMaterials })
  }

  const handleMinPriceChange = (value: string) => {
    const minPrice = Math.max(0, Math.min(parseInt(value) || 0, filters.priceRange[1]))
    updateFilters({ priceRange: [minPrice, filters.priceRange[1]] })
  }

  const handleMaxPriceChange = (value: string) => {
    const maxPrice = Math.min(options.maxPrice, Math.max(parseInt(value) || 0, filters.priceRange[0]))
    updateFilters({ priceRange: [filters.priceRange[0], maxPrice] })
  }

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Button variant="outline" onClick={() => setIsOpen(!isOpen)} className="w-full justify-center">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Filter Panel */}
      <div className={`${isOpen ? "block" : "hidden"} lg:block`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-serif">Filters</CardTitle>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sort */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Sort By</Label>
              <Select onValueChange={onSortChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sorting" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name: A to Z</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Product Type */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Product Type</Label>
              <div className="space-y-2">
                {(options.types.length > 0 ? options.types : defaultFilterOptions.types).map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filters.types.includes(type)}
                      onCheckedChange={(checked) => handleTypeChange(type, checked as boolean)}
                    />
                    <Label htmlFor={`type-${type}`} className="text-sm">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Price Range</Label>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1">
                  <Label htmlFor="min-price" className="text-xs text-muted-foreground">Min</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      id="min-price"
                      type="number"
                      min={0}
                      max={filters.priceRange[1]}
                      value={filters.priceRange[0]}
                      onChange={(e) => handleMinPriceChange(e.target.value)}
                      className="pl-6 h-9"
                    />
                  </div>
                </div>
                <span className="text-muted-foreground mt-5">-</span>
                <div className="flex-1">
                  <Label htmlFor="max-price" className="text-xs text-muted-foreground">Max</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      id="max-price"
                      type="number"
                      min={filters.priceRange[0]}
                      max={options.maxPrice}
                      value={filters.priceRange[1]}
                      onChange={(e) => handleMaxPriceChange(e.target.value)}
                      className="pl-6 h-9"
                    />
                  </div>
                </div>
              </div>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
                max={options.maxPrice}
                min={0}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1 text-center">
                ${filters.priceRange[0]} - ${filters.priceRange[1]}
              </p>
            </div>

            {/* Colors */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Colors</Label>
              {options.colors.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {options.colors.map((color) => (
                    <div key={color} className="flex items-center space-x-2">
                      <Checkbox
                        id={`color-${color}`}
                        checked={filters.colors.includes(color)}
                        onCheckedChange={(checked) => handleColorChange(color, checked as boolean)}
                      />
                      <Label htmlFor={`color-${color}`} className="text-sm">
                        {color}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No colors available</p>
              )}
            </div>

            {/* Materials */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Materials</Label>
              {options.materials.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {options.materials.map((material) => (
                    <div key={material} className="flex items-center space-x-2">
                      <Checkbox
                        id={`material-${material}`}
                        checked={filters.materials.includes(material)}
                        onCheckedChange={(checked) => handleMaterialChange(material, checked as boolean)}
                      />
                      <Label htmlFor={`material-${material}`} className="text-xs">
                        {material}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No materials available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
