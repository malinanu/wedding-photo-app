import { NextRequest, NextResponse } from 'next/server'
import { generateSignedUploadUrl } from '@/lib/gcs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const thumbnail = formData.get('thumbnail') as Blob
    const fileId = formData.get('fileId') as string
    const fileName = formData.get('fileName') as string
    const fileSize = formData.get('fileSize') as string
    
    // Get session from headers
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Validate session
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { guest: true }
    })
    
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }
    
    // Generate signed URL for full upload
    const { url, filePath } = await generateSignedUploadUrl(
      fileName,
      session.guest.name,
      {
        contentType: 'image/jpeg',
        contentLength: parseInt(fileSize),
        expires: 15 * 60 * 1000, // 15 minutes
      }
    )
    
    // Create photo record in pending state
    const photo = await prisma.photo.create({
      data: {
        eventId: session.guest.eventId,
        guestId: session.guest.id,
        fileName: fileId,
        originalName: fileName,
        mimeType: 'image/jpeg',
        size: BigInt(fileSize),
        cloudPath: filePath,
        uploadStatus: 'PENDING',
      }
    })
    
    // TODO: Actually upload thumbnail to GCS
    // For now, we just prepare the full upload URL
    
    return NextResponse.json({
      success: true,
      uploadUrl: url,
      cloudPath: filePath,
      photoId: photo.id,
    })
  } catch (error) {
    console.error('Thumbnail upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
