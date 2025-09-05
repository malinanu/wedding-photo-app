import axios from 'axios'

interface SMSOptions {
  recipient: string
  message: string
  scheduleTime?: string
}

interface SMSResponse {
  status: 'success' | 'error'
  message?: string
  data?: any
}

class TextLKService {
  private apiToken: string
  private senderId: string
  private apiEndpoint: string

  constructor() {
    this.apiToken = process.env.TEXTLK_API_TOKEN || ''
    this.senderId = process.env.TEXTLK_SENDER_ID || 'WeddingPix'
    this.apiEndpoint = 'https://app.text.lk/api/http/sms/send'
  }

  /**
   * Format phone number for Sri Lankan numbers
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any spaces, dashes, or special characters
    let cleaned = phone.replace(/[\s\-\(\)]/g, '')
    
    // If starts with 0, replace with 94
    if (cleaned.startsWith('0')) {
      cleaned = '94' + cleaned.substring(1)
    }
    
    // If doesn't start with country code, add 94
    if (!cleaned.startsWith('94')) {
      cleaned = '94' + cleaned
    }
    
    return cleaned
  }

  /**
   * Send SMS via Text.lk API
   */
  async sendSMS(options: SMSOptions): Promise<SMSResponse> {
    try {
      const formattedRecipient = this.formatPhoneNumber(options.recipient)
      
      const response = await axios.post(
        this.apiEndpoint,
        {
          api_token: this.apiToken,
          recipient: formattedRecipient,
          sender_id: this.senderId,
          type: 'plain',
          message: options.message,
          ...(options.scheduleTime && { schedule_time: options.scheduleTime })
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      )

      return response.data
    } catch (error) {
      console.error('SMS sending failed:', error)
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to send SMS'
      }
    }
  }

  /**
   * Send OTP SMS
   */
  async sendOTP(phone: string, otp: string): Promise<SMSResponse> {
    const message = `Your Wedding Photos verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\n- ${this.senderId}`
    
    return this.sendSMS({
      recipient: phone,
      message
    })
  }

  /**
   * Send welcome SMS after successful authentication
   */
  async sendWelcomeSMS(phone: string, guestName: string, uploadUrl?: string): Promise<SMSResponse> {
    let message = `Welcome ${guestName}! 🎉\n\n`
    message += `You can now upload photos from the wedding.\n\n`
    
    if (uploadUrl) {
      message += `Upload link: ${uploadUrl}\n\n`
    }
    
    message += `Thank you for sharing your memories with us! 💕`
    
    return this.sendSMS({
      recipient: phone,
      message
    })
  }

  /**
   * Send upload confirmation SMS
   */
  async sendUploadConfirmation(phone: string, photoCount: number): Promise<SMSResponse> {
    const message = `Thank you! 📸\n\n${photoCount} photo${photoCount > 1 ? 's' : ''} uploaded successfully.\n\nThe couple will love your memories! 💕`
    
    return this.sendSMS({
      recipient: phone,
      message
    })
  }

  /**
   * Check SMS status
   */
  async checkStatus(uid: string): Promise<SMSResponse> {
    try {
      const response = await axios.get(
        `https://app.text.lk/api/http/sms/${uid}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          data: {
            api_token: this.apiToken
          }
        }
      )

      return response.data
    } catch (error) {
      console.error('SMS status check failed:', error)
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to check SMS status'
      }
    }
  }

  /**
   * Get all SMS messages (for admin dashboard)
   */
  async getAllMessages(): Promise<SMSResponse> {
    try {
      const response = await axios.get(
        'https://app.text.lk/api/http/sms',
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          data: {
            api_token: this.apiToken
          }
        }
      )

      return response.data
    } catch (error) {
      console.error('Failed to fetch SMS messages:', error)
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch messages'
      }
    }
  }
}

// Export singleton instance
export const smsService = new TextLKService()

// Export class for testing
export default TextLKService
