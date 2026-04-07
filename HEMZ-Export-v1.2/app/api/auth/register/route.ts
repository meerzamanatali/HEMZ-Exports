import { NextRequest, NextResponse } from "next/server"

/**
 * DEPRECATED: Direct registration without email verification is disabled.
 * 
 * All registration must go through the email verification flow:
 * 1. POST /api/auth/send-verification - Send OTP to user's email
 * 2. POST /api/auth/verify-email - Verify OTP and create account
 * 
 * This ensures email ownership is verified before account creation.
 */

export async function POST(request: NextRequest) {
  // Direct registration without email verification is not allowed
  // Users must use the email verification flow through /register page
  return NextResponse.json(
    { 
      error: "Direct registration is disabled. Please register through the website using email verification.",
      message: "For security reasons, email verification is required. Please visit the registration page to create an account."
    },
    { status: 403 }
  )
}
