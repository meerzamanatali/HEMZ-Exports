import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { getSessionUserId } from "@/lib/auth/session"

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = getSessionUserId(cookieStore)

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      first_name,
      last_name,
      phone,
      company,
      address,
      city,
      state,
      postal_code,
      country,
    } = body

    // Build update data object only with provided fields
    const updateData: Record<string, string | null> = {}
    
    if (first_name !== undefined) updateData.first_name = first_name?.trim() || null
    if (last_name !== undefined) updateData.last_name = last_name?.trim() || null
    if (phone !== undefined) updateData.phone = phone?.trim() || null
    if (company !== undefined) updateData.company = company?.trim() || null
    if (address !== undefined) updateData.address = address?.trim() || null
    if (city !== undefined) updateData.city = city?.trim() || null
    if (state !== undefined) updateData.state = state?.trim() || null
    if (postal_code !== undefined) updateData.postal_code = postal_code?.trim() || null
    if (country !== undefined) updateData.country = country?.trim() || null

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        company: true,
        address: true,
        city: true,
        state: true,
        postal_code: true,
        country: true,
        email_verified: true,
        is_active: true,
        last_login: true,
        created_at: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user,
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
