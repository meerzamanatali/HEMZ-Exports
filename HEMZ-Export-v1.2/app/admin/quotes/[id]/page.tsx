import fs from "fs"
import path from "path"
import { ArrowLeft, Mail, Phone, MapPin, Package, Calendar, User, MessageSquare } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const filePath = path.join(process.cwd(), "data", "quotes.json")
  const raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "{\n  \"quotes\": []\n}"
  const data = JSON.parse(raw)
  const quotes = data.quotes || []
  const quote = quotes.find((q: any) => q.id === params.id)

  if (!quote) {
    return (
      <div className="space-y-6">
        <Link href="/admin/quotes" className="flex items-center gap-2 text-sm hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Quotes
        </Link>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Quote not found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/quotes" className="flex items-center gap-2 text-sm hover:underline mb-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Quotes
          </Link>
          <h1 className="font-serif text-3xl font-bold">{quote.quote_number}</h1>
          <p className="text-muted-foreground">Quote from {quote.fullName}</p>
        </div>
        <Badge variant={quote.status === "new" ? "default" : "secondary"}>{quote.status}</Badge>
      </div>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{quote.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Company</p>
              <p className="font-medium">{quote.company || "—"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium break-all">{quote.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{quote.phone || "—"}</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Country</p>
              <p className="font-medium">{quote.country || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Product Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Product of Interest</p>
              <p className="font-medium">{quote.productInterest || "General Inquiry"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Quantity</p>
              <p className="font-medium">{quote.quantity || "—"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 mt-1 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Preferred Delivery</p>
              <p className="font-medium">{quote.preferredDelivery || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message / Inquiry Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Inquiry Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg border">
            <p className="whitespace-pre-wrap text-sm">{quote.message || "No message provided."}</p>
          </div>
        </CardContent>
      </Card>

      {/* Submission Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Submission Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quote ID:</span>
            <span className="font-mono">{quote.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Submitted:</span>
            <span>{new Date(quote.created_at).toLocaleString()}</span>
          </div>
          {quote.source && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source:</span>
              <span className="capitalize">{quote.source}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
