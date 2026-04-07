"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save } from "lucide-react"

interface SettingsFormProps {
  initialData: any
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [storeData, setStoreData] = useState(initialData.store || {})
  const [paymentData, setPaymentData] = useState(initialData.payment || {})
  const [emailData, setEmailData] = useState(initialData.email || {})
  const [taxData, setTaxData] = useState(initialData.tax || {})

  const handleSave = async (section: string) => {
    setIsSaving(true)
    try {
      const payload = {
        store: section === "store" ? storeData : initialData.store,
        payment: section === "payment" ? paymentData : initialData.payment,
        email: section === "email" ? emailData : initialData.email,
        tax: section === "tax" ? taxData : initialData.tax,
      }

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "Settings Saved",
          description: `${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully.`,
        })
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Tabs defaultValue="store" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="store">Store</TabsTrigger>
        <TabsTrigger value="payment">Payment</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="tax">Tax</TabsTrigger>
        <TabsTrigger value="shipping">Shipping</TabsTrigger>
      </TabsList>

      {/* Store Settings */}
      <TabsContent value="store" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store_name">Store Name</Label>
              <Input
                id="store_name"
                value={storeData.name || ""}
                onChange={(e) => setStoreData({ ...storeData, name: e.target.value })}
                placeholder="Your store name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store_desc">Description</Label>
              <Textarea
                id="store_desc"
                value={storeData.description || ""}
                onChange={(e) => setStoreData({ ...storeData, description: e.target.value })}
                placeholder="Store description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={storeData.currency || ""}
                  onChange={(e) => setStoreData({ ...storeData, currency: e.target.value })}
                  placeholder="USD"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={storeData.timezone || ""}
                  onChange={(e) => setStoreData({ ...storeData, timezone: e.target.value })}
                  placeholder="UTC"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="support_email">Support Email</Label>
              <Input
                id="support_email"
                type="email"
                value={storeData.support_email || ""}
                onChange={(e) => setStoreData({ ...storeData, support_email: e.target.value })}
                placeholder="support@example.com"
              />
            </div>

