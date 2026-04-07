import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Status meanings:
// - "subscribed": User just signed up for the newsletter
// - "active": User is engaged (opened emails, clicked links, etc.)
// - "unsubscribed": User has opted out of the newsletter

// GET - Fetch all newsletter subscribers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status") // "active", "subscribed", "unsubscribed", or "all"
    const search = searchParams.get("search") || ""

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status && status !== "all") {
      where.status = status
    }

    if (search) {
      where.email = {
        contains: search.toLowerCase(),
      }
    }

    // Get total count
    const total = await prisma.newsletterSubscriber.count({ where })

    // Get subscribers
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { subscribed_at: "desc" },
      skip,
      take: limit,
    })

    // Get counts for each status using individual count queries (more reliable)
    // Note: Using 'any' to handle TypeScript cache not recognizing the updated Prisma schema
    const [subscribedCount, activeCount, unsubscribedCount] = await Promise.all([
      prisma.newsletterSubscriber.count({ where: { status: "subscribed" } as any }),
      prisma.newsletterSubscriber.count({ where: { status: "active" } as any }),
      prisma.newsletterSubscriber.count({ where: { status: "unsubscribed" } as any }),
    ])

    const counts = {
      subscribed: subscribedCount,
      active: activeCount,
      unsubscribed: unsubscribedCount,
    }

    return NextResponse.json({
      subscribers,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      counts,
    })
  } catch (error) {
    console.error("Failed to fetch newsletter subscribers:", error)
    return NextResponse.json(
      { error: "Failed to fetch subscribers" },
      { status: 500 }
    )
  }
}

// DELETE - Unsubscribe or delete a subscriber
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const hardDelete = searchParams.get("hardDelete") === "true"

    if (!id) {
      return NextResponse.json(
        { error: "Subscriber ID is required" },
        { status: 400 }
      )
    }

    if (hardDelete) {
      // Permanently delete
      await prisma.newsletterSubscriber.delete({
        where: { id },
      })
      return NextResponse.json({ success: true, message: "Subscriber permanently deleted" })
    } else {
      // Soft delete - mark as unsubscribed
      await prisma.newsletterSubscriber.update({
        where: { id },
        data: {
          status: "unsubscribed",
          unsubscribed_at: new Date(),
        } as any,
      })
      return NextResponse.json({ success: true, message: "Subscriber unsubscribed" })
    }
  } catch (error) {
    console.error("Failed to delete subscriber:", error)
    return NextResponse.json(
      { error: "Failed to delete subscriber" },
      { status: 500 }
    )
  }
}

// PATCH - Update subscriber status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status: newStatus } = body

    if (!id) {
      return NextResponse.json(
        { error: "Subscriber ID is required" },
        { status: 400 }
      )
    }

    const validStatuses = ["subscribed", "active", "unsubscribed"]
    if (newStatus && !validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'subscribed', 'active', or 'unsubscribed'" },
        { status: 400 }
      )
    }

    const updateData: any = {}
    
    if (newStatus === "unsubscribed") {
      updateData.status = "unsubscribed"
      updateData.unsubscribed_at = new Date()
    } else if (newStatus === "subscribed" || newStatus === "active") {
      updateData.status = newStatus
      updateData.unsubscribed_at = null
      if (newStatus === "subscribed") {
        updateData.subscribed_at = new Date()
      }
    }

    const subscriber = await prisma.newsletterSubscriber.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, subscriber })
  } catch (error) {
    console.error("Failed to update subscriber:", error)
    return NextResponse.json(
      { error: "Failed to update subscriber" },
      { status: 500 }
    )
  }
}
