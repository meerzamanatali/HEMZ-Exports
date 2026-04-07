"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Loader } from "lucide-react"

interface Quote {
  id: string
  quote_number: string
  full_name: string
  company?: string
  email: string
  product?: {
    title: string
  }
  quantity?: string
  status: string
  created_at: string
}

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  useEffect(() => {
    fetchQuotes()
  }, [page])

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      const res = await fetch(`/api/admin/quotes?${params}`)
      const data = await res.json()

      setQuotes(data.quotes || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error("Failed to fetch quotes:", error)
      setQuotes([])
    } finally {
      setLoading(false)
    }
  }

  const pages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Quotes</h1>
        <p className="text-muted-foreground">Manage customer quote requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Quote Requests ({total} total, page {page} of {pages})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin" />
            </div>
          ) : quotes.length === 0 ? (
            <p className="text-muted-foreground">No quote requests yet.</p>
          ) : (
            <>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground text-xs border-b">
                      <th className="px-2 py-2">#</th>
                      <th className="px-2 py-2">Name</th>
                      <th className="px-2 py-2">Company</th>
                      <th className="px-2 py-2">Email</th>
                      <th className="px-2 py-2">Product</th>
                      <th className="px-2 py-2">Quantity</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((q) => (
                      <tr key={q.id} className="border-t">
                        <td className="px-2 py-2 font-mono text-xs">{q.quote_number}</td>
                        <td className="px-2 py-2 font-medium">{q.full_name}</td>
                        <td className="px-2 py-2 text-xs">{q.company || "-"}</td>
                        <td className="px-2 py-2 text-xs text-blue-600">{q.email}</td>
                        <td className="px-2 py-2 text-xs">{q.product?.title || "-"}</td>
                        <td className="px-2 py-2 text-xs">{q.quantity || "-"}</td>
                        <td className="px-2 py-2">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              q.status === "new"
                                ? "bg-blue-100 text-blue-800"
                                : q.status === "quoted"
                                ? "bg-yellow-100 text-yellow-800"
                                : q.status === "won"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <Link href={`/admin/quotes/${q.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of{" "}
                  {total} quotes
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={page === pages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
