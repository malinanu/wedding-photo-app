import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs'
import { verifyGuestSession, createAuthResponse } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyGuestSession(request)
    
    if (!authResult.authenticated) {
      return createAuthResponse(authResult.error || 'Authentication required')
    }
    
    const authenticatedGuest = authResult.guest
    const authenticatedEventId = authResult.eventId
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    // Use authenticated guest and event IDs
    let eventId = authenticatedEventId || (formData.get('eventId') as string)
    let guestId = authenticatedGuest?.id
    
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    // Get or create default event
    if (!eventId || eventId === 'default-event-id' || eventId === 'test-event') {
      const defaultEvent = await prisma.event.findFirst({
        orderBy: { createdAt: 'desc' }
      })
      
      if (defaultEvent) {
        eventId = defaultEvent.id
      } else {
        // Create default event
        const newEvent = await prisma.event.create({
          data: {
            id: 'default-event-id',
            name: 'Wedding Event',
            date: new Date(),
            isActive: true
          }
        })
        eventId = newEvent.id
      }
    } else {
      // Check if the provided eventId exists
      const existingEvent = await prisma.event.findUnique({
        where: { id: eventId }
      })
      
      if (!existingEvent) {
        // Create event with the provided ID
        const newEvent = await prisma.event.create({
          data: {
            id: eventId,
            name: `Event ${eventId}`,
            date: new Date(),
            isActive: true
          }
        })
        eventId = newEvent.id
      }
    }

    // Guest is already authenticated and verified
    if (!guestId) {
      return createAuthResponse('Guest ID not found in session', 401)
    }

    console.log('Upload request:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      eventId,
      guestId
    })

    // Generate unique filename
    const fileId = randomUUID()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${eventId}/${guestId || 'anonymous'}/${fileId}.${fileExtension}`

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Initialize Google Cloud Storage with explicit credentials
    const keyFilePath = process.env.GCS_KEY_FILE
    
    // Check if running in Docker or local
    const actualKeyPath = keyFilePath?.startsWith('/app') 
      ? keyFilePath 
      : path.join(process.cwd(), keyFilePath || '')

    console.log('GCS Configuration:', {
      projectId: process.env.GCS_PROJECT_ID,
      bucket: process.env.GCS_BUCKET_NAME,
      keyFile: actualKeyPath,
      keyFileExists: fs.existsSync(actualKeyPath)
    })

    const storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      keyFilename: actualKeyPath,
    })

    const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!)

    // Upload original file to GCS
    const cloudFile = bucket.file(fileName)
    
    await cloudFile.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedBy: guestId || 'anonymous',
          eventId,
        }
      }
    })

    // Don't call makePublic() when uniform bucket-level access is enabled
    // Generate a signed URL for viewing the file (valid for 7 days)
    const [signedUrl] = await cloudFile.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    // Use the storage URL as a reference (not directly accessible without authentication)
    const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${fileName}`

    console.log('File uploaded successfully:', {
      fileName,
      publicUrl,
      signedUrl: signedUrl.substring(0, 100) + '...' // Log partial URL for security
    })

    // Save to database
    try {
      const photo = await prisma.photo.create({
        data: {
          eventId,
          guestId,
          fileName: file.name,
          originalName: file.name,
          mimeType: file.type,
          size: BigInt(file.size),
          cloudPath: fileName,
          cloudUrl: signedUrl, // Store the signed URL for immediate access
          uploadStatus: 'COMPLETED',
          uploadProgress: 100,
        }
      })

      console.log('Photo record created:', photo.id)

      // Update guest upload count and total size
      if (guestId) {
        try {
          await prisma.guest.update({
            where: { id: guestId },
            data: {
              uploadCount: { increment: 1 },
              totalSize: { increment: BigInt(file.size) }
            }
          })
          console.log('Guest stats updated')
        } catch (guestError) {
          console.error('Failed to update guest stats:', guestError)
          // Non-critical error, continue
        }
      }

      // Update event storage used
      try {
        await prisma.event.update({
          where: { id: eventId },
          data: {
            storageUsed: { increment: BigInt(file.size) }
          }
        })
        console.log('Event storage updated')
      } catch (eventError) {
        console.error('Failed to update event storage:', eventError)
        // Non-critical error, continue
      }

      console.log('Database updated successfully:', {
        photoId: photo.id,
        guestId,
        eventId
      })
    } catch (dbError) {
      console.error('Database error details:', {
        error: dbError,
        eventId,
        guestId,
        fileName: file.name
      })
      // Still return success if file was uploaded to GCS since the file is saved
      console.log('File was uploaded to GCS successfully, returning success despite DB error')
    }

    return NextResponse.json({
      success: true,
      url: signedUrl, // Return the signed URL for immediate viewing
      publicUrl: publicUrl, // Reference URL
      fileName: file.name,
      size: file.size,
    })
  } catch (error) {
    console.error('Upload error details:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
