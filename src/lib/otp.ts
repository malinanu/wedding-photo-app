import { randomInt } from 'crypto'
import { prisma } from './prisma'

export interface OTPData {
  phone: string
  otp: string
  eventId: string
  expiresAt: Date
}

class OTPService {
  private otpLength: number
  private expiryMinutes: number
  private maxAttempts: number

  constructor() {
    this.otpLength = 6
    this.expiryMinutes = 5
    this.maxAttempts = 3
  }

  /**
   * Generate a random OTP
   */
  generateOTP(): string {
    const min = Math.pow(10, this.otpLength - 1)
    const max = Math.pow(10, this.otpLength) - 1
    return randomInt(min, max).toString()
  }

  /**
   * Store OTP in database (or Redis if available)
   */
  async storeOTP(phone: string, eventId: string): Promise<{ otp: string; expiresAt: Date }> {
    const otp = this.generateOTP()
    const expiresAt = new Date(Date.now() + this.expiryMinutes * 60 * 1000)

    // Store in database (you might want to create a separate OTP table)
    // For now, we'll use a simple in-memory store or Redis
    // In production, you should use Redis or a dedicated OTP table

    // Temporary: Store as a session-like record
    await prisma.$executeRaw`
      INSERT INTO "OTPVerification" (phone, otp, "eventId", "expiresAt", attempts)
      VALUES (${phone}, ${otp}, ${eventId}, ${expiresAt}, 0)
      ON CONFLICT (phone, "eventId")
      DO UPDATE SET 
        otp = ${otp},
        "expiresAt" = ${expiresAt},
        attempts = 0
    `

    return { otp, expiresAt }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phone: string, otp: string, eventId: string): Promise<{
    success: boolean
    message: string
  }> {
    try {
      // Get stored OTP
      const storedOTP = await prisma.$queryRaw<{
        otp: string
        expiresAt: Date
        attempts: number
      }[]>`
        SELECT otp, "expiresAt", attempts
        FROM "OTPVerification"
        WHERE phone = ${phone} AND "eventId" = ${eventId}
        LIMIT 1
      `

      if (!storedOTP || storedOTP.length === 0) {
        return {
          success: false,
          message: 'OTP not found. Please request a new one.'
        }
      }

      const otpData = storedOTP[0]

      // Check if OTP has expired
      if (new Date() > otpData.expiresAt) {
        // Delete expired OTP
        await this.deleteOTP(phone, eventId)
        return {
          success: false,
          message: 'OTP has expired. Please request a new one.'
        }
      }

      // Check attempts
      if (otpData.attempts >= this.maxAttempts) {
        await this.deleteOTP(phone, eventId)
        return {
          success: false,
          message: 'Maximum attempts exceeded. Please request a new OTP.'
        }
      }

      // Verify OTP
      if (otpData.otp !== otp) {
        // Increment attempts
        await prisma.$executeRaw`
          UPDATE "OTPVerification"
          SET attempts = attempts + 1
          WHERE phone = ${phone} AND "eventId" = ${eventId}
        `
        
        return {
          success: false,
          message: `Invalid OTP. ${this.maxAttempts - otpData.attempts - 1} attempts remaining.`
        }
      }

      // OTP is valid, delete it
      await this.deleteOTP(phone, eventId)

      return {
        success: true,
        message: 'Phone number verified successfully!'
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      return {
        success: false,
        message: 'Verification failed. Please try again.'
      }
    }
  }

  /**
   * Delete OTP
   */
  async deleteOTP(phone: string, eventId: string): Promise<void> {
    try {
      await prisma.$executeRaw`
        DELETE FROM "OTPVerification"
        WHERE phone = ${phone} AND "eventId" = ${eventId}
      `
    } catch (error) {
      console.error('Failed to delete OTP:', error)
    }
  }

  /**
   * Check if phone can request new OTP (rate limiting)
   */
  async canRequestOTP(phone: string, eventId: string): Promise<{
    canRequest: boolean
    waitTime?: number
  }> {
    try {
      const recentOTP = await prisma.$queryRaw<{
        createdAt: Date
        expiresAt: Date
      }[]>`
        SELECT "createdAt", "expiresAt"
        FROM "OTPVerification"
        WHERE phone = ${phone} AND "eventId" = ${eventId}
        LIMIT 1
      `

      if (!recentOTP || recentOTP.length === 0) {
        return { canRequest: true }
      }

      const otpData = recentOTP[0]
      const now = new Date()
      
      // Check if current OTP is still valid
      if (now < otpData.expiresAt) {
        const waitTime = Math.ceil((otpData.expiresAt.getTime() - now.getTime()) / 1000)
        return {
          canRequest: false,
          waitTime
        }
      }

      return { canRequest: true }
    } catch (error) {
      console.error('Rate limit check failed:', error)
      return { canRequest: true }
    }
  }

  /**
   * Clean up expired OTPs (should be run periodically)
   */
  async cleanupExpiredOTPs(): Promise<void> {
    try {
      await prisma.$executeRaw`
        DELETE FROM "OTPVerification"
        WHERE "expiresAt" < NOW()
      `
    } catch (error) {
      console.error('Failed to cleanup expired OTPs:', error)
    }
  }
}

// Export singleton instance
export const otpService = new OTPService()

// Export class for testing
export default OTPService
