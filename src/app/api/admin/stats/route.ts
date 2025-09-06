import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('Admin stats API called')
    
    // In production, add authentication check here
    
    // Get the first event or create a default one
    let event = await prisma.event.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
    
    if (!event) {
      console.log('No event found, creating default event')
      // Create a default event if none exists
      event = await prisma.event.create({
        data: {
          id: 'default-event-id',
          name: 'Sarah & John\'s Wedding',
          date: new Date('2025-09-05'),
          venue: 'Grand Ballroom Hotel',
          organizerName: 'Sarah & John',
          organizerEmail: 'admin@wedding.com',
          organizerPhone: '0771234567',
          passcode: '1234',
          isActive: true
        }
      })
    }
    
    const eventId = event.id
    console.log('Using event ID:', eventId)
    
    // Get statistics with more detailed logging
    const [totalGuests, totalPhotos, completedPhotos, totalPhotosWithSize] = await Promise.all([
      prisma.guest.count({
        where: { eventId }
      }),
      prisma.photo.count({
        where: { eventId }
      }),
      prisma.photo.count({
        where: { 
          eventId,
          uploadStatus: 'COMPLETED'
        }
      }),
      prisma.photo.aggregate({
        where: { 
          eventId,
          uploadStatus: 'COMPLETED'
        },
        _sum: {
          size: true
        }
      })
    ])
    
    // Calculate total size from completed photos
    const totalSize = Number(totalPhotosWithSize._sum.size || 0)
    
    console.log('Stats calculated:', {
      totalGuests,
      totalPhotos,
      completedPhotos,
      totalSize
    })
    
    return NextResponse.json({
      totalGuests,
      totalPhotos: completedPhotos, // Show only completed photos
      totalSize,
      tables: 1, // We're using single QR code now
      eventName: event.name,
      eventId: event.id
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
