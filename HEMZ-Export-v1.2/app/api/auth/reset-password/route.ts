import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import crypto from "crypto"

// Hash token for comparison
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Verify OTP - POST /api/auth/reset-password/verify
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp, token, newPassword, action } = body

    // Action: verify-otp - Verify the OTP is correct
    if (action === "verify-otp") {
      if (!email || !otp) {
        return NextResponse.json(
          { error: "Email and OTP are required" },
          { status: 400 }
        )
      }

      const emailLower = email.toLowerCase().trim()

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: emailLower },
      })

      if (!user) {
        return NextResponse.json(
          { error: "Invalid request" },
          { status: 400 }
        )
      }

      // Find valid reset token for this user
      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          user_id: user.id,
          otp: otp,
          used_at: null,
          expires_at: {
            gt: new Date(),
          },
        },
      })

      if (!resetToken) {
        return NextResponse.json(
          { error: "Invalid or expired OTP. Please request a new password reset." },
          { status: 400 }
        )
      }

      // Return success with the token for the next step
      return NextResponse.json({
        success: true,
        message: "OTP verified successfully",
        resetToken: resetToken.token, // Return the hashed token for the next step
      })
    }

    // Action: reset-password - Actually reset the password
    if (action === "reset-password") {
      if (!token || !newPassword) {
        return NextResponse.json(
          { error: "Token and new password are required" },
          { status: 400 }
        )
      }

      // Validate password strength
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters long" },
          { status: 400 }
        )
      }

      // Check password requirements
      const hasUppercase = /[A-Z]/.test(newPassword)
      const hasLowercase = /[a-z]/.test(newPassword)
      const hasNumber = /[0-9]/.test(newPassword)

      if (!hasUppercase || !hasLowercase || !hasNumber) {
        return NextResponse.json(
          { error: "Password must contain at least one uppercase letter, one lowercase letter, and one number" },
          { status: 400 }
        )
      }

      // Check if token is provided as hashed (from verify step) or plain
      let hashedToken = token
      if (token.length === 64 && !token.match(/^[a-f0-9]+$/)) {
        // If it looks like a plain token, hash it
        hashedToken = hashToken(token)
      }

      // Find the reset token
      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          token: hashedToken,
          used_at: null,
          expires_at: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      })

      if (!resetToken) {
        return NextResponse.json(
          { error: "Invalid or expired reset token. Please request a new password reset." },
          { status: 400 }
        )
      }

      // Hash the new password
      const passwordHash = await bcrypt.hash(newPassword, 12)

      // Update user password
      await prisma.user.update({
        where: { id: resetToken.user_id },
        data: { password_hash: passwordHash },
      })

      // Mark token as used
      await prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used_at: new Date() },
      })

      // Delete all other reset tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: {
          user_id: resetToken.user_id,
          id: { not: resetToken.id },
        },
      })

      return NextResponse.json({
        success: true,
        message: "Password reset successfully! You can now log in with your new password.",
      })
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'verify-otp' or 'reset-password'" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Failed to reset password. Please try again later." },
      { status: 500 }
    )
  }
}
