import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import { prisma } from '@/lib/prisma'
import sharp from 'sharp'
import { randomUUID } from 'crypto'

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GCS_KEY_FILE,
})

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const eventId = formData.get('eventId') as string
    const guestId = formData.get('guestId') as string
    
    if (!file || !eventId) {
      return NextResponse.json(
        { error: 'File and event ID are required' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileId = randomUUID()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${eventId}/${guestId || 'anonymous'}/${fileId}.${fileExtension}`
    const thumbnailName = `${eventId}/${guestId || 'anonymous'}/thumb_${fileId}.jpg`

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Create thumbnail
    const thumbnailBuffer = await sharp(buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer()

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

    // Upload thumbnail to GCS
    const thumbnailFile = bucket.file(thumbnailName)
    await thumbnailFile.save(thumbnailBuffer, {
      metadata: {
        contentType: 'image/jpeg',
      }
    })

    // Make files publicly accessible
    await cloudFile.makePublic()
    await thumbnailFile.makePublic()

    // Get public URLs
    const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${fileName}`
    const thumbnailUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${thumbnailName}`

    // Save to database if guestId is provided
    if (guestId) {
      const photo = await prisma.photo.create({
        data: {
          eventId,
          guestId,
          fileName: file.name,
          originalName: file.name,
          mimeType: file.type,
          size: BigInt(file.size),
          cloudPath: fileName,
          cloudUrl: publicUrl,
          thumbnailPath: thumbnailName,
          thumbnailUrl: thumbnailUrl,
          uploadStatus: 'COMPLETED',
          uploadProgress: 100,
        }
      })

      // Update guest upload count
      await prisma.guest.update({
        where: { id: guestId },
        data: {
          uploadCount: { increment: 1 },
          totalSize: { increment: file.size }
        }
      })
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      thumbnailUrl,
      fileName: file.name,
      size: file.size,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// Handle chunk upload for large files
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData()
    const chunk = formData.get('chunk') as File
    const chunkNumber = formData.get('chunkNumber') as string
    const totalChunks = formData.get('totalChunks') as string
    const fileName = formData.get('fileName') as string
    const uploadId = formData.get('uploadId') as string

    if (!chunk || !chunkNumber || !totalChunks || !fileName || !uploadId) {
      return NextResponse.json(
        { error: 'Missing required chunk upload parameters' },
        { status: 400 }
      )
    }

    // Store chunk temporarily (in production, use Redis or temp storage)
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      chunkNumber: parseInt(chunkNumber),
      totalChunks: parseInt(totalChunks),
      uploadId,
    })
  } catch (error) {
    console.error('Chunk upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload chunk' },
      { status: 500 }
    )
  }
}
