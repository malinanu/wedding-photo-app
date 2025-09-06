import { NextRequest, NextResponse } from 'next/server'
import { verifyGuestSession } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  const authResult = await verifyGuestSession(request)
  
  return NextResponse.json({
    authenticated: authResult.authenticated,
    error: authResult.error,
    guest: authResult.authenticated ? {
      id: authResult.guest?.id,
      name: authResult.guest?.name,
      phone: authResult.guest?.phone
    } : null
  })
}
