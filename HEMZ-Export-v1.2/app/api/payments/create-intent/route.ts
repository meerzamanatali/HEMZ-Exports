import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "This endpoint has been replaced by /api/checkout/initialize",
    },
    { status: 410 }
  )
}
