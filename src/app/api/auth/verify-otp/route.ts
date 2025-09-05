import { NextRequest, NextResponse } from 'next/server'
import { otpService } from '@/lib/otp'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, otp, eventId, name, email, tableId } = body

    if (!phone || !otp || !eventId || !name) {
      return NextResponse.json(
        { error: 'Phone, OTP, event ID, and name are required' },
        { status: 400 }
      )
    }

    // Verify OTP
    const verificationResult = await otpService.verifyOTP(phone, otp, eventId)

    if (!verificationResult.success) {
      return NextResponse.json(
        { error: verificationResult.message },
        { status: 400 }
      )
    }

    // OTP is valid, create or update guest
    let guest = await prisma.guest.findFirst({
      where: {
        eventId,
        OR: [
          { phone },
          ...(email ? [{ email }] : []),
        ]
      }
    })

    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          eventId,
          name,
          phone,
          email,
          tableId,
          authenticatedAt: new Date(),
        }
      })
    } else {
      // Update guest information
      guest = await prisma.guest.update({
        where: { id: guest.id },
        data: {
          name, // Update name if different
          phone,
          email: email || guest.email,
          tableId: tableId || guest.tableId,
          authenticatedAt: new Date(),
        }
      })
    }

    // Create session
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour session

    const session = await prisma.session.create({
      data: {
        guestId: guest.id,
        token,
        expiresAt,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
        userAgent: request.headers.get('user-agent') || '',
      }
    })

    // Send welcome SMS (optional)
    // await smsService.sendWelcomeSMS(phone, name, `${process.env.NEXT_PUBLIC_APP_URL}?session=${token}`)

    return NextResponse.json({
      success: true,
      message: 'Phone verified successfully!',
      guest: {
        id: guest.id,
        name: guest.name,
        phone: guest.phone,
        email: guest.email,
        tableId: guest.tableId,
      },
      session: {
        token: session.token,
        expiresAt: session.expiresAt,
      }
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
