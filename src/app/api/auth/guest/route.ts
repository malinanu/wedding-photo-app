import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, name, phone, email, tableId } = body

    if (!eventId || !name) {
      return NextResponse.json(
        { error: 'Event ID and name are required' },
        { status: 400 }
      )
    }

    // Find or create guest
    let guest = await prisma.guest.findFirst({
      where: {
        eventId,
        OR: [
          { name },
          ...(phone ? [{ phone }] : []),
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
      // Update authentication time
      await prisma.guest.update({
        where: { id: guest.id },
        data: { 
          authenticatedAt: new Date(),
          tableId: tableId || guest.tableId
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

    return NextResponse.json({
      success: true,
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
    console.error('Authentication error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
