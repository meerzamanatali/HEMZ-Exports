"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function NewCouponPage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [type, setType] = useState("percent")
  const [value, setValue] = useState(10)
  const { toast } = useToast()

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    // Demo - not persisting
    console.log({ code, type, value })
    toast({
      title: "Success",
      description: "Coupon created successfully!",
    })
    router.push("/admin/coupons")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">New Coupon</h1>
          <p className="text-muted-foreground">Create a new discount coupon</p>
        </div>
        <Link href="/admin/coupons">
          <Button variant="outline">Back</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Coupon</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value)} className="w-full h-10 px-3 border rounded-md">
                <option value="percent">Percent</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>

            <div>
              <Label htmlFor="value">Value</Label>
              <Input id="value" type="number" value={String(value)} onChange={(e) => setValue(Number(e.target.value))} required />
            </div>

            <div className="flex gap-2">
              <Button type="submit">Create</Button>
              <Link href="/admin/coupons">
                <Button variant="ghost">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
