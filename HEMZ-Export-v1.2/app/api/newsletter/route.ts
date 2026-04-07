import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existingSubscriber) {
      // If they unsubscribed before, reactivate them
      if ((existingSubscriber as any).status === "unsubscribed") {
        await prisma.newsletterSubscriber.update({
          where: { id: existingSubscriber.id },
          data: {
            status: "subscribed",
            unsubscribed_at: null,
            subscribed_at: new Date(),
          } as any,
        })
        return NextResponse.json({
          success: true,
          message: "Welcome back! You have been re-subscribed to our newsletter.",
        })
      }
      
      // Already subscribed or active
      return NextResponse.json(
        { error: "This email is already subscribed to our newsletter" },
        { status: 409 }
      )
    }

    // Create new subscriber with "subscribed" status
    await prisma.newsletterSubscriber.create({
      data: {
        email: email.toLowerCase().trim(),
        status: "subscribed",
      } as any,
    })

    return NextResponse.json({
      success: true,
      message: "Thank you for subscribing! You'll receive updates about new collections and export opportunities.",
    })
  } catch (error) {
    console.error("Newsletter subscription error:", error)
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again later." },
      { status: 500 }
    )
  }
}

// GET endpoint to check subscription status (optional)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!subscriber) {
      return NextResponse.json({ subscribed: false })
    }

    return NextResponse.json({
      subscribed: subscriber.status === "subscribed",
      subscribedAt: subscriber.subscribed_at,
    })
  } catch (error) {
    console.error("Newsletter check error:", error)
    return NextResponse.json(
      { error: "Failed to check subscription status" },
      { status: 500 }
    )
  }
}
