// Email service for HEMZ Pashmina e-commerce notifications

import nodemailer from "nodemailer"
import { Resend } from "resend"
import { orderConfirmationTemplate, shippingConfirmationTemplate, paymentFailedTemplate } from "./templates"

interface EmailOptions {
  to: string
  subject: string
  html: string
  text: string
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private resendClient: Resend | null = null

  constructor() {
    // Configure email provider based on environment
    if (process.env.RESEND_API_KEY) {
      this.resendClient = new Resend(process.env.RESEND_API_KEY)
    } else if (process.env.SENDGRID_API_KEY) {
      // SendGrid configuration
      this.transporter = nodemailer.createTransporter({
        service: "SendGrid",
        auth: {
          user: "apikey",
          pass: process.env.SENDGRID_API_KEY,
        },
      })
    } else {
      // SMTP configuration
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: Number.parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_FROM || "onboarding@resend.dev"

      if (this.resendClient) {
        const { error } = await this.resendClient.emails.send({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        })

        if (error) {
          console.error("[Email] Resend failed:", error)
          return false
        }

        return true
      }

      if (!this.transporter) {
        console.error("[Email] No email provider configured")
        return false
      }

      const mailOptions = {
        from: {
          name: "HEMZ Pashmina",
          address: fromAddress,
        },
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log("[Email] Sent successfully:", result.messageId)
      return true
    } catch (error) {
      console.error("[Email] Failed to send:", error)
      return false
    }
  }

  async sendOrderConfirmation(order: any): Promise<boolean> {
    const template = orderConfirmationTemplate(order)
    return this.sendEmail({
      to: order.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  }

  async sendShippingConfirmation(order: any, trackingNumber: string): Promise<boolean> {
    const template = shippingConfirmationTemplate(order, trackingNumber)
    return this.sendEmail({
      to: order.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  }

  async sendPaymentFailed(order: any): Promise<boolean> {
    const template = paymentFailedTemplate(order)
    return this.sendEmail({
      to: order.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  }

  async sendAdminNotification(subject: string, message: string): Promise<boolean> {
    const adminEmail = process.env.ADMIN_EMAIL || "hemzexport@gmail.com"
    return this.sendEmail({
      to: adminEmail,
      subject: `[HEMZ Admin] ${subject}`,
      html: `<p>${message}</p>`,
      text: message,
    })
  }
}

export const emailService = new EmailService()
