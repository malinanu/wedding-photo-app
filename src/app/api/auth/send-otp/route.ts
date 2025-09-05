import { NextRequest, NextResponse } from 'next/server'
import { smsService } from '@/lib/sms'
import { otpService } from '@/lib/otp'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, eventId } = body

    if (!phone || !eventId) {
      return NextResponse.json(
        { error: 'Phone number and event ID are required' },
        { status: 400 }
      )
    }

    // Validate phone number format (Sri Lankan)
    const phoneRegex = /^(0|94)?7[0-9]{8}$/
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Check rate limiting
    const { canRequest, waitTime } = await otpService.canRequestOTP(phone, eventId)
    
    if (!canRequest) {
      return NextResponse.json(
        { 
          error: `Please wait ${waitTime} seconds before requesting a new OTP`,
          waitTime 
        },
        { status: 429 }
      )
    }

    // Generate and store OTP
    const { otp, expiresAt } = await otpService.storeOTP(phone, eventId)

    // Send OTP via SMS
    const smsResult = await smsService.sendOTP(phone, otp)

    if (smsResult.status === 'error') {
      return NextResponse.json(
        { error: 'Failed to send SMS. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      expiresAt,
      // In development, you might want to return the OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
