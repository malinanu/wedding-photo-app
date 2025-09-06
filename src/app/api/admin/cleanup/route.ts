import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('Admin cleanup API called')
    
    // In production, add authentication check here
    
    // Find photos with missing or invalid URLs
    const photosToClean = await prisma.photo.findMany({
      where: {
        OR: [
          { cloudUrl: null },
          { cloudUrl: '' },
          { thumbnailUrl: null },
          { thumbnailUrl: '' }
        ]
      },
      select: {
        id: true,
        fileName: true,
        cloudUrl: true,
        thumbnailUrl: true,
        guestId: true
      }
    })

    console.log(`Found ${photosToClean.length} photos to clean up`)

    if (photosToClean.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No photos need cleanup',
        cleaned: 0
      })
    }

    // Delete orphaned photos from database
    const deleteResult = await prisma.photo.deleteMany({
      where: {
        id: {
          in: photosToClean.map(photo => photo.id)
        }
      }
    })

    console.log(`Cleaned up ${deleteResult.count} orphaned photos`)

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deleteResult.count} orphaned photos`,
      cleaned: deleteResult.count,
      photos: photosToClean.map(p => ({
        id: p.id,
        fileName: p.fileName,
        issues: [
          !p.cloudUrl ? 'Missing cloudUrl' : null,
          !p.thumbnailUrl ? 'Missing thumbnailUrl' : null
        ].filter(Boolean)
      }))
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup photos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}