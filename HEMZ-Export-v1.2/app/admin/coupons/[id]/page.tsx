import Link from "next/link"
import couponsData from "@/data/coupons.json"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function CouponView({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id)
  const coupon = (couponsData.coupons || []).find((c: any) => c.id === id)

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">{coupon.code}</h1>
        <p className="text-muted-foreground">Coupon ID: {coupon.id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Type</p>
              <p className="text-muted-foreground">{coupon.type}</p>
            </div>
            <div>
              <p className="font-medium">Value</p>
              <p className="text-muted-foreground">{coupon.type === "percent" ? `${coupon.value}%` : `$${coupon.value}`}</p>
            </div>
            <div>
              <p className="font-medium">Uses</p>
              <p className="text-muted-foreground">{coupon.uses} / {coupon.max_uses}</p>
            </div>
            <div>
              <p className="font-medium">Validity</p>
              <p className="text-muted-foreground">{coupon.start_date} — {coupon.end_date}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Link href={`/admin/coupons/${encodeURIComponent(coupon.id)}/edit`}>
          <Button>Edit</Button>
        </Link>
        <Link href="/admin/coupons">
          <Button variant="ghost">Back</Button>
        </Link>
      </div>
    </div>
  )
}