            <Button onClick={() => handleSave("store")} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              Save Store Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Payment Settings */}
      <TabsContent value="payment" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stripe */}
            <div className="border-b pb-6">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="stripe"
                  checked={paymentData.stripe_enabled || false}
                  onChange={(e) => setPaymentData({ ...paymentData, stripe_enabled: e.target.checked })}
                />
                <Label htmlFor="stripe" className="cursor-pointer font-medium">
                  Stripe
                </Label>
              </div>
              <div className="space-y-2 ml-6">
                <Label>Publishable Key</Label>
                <Input
                  value={paymentData.stripe_publishable_key || ""}
                  onChange={(e) => setPaymentData({ ...paymentData, stripe_publishable_key: e.target.value })}
                  placeholder="pk_live_..."
                  type="password"
                />
              </div>
            </div>

            {/* PayPal */}
            <div className="border-b pb-6">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="paypal"
                  checked={paymentData.paypal_enabled || false}
                  onChange={(e) => setPaymentData({ ...paymentData, paypal_enabled: e.target.checked })}
                />
                <Label htmlFor="paypal" className="cursor-pointer font-medium">
                  PayPal
                </Label>
              </div>
              <div className="space-y-2 ml-6">
                <Label>Client ID</Label>
                <Input
                  value={paymentData.paypal_client_id || ""}
                  onChange={(e) => setPaymentData({ ...paymentData, paypal_client_id: e.target.value })}
                  placeholder="Client ID"
                  type="password"
                />
              </div>
            </div>

            {/* Bank Transfer */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="bank"
                  checked={paymentData.bank_transfer_enabled || false}
                  onChange={(e) => setPaymentData({ ...paymentData, bank_transfer_enabled: e.target.checked })}
                />
                <Label htmlFor="bank" className="cursor-pointer font-medium">
                  Bank Transfer
                </Label>
              </div>
              <div className="space-y-2 ml-6">
                <Input
                  value={paymentData.bank_details?.account_name || ""}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      bank_details: { ...paymentData.bank_details, account_name: e.target.value },
                    })
                  }
                  placeholder="Account Name"
                />
                <Input
                  value={paymentData.bank_details?.bank_name || ""}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      bank_details: { ...paymentData.bank_details, bank_name: e.target.value },
                    })
                  }
                  placeholder="Bank Name"
                />
                <Input
                  value={paymentData.bank_details?.swift_code || ""}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      bank_details: { ...paymentData.bank_details, swift_code: e.target.value },
                    })
                  }
                  placeholder="SWIFT Code"
                />
              </div>
            </div>

            <Button onClick={() => handleSave("payment")} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              Save Payment Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Email Settings */}
      <TabsContent value="email" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Email Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from_name">From Name</Label>
                <Input
                  id="from_name"
                  value={emailData.from_name || ""}
                  onChange={(e) => setEmailData({ ...emailData, from_name: e.target.value })}
                  placeholder="Company Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="from_email">From Email</Label>
                <Input
                  id="from_email"
                  type="email"
                  value={emailData.from_email || ""}
                  onChange={(e) => setEmailData({ ...emailData, from_email: e.target.value })}
                  placeholder="noreply@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp_host">SMTP Host</Label>
                <Input
                  id="smtp_host"
                  value={emailData.smtp_host || ""}
                  onChange={(e) => setEmailData({ ...emailData, smtp_host: e.target.value })}
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp_port">SMTP Port</Label>
                <Input
                  id="smtp_port"
                  type="number"
                  value={emailData.smtp_port || ""}
                  onChange={(e) => setEmailData({ ...emailData, smtp_port: Number(e.target.value) })}
                  placeholder="587"
                />
              </div>
            </div>

            <Button onClick={() => handleSave("email")} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              Save Email Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tax Settings */}
      <TabsContent value="tax" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Tax Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="tax_enabled"
                checked={taxData.tax_enabled || false}
                onChange={(e) => setTaxData({ ...taxData, tax_enabled: e.target.checked })}
              />
              <Label htmlFor="tax_enabled" className="cursor-pointer">
                Enable Tax Calculation
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_rate">Default Tax Rate (%)</Label>
              <Input
                id="default_rate"
                type="number"
                step="0.01"
                value={taxData.default_rate || ""}
                onChange={(e) => setTaxData({ ...taxData, default_rate: Number(e.target.value) })}
                placeholder="10"
              />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Tax Regions</h4>
              {taxData.regions?.map((region: any, idx: number) => (
                <div key={idx} className="p-3 border rounded space-y-2">
                  <Input
                    value={region.region || ""}
                    onChange={(e) => {
                      const newRegions = [...taxData.regions]
                      newRegions[idx].region = e.target.value
                      setTaxData({ ...taxData, regions: newRegions })
                    }}
                    placeholder="Region/Country"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={region.rate || ""}
                    onChange={(e) => {
                      const newRegions = [...taxData.regions]
                      newRegions[idx].rate = Number(e.target.value)
                      setTaxData({ ...taxData, regions: newRegions })
                    }}
                    placeholder="Tax Rate (%)"
                  />
                </div>
              ))}
            </div>

            <Button onClick={() => handleSave("tax")} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              Save Tax Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Shipping Settings */}
      <TabsContent value="shipping" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Shipping Zones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {initialData.shipping?.zones?.map((zone: any, idx: number) => (
              <div key={idx} className="p-4 border rounded space-y-3">
                <Input value={zone.name} placeholder="Zone Name" disabled className="font-medium" />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={zone.countries?.join(", ") || ""} placeholder="Countries" disabled />
                  <Input value={`$${zone.base_rate}`} placeholder="Rate" disabled />
                  <Input value={zone.currency || ""} placeholder="Currency" disabled />
                  <Input value={zone.delivery_days || ""} placeholder="Delivery Days" disabled />
                </div>
                <p className="text-xs text-muted-foreground">View/edit shipping zones in advanced settings</p>
              </div>
            ))}
            <p className="text-sm text-muted-foreground">Shipping zone editing coming soon.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
