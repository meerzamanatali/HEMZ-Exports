"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import couponsData from "@/data/coupons.json"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function EditCouponPage() {
  const router = useRouter()
  const params = useParams()
  const id = decodeURIComponent(params.id as string)
  const coupon = (couponsData.coupons || []).find((c: any) => c.id === id)
  const { toast } = useToast()

  const [code, setCode] = useState(coupon?.code || "")
  const [value, setValue] = useState(coupon?.value || 0)

  if (!coupon) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-2xl font-bold">Coupon not found</h1>
        <p className="text-muted-foreground">No coupon with id: {id}</p>
        <Link href="/admin/coupons">
          <Button>Back to Coupons</Button>
        </Link>
      </div>
    )
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    // Demo: In production, call API
    console.log("Save coupon", { id, code, value })
    toast({
      title: "Success",
      description: "Coupon updated successfully!",
    })
    router.push(`/admin/coupons/${encodeURIComponent(id)}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Edit Coupon</h1>
          <p className="text-muted-foreground">Update coupon {id}</p>
        </div>
        <Link href="/admin/coupons">
          <Button variant="outline">Back to Coupons</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Coupon</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>

            <div>
              <Label htmlFor="value">Value</Label>
              <Input id="value" type="number" value={String(value)} onChange={(e) => setValue(Number(e.target.value))} required />
            </div>

            <div className="flex gap-2">
              <Button type="submit">Save</Button>
              <Link href={`/admin/coupons/${encodeURIComponent(id)}`}>
                <Button variant="ghost">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
