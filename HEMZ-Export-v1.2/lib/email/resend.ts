import { Resend } from 'resend'

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY)

// Get configuration from environment variables
const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev'
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'HEMZ Pashmina'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Email templates
const getPasswordResetEmailHtml = (firstName: string, otp: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e4e4e7;">
              <h1 style="margin: 0; font-size: 24px; color: #18181b; font-weight: 600;">
                🔐 Password Reset Request
              </h1>
            </td>
          </tr>
        </table>
        
        <!-- Content -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                Hello <strong>${firstName || 'there'}</strong>,
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                We received a request to reset your password for your ${APP_NAME} account. Use the verification code below to complete the process:
              </p>
              
              <!-- OTP Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 30px; text-align: center;">
                    <p style="margin: 0 0 10px; font-size: 14px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 1px;">
                      Your Verification Code
                    </p>
                    <p style="margin: 0; font-size: 42px; color: #ffffff; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                      ${otp}
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 10px; font-size: 14px; color: #71717a; line-height: 1.6;">
                ⏰ This code will expire in <strong>1 hour</strong>.
              </p>
              <p style="margin: 0 0 30px; font-size: 14px; color: #71717a; line-height: 1.6;">
                If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
              </p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <a href="${APP_URL}/reset-password" style="display: inline-block; padding: 14px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      Reset Your Password →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 30px 40px; background-color: #fafafa; border-radius: 0 0 12px 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #a1a1aa; text-align: center; line-height: 1.6;">
                This email was sent by ${APP_NAME}. If you have any questions, please contact our support team.
              </p>
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

const getPasswordResetEmailText = (firstName: string, otp: string) => `
Hello ${firstName || 'there'},

We received a request to reset your password for your ${APP_NAME} account.

Your verification code is: ${otp}

This code will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

To reset your password, visit: ${APP_URL}/reset-password

Best regards,
${APP_NAME} Team
`

const getWelcomeEmailHtml = (firstName: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e4e4e7;">
              <h1 style="margin: 0; font-size: 28px; color: #18181b; font-weight: 600;">
                🎉 Welcome to ${APP_NAME}!
              </h1>
            </td>
          </tr>
        </table>
        
        <!-- Content -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 18px; color: #3f3f46; line-height: 1.6;">
                Hello <strong>${firstName}</strong>,
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                Thank you for creating an account with us! We're thrilled to have you join our community of discerning customers who appreciate the finest cashmere and pashmina products.
              </p>
              
              <!-- Features Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0; background-color: #fafafa; border-radius: 8px;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="margin: 0 0 15px; font-size: 14px; color: #18181b; font-weight: 600;">
                      What you can do with your account:
                    </p>
                    <p style="margin: 0 0 10px; font-size: 14px; color: #52525b; line-height: 1.6;">
                      ✨ Browse our exclusive collection of premium pashmina
                    </p>
                    <p style="margin: 0 0 10px; font-size: 14px; color: #52525b; line-height: 1.6;">
                      📦 Track your orders easily from your dashboard
                    </p>
                    <p style="margin: 0 0 10px; font-size: 14px; color: #52525b; line-height: 1.6;">
                      💰 Get exclusive member discounts and offers
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #52525b; line-height: 1.6;">
                      🔔 Be the first to know about new arrivals
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <a href="${APP_URL}/products" style="display: inline-block; padding: 14px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      Start Shopping →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 30px 40px; background-color: #fafafa; border-radius: 0 0 12px 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #a1a1aa; text-align: center; line-height: 1.6;">
                This email was sent by ${APP_NAME}. If you have any questions, please contact our support team.
              </p>
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

// Email sending functions
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `🔐 Reset your ${APP_NAME} password`,
      html: getPasswordResetEmailHtml(firstName, otp),
      text: getPasswordResetEmailText(firstName, otp),
    })

    if (error) {
      console.error('[Email] Failed to send password reset email:', error)
      return { success: false, error: error.message }
    }

    console.log('[Email] Password reset email sent successfully:', data?.id)
    return { success: true }
  } catch (error) {
    console.error('[Email] Error sending password reset email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendWelcomeEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `🎉 Welcome to ${APP_NAME}!`,
      html: getWelcomeEmailHtml(firstName),
    })

    if (error) {
      console.error('[Email] Failed to send welcome email:', error)
      return { success: false, error: error.message }
    }

    console.log('[Email] Welcome email sent successfully:', data?.id)
    return { success: true }
  } catch (error) {
    console.error('[Email] Error sending welcome email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// Email verification template
const getEmailVerificationHtml = (firstName: string, otp: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e4e4e7;">
              <h1 style="margin: 0; font-size: 24px; color: #18181b; font-weight: 600;">
                ✉️ Verify Your Email Address
              </h1>
            </td>
          </tr>
        </table>
        
        <!-- Content -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                Hello <strong>${firstName || 'there'}</strong>,
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                Thank you for registering with ${APP_NAME}! To complete your registration, please verify your email address using the code below:
              </p>
              
              <!-- OTP Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 30px; text-align: center;">
                    <p style="margin: 0 0 10px; font-size: 14px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 1px;">
                      Your Verification Code
                    </p>
                    <p style="margin: 0; font-size: 42px; color: #ffffff; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                      ${otp}
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 10px; font-size: 14px; color: #71717a; line-height: 1.6;">
                ⏰ This code will expire in <strong>15 minutes</strong>.
              </p>
              <p style="margin: 0 0 30px; font-size: 14px; color: #71717a; line-height: 1.6;">
                If you didn't create an account with ${APP_NAME}, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 30px 40px; background-color: #fafafa; border-radius: 0 0 12px 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #a1a1aa; text-align: center; line-height: 1.6;">
                This email was sent by ${APP_NAME}. If you have any questions, please contact our support team.
              </p>
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

const getEmailVerificationText = (firstName: string, otp: string) => `
Hello ${firstName || 'there'},

Thank you for registering with ${APP_NAME}!

To complete your registration, please verify your email address using the code below:

Your verification code is: ${otp}

This code will expire in 15 minutes.

If you didn't create an account with ${APP_NAME}, you can safely ignore this email.

Best regards,
${APP_NAME} Team
`

export async function sendEmailVerificationOTP(
  email: string,
  firstName: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('[Email] RESEND_API_KEY is not configured')
      return { success: false, error: 'Email service not configured' }
    }

    console.log('[Email] Sending verification email to:', email)
    console.log('[Email] From:', FROM_EMAIL)
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `✉️ Verify your email for ${APP_NAME}`,
      html: getEmailVerificationHtml(firstName, otp),
      text: getEmailVerificationText(firstName, otp),
    })

    if (error) {
      console.error('[Email] Failed to send verification email:', error)
      console.error('[Email] Error details:', JSON.stringify(error, null, 2))
      return { success: false, error: error.message }
    }

    console.log('[Email] Verification email sent successfully:', data?.id)
    return { success: true }
  } catch (error) {
    console.error('[Email] Error sending verification email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// Export for testing
export { resend, FROM_EMAIL, APP_NAME, APP_URL }
