import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function verifyGuestSession(request: NextRequest) {
  try {
    // Check for session token in cookies or authorization header
    const cookieToken = request.cookies.get('guest-session')?.value
    const headerToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const token = cookieToken || headerToken
    
    console.log('Auth verification:', {
      hasCookieToken: !!cookieToken,
      hasHeaderToken: !!headerToken,
      tokenUsed: token ? token.substring(0, 20) + '...' : 'none'
    })

    if (!token) {
      return {
        authenticated: false,
        error: 'No session token provided'
      }
    }

    // Development mode bypass
    if (process.env.NODE_ENV === 'development' && token === 'dev-token') {
      console.log('Development mode: Using mock session')
      // Create a mock guest for development
      const mockGuest = {
        id: 'dev-guest-1',
        eventId: 'wedding2025',
        name: 'Dev User',
        phone: '0771234567',
        email: null,
        tableId: 'table-1', // Give QR access in dev mode
        authenticatedAt: new Date(),
        uploadCount: 0,
        totalSize: BigInt(0),
        createdAt: new Date(),
        updatedAt: new Date(),
        event: {
          id: 'wedding2025',
          name: 'Wedding Event',
          description: null,
          date: new Date(),
          venue: null,
          organizerName: null,
          organizerEmail: null,
          organizerPhone: null,
          passcode: null,
          isActive: true,
          maxUploadSize: 10485760,
          allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
          storageQuota: BigInt(10737418240),
          storageUsed: BigInt(0),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
      
      return {
        authenticated: true,
        guest: mockGuest as any,
        eventId: 'wedding2025',
        token: 'dev-token'
      }
    }

    // Check if session exists in database
    const session = await prisma.session.findUnique({
      where: { token },
      include: { 
        guest: {
          include: {
            event: true
          }
        } 
      }
    })

    if (!session) {
      console.log('Session not found for token:', token.substring(0, 20) + '...')
      // Try to list existing sessions for debugging
      const sessionCount = await prisma.session.count()
      console.log('Total sessions in database:', sessionCount)
      
      return {
        authenticated: false,
        error: 'Session not found'
      }
    }

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      // Delete expired session
      await prisma.session.delete({
        where: { id: session.id }
      })
      return {
        authenticated: false,
        error: 'Session expired'
      }
    }

    // Check if guest is verified (has completed OTP)
    if (!session.guest.authenticatedAt) {
      return {
        authenticated: false,
        error: 'Phone number not verified'
      }
    }

    return {
      authenticated: true,
      guest: session.guest,
      eventId: session.guest.eventId,
      token: session.token
    }
  } catch (error) {
    console.error('Session verification error:', error)
    return {
      authenticated: false,
      error: 'Session verification failed'
    }
  }
}

export function createAuthResponse(message: string, status: number = 401) {
  return NextResponse.json(
    { 
      error: message,
      requiresAuth: true 
    },
    { status }
  )
}
