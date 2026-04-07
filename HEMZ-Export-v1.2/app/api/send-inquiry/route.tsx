import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

// This is the serverless function option for sending emails
// You'll need to install nodemailer: npm install nodemailer @types/nodemailer

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, company, country, email, phone, productInterest, quantity, preferredDelivery, message } = body

    // Validate required fields
    if (!fullName || !company || !country || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create transporter using SMTP or SendGrid
    const transporter = nodemailer.createTransporter({
      // Option 1: SMTP Configuration
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },

      // Option 2: SendGrid Configuration (uncomment to use)
      // service: 'SendGrid',
      // auth: {
      //   user: 'apikey',
      //   pass: process.env.SENDGRID_API_KEY,
      // },
    })

    // Email content
    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@luxurytextiles.com",
      to: process.env.CONTACT_EMAIL || "hemzexport@gmail.com",
      subject: `New Export Inquiry from ${company}`,
      html: `
        <h2>New Export Inquiry</h2>
        <p><strong>Company:</strong> ${company}</p>
        <p><strong>Contact Person:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p><strong>Country:</strong> ${country}</p>
        <p><strong>Product Interest:</strong> ${productInterest || "General inquiry"}</p>
        <p><strong>Estimated Quantity:</strong> ${quantity || "Not specified"}</p>
        <p><strong>Preferred Delivery:</strong> ${preferredDelivery || "Not specified"}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        
        <hr>
        <p><em>This inquiry was submitted through the website contact form.</em></p>
      `,
    }

    // Send email
    await transporter.sendMail(mailOptions)

    // Send confirmation email to customer
    const confirmationOptions = {
      from: process.env.SMTP_FROM || "noreply@luxurytextiles.com",
      to: email,
      subject: "Thank you for your inquiry - Luxury Textiles Export",
      html: `
        <h2>Thank you for your inquiry!</h2>
        <p>Dear ${fullName},</p>
        <p>We have received your inquiry and will get back to you within 24 hours with a detailed quote.</p>
        <p>Our export team will review your requirements and provide you with:</p>
        <ul>
          <li>Detailed product specifications</li>
          <li>Competitive pricing for your quantity</li>
          <li>Shipping options and lead times</li>
          <li>Export documentation requirements</li>
        </ul>
        <p>If you have any urgent questions, please don't hesitate to contact us directly at +91 194 2501234.</p>
        <p>Best regards,<br>Luxury Textiles Export Team</p>
      `,
    }

    await transporter.sendMail(confirmationOptions)

    return NextResponse.json({ message: "Email sent successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
