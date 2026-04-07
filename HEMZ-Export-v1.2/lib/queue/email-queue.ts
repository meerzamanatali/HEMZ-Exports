// Background job queue for email processing

interface EmailJob {
  id: string
  type: "order_confirmation" | "shipping_confirmation" | "payment_failed" | "admin_notification"
  data: any
  attempts: number
  maxAttempts: number
  createdAt: Date
  scheduledAt: Date
}

class EmailQueue {
  private jobs: EmailJob[] = []
  private processing = false

  async addJob(type: EmailJob["type"], data: any, delay = 0): Promise<string> {
    const job: EmailJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      type,
      data,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
      scheduledAt: new Date(Date.now() + delay),
    }

    this.jobs.push(job)
    console.log(`[Email Queue] Added job: ${job.id} (${type})`)

    // Start processing if not already running
    if (!this.processing) {
      this.processJobs()
    }

    return job.id
  }

  private async processJobs(): Promise<void> {
    if (this.processing) return

    this.processing = true
    console.log("[Email Queue] Starting job processing")

    while (this.jobs.length > 0) {
      const now = new Date()
      const readyJobs = this.jobs.filter((job) => job.scheduledAt <= now)

      if (readyJobs.length === 0) {
        // Wait for next scheduled job
        const nextJob = this.jobs.reduce((earliest, job) => (job.scheduledAt < earliest.scheduledAt ? job : earliest))
        const waitTime = nextJob.scheduledAt.getTime() - now.getTime()
        await new Promise((resolve) => setTimeout(resolve, Math.min(waitTime, 5000)))
        continue
      }

      const job = readyJobs[0]
      await this.processJob(job)
    }

    this.processing = false
    console.log("[Email Queue] Job processing completed")
  }

  private async processJob(job: EmailJob): Promise<void> {
    try {
      console.log(`[Email Queue] Processing job: ${job.id} (${job.type})`)
      job.attempts++

      const { emailService } = await import("../email/email-service")

      let success = false

      switch (job.type) {
        case "order_confirmation":
          success = await emailService.sendOrderConfirmation(job.data)
          break
        case "shipping_confirmation":
          success = await emailService.sendShippingConfirmation(job.data.order, job.data.trackingNumber)
          break
        case "payment_failed":
          success = await emailService.sendPaymentFailed(job.data)
          break
        case "admin_notification":
          success = await emailService.sendAdminNotification(job.data.subject, job.data.message)
          break
        default:
          console.error(`[Email Queue] Unknown job type: ${job.type}`)
          success = false
      }

      if (success) {
        // Remove successful job
        this.jobs = this.jobs.filter((j) => j.id !== job.id)
        console.log(`[Email Queue] Job completed successfully: ${job.id}`)
      } else {
        // Retry or remove failed job
        if (job.attempts >= job.maxAttempts) {
          this.jobs = this.jobs.filter((j) => j.id !== job.id)
          console.error(`[Email Queue] Job failed permanently: ${job.id}`)
        } else {
          // Schedule retry with exponential backoff
          job.scheduledAt = new Date(Date.now() + Math.pow(2, job.attempts) * 1000)
          console.log(`[Email Queue] Job failed, retrying: ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`)
        }
      }
    } catch (error) {
      console.error(`[Email Queue] Error processing job ${job.id}:`, error)

      if (job.attempts >= job.maxAttempts) {
        this.jobs = this.jobs.filter((j) => j.id !== job.id)
      } else {
        job.scheduledAt = new Date(Date.now() + Math.pow(2, job.attempts) * 1000)
      }
    }
  }

  getQueueStatus() {
    return {
      totalJobs: this.jobs.length,
      processing: this.processing,
      jobs: this.jobs.map((job) => ({
        id: job.id,
        type: job.type,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        scheduledAt: job.scheduledAt,
      })),
    }
  }
}

export const emailQueue = new EmailQueue()
