import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyGuestSession } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyGuestSession(request)
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { guest } = authResult
    const url = new URL(request.url)
    const viewAll = url.searchParams.get('viewAll') === 'true'
    
    // Check if user has QR code access (came from a table QR code)
    const hasQRAccess = guest?.tableId || false
    
    let photos

    if (viewAll && hasQRAccess) {
      // QR code users can see all photos for the event
      photos = await prisma.photo.findMany({
        where: {
          eventId: guest.eventId,
          uploadStatus: 'COMPLETED'
        },
        include: {
          guest: {
            select: {
              id: true,
              name: true,
              table: {
                select: {
                  tableNumber: true,
                  tableName: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else {
      // Regular users can only see their own photos
      photos = await prisma.photo.findMany({
        where: {
          guestId: guest.id,
          uploadStatus: 'COMPLETED'
        },
        include: {
          guest: {
            select: {
              id: true,
              name: true,
              table: {
                select: {
                  tableNumber: true,
                  tableName: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    // Filter out photos with missing URLs and generate photo list
    const validPhotos = photos.filter(photo => 
      photo.cloudUrl && photo.cloudUrl.trim() !== ''
    )

    console.log(`Filtered ${photos.length} photos to ${validPhotos.length} valid photos`)

    const photosWithUrls = validPhotos.map(photo => ({
      id: photo.id,
      fileName: photo.fileName,
      originalName: photo.originalName,
      url: photo.cloudUrl,
      thumbnailUrl: photo.thumbnailUrl,
      size: photo.size.toString(),
      uploadedAt: photo.createdAt,
      uploadedBy: viewAll && hasQRAccess ? {
        name: photo.guest?.name,
        table: photo.guest?.table?.tableName || photo.guest?.table?.tableNumber
      } : undefined
    }))

    // Clean up photos without valid URLs from database (optional cleanup)
    const invalidPhotos = photos.filter(photo => 
      !photo.cloudUrl || photo.cloudUrl.trim() === ''
    )
    
    if (invalidPhotos.length > 0) {
      console.log(`Found ${invalidPhotos.length} photos with invalid URLs, consider cleanup`)
    }

    return NextResponse.json({
      success: true,
      photos: photosWithUrls,
      totalCount: photosWithUrls.length, // Use filtered count
      canViewAll: hasQRAccess,
      viewingMode: viewAll && hasQRAccess ? 'all' : 'own'
    })

  } catch (error) {
    console.error('Fetch photos error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    )
  }
}
