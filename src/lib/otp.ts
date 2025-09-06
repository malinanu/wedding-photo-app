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

    // Use Prisma's upsert method to handle both insert and update
    await prisma.oTPVerification.upsert({
      where: {
        phone_eventId: {
          phone,
          eventId
        }
      },
      update: {
        otp,
        expiresAt,
        attempts: 0
      },
      create: {
        phone,
        otp,
        eventId,
        expiresAt,
        attempts: 0
      }
    })

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
      // Get stored OTP using Prisma method
      const otpData = await prisma.oTPVerification.findUnique({
        where: {
          phone_eventId: {
            phone,
            eventId
          }
        }
      })

      if (!otpData) {
        return {
          success: false,
          message: 'OTP not found. Please request a new one.'
        }
      }

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
        // Increment attempts using Prisma method
        await prisma.oTPVerification.update({
          where: {
            phone_eventId: {
              phone,
              eventId
            }
          },
          data: {
            attempts: {
              increment: 1
            }
          }
        })
        
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
      await prisma.oTPVerification.delete({
        where: {
          phone_eventId: {
            phone,
            eventId
          }
        }
      })
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
      const otpData = await prisma.oTPVerification.findUnique({
        where: {
          phone_eventId: {
            phone,
            eventId
          }
        },
        select: {
          createdAt: true,
          expiresAt: true
        }
      })

      if (!otpData) {
        return { canRequest: true }
      }
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
      await prisma.oTPVerification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })
    } catch (error) {
      console.error('Failed to cleanup expired OTPs:', error)
    }
  }
}

// Export singleton instance
export const otpService = new OTPService()

// Export class for testing
export default OTPService
