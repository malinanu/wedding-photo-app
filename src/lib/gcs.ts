import { Storage } from '@google-cloud/storage'
import { generateUploadPath } from './utils'

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GCS_KEY_FILE,
  // Or use credentials directly
  ...(process.env.GCS_CLIENT_EMAIL && process.env.GCS_PRIVATE_KEY ? {
    credentials: {
      client_email: process.env.GCS_CLIENT_EMAIL,
      private_key: process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }
  } : {})
})

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!)

export interface SignedUrlOptions {
  action: 'read' | 'write' | 'delete' | 'resumable'
  expires: number // in milliseconds
  contentType?: string
  contentLength?: number
}

/**
 * Generate a signed URL for direct upload to GCS
 */
export async function generateSignedUploadUrl(
  fileName: string,
  userName: string,
  options: Partial<SignedUrlOptions> = {}
): Promise<{ url: string; filePath: string }> {
  const filePath = generateUploadPath(userName, fileName)
  
  const [url] = await bucket.file(filePath).getSignedUrl({
    version: 'v4',
    action: options.action || 'write',
    expires: Date.now() + (options.expires || 15 * 60 * 1000), // 15 minutes default
    contentType: options.contentType,
    ...(options.contentLength ? {
      extensionHeaders: {
        'content-length': options.contentLength.toString()
      }
    } : {})
  })
  
  return { url, filePath }
}

/**
 * Generate a signed URL for reading/viewing a file
 */
export async function generateSignedReadUrl(
  filePath: string,
  expiresInMinutes: number = 60
): Promise<string> {
  const [url] = await bucket.file(filePath).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  })
  
  return url
}

/**
 * Upload a file directly to GCS (for server-side uploads)
 */
export async function uploadToGCS(
  buffer: Buffer,
  filePath: string,
  contentType: string
): Promise<{ publicUrl: string; size: number }> {
  const file = bucket.file(filePath)
  
  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000', // 1 year cache
    },
    resumable: false,
  })
  
  // Make the file publicly accessible (optional)
  // await file.makePublic()
  
  const [metadata] = await file.getMetadata()
  
  return {
    publicUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${filePath}`,
    size: parseInt(String(metadata.size || '0')),
  }
}

/**
 * Delete a file from GCS
 */
export async function deleteFromGCS(filePath: string): Promise<void> {
  await bucket.file(filePath).delete()
}

/**
 * Check if a file exists in GCS
 */
export async function fileExists(filePath: string): Promise<boolean> {
  const [exists] = await bucket.file(filePath).exists()
  return exists
}

/**
 * Get file metadata
 */
export async function getFileMetadata(filePath: string) {
  const [metadata] = await bucket.file(filePath).getMetadata()
  return metadata
}

/**
 * Create a resumable upload session
 */
export async function createResumableUpload(
  fileName: string,
  userName: string,
  contentType: string
): Promise<string> {
  const filePath = generateUploadPath(userName, fileName)
  const file = bucket.file(filePath)
  
  const [uploadUrl] = await file.createResumableUpload({
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000',
    },
  })
  
  return uploadUrl
}

/**
 * List files in a directory
 */
export async function listFiles(prefix: string, delimiter: string = '/') {
  const [files] = await bucket.getFiles({
    prefix,
    delimiter,
  })
  
  return files.map(file => ({
    name: file.name,
    size: parseInt(String(file.metadata.size || '0')),
    contentType: file.metadata.contentType,
    created: file.metadata.timeCreated,
    updated: file.metadata.updated,
  }))
}

export default {
  generateSignedUploadUrl,
  generateSignedReadUrl,
  uploadToGCS,
  deleteFromGCS,
  fileExists,
  getFileMetadata,
  createResumableUpload,
  listFiles,
}
