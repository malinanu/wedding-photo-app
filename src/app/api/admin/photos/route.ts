import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('Admin photos API called')
    
    // In production, add authentication check here
    
    // Get the first active event
    const event = await prisma.event.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
    
    if (!event) {
      console.log('No active event found')
      return NextResponse.json({
        photos: [],
        total: 0,
        error: 'No active event found'
      })
    }
    
    const eventId = event.id
    console.log('Fetching photos for event:', eventId)
    
    const photos = await prisma.photo.findMany({
      where: { 
        eventId,
        uploadStatus: 'COMPLETED'
      },
      include: {
        guest: {
          select: {
            name: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`Found ${photos.length} photos`)
    
    const formattedPhotos = photos.map(photo => ({
      id: photo.id,
      fileName: photo.originalName,
      thumbnailUrl: photo.thumbnailUrl || photo.cloudUrl,
      cloudUrl: photo.cloudUrl || '',
      size: Number(photo.size),
      uploadedAt: photo.createdAt.toISOString(),
      guestName: photo.guest.name || 'Unknown Guest'
    }))
    
    return NextResponse.json({
      photos: formattedPhotos,
      total: photos.length,
      eventId: eventId,
      eventName: event.name
    })
  } catch (error) {
    console.error('Photos fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
