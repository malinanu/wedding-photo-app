import { compressImage } from './utils'

export interface UploadFile {
  id: string
  file: File
  preview?: string
  thumbnail?: Blob
  progress: number
  status: 'pending' | 'uploading' | 'compressed' | 'completed' | 'failed'
  error?: string
  uploadUrl?: string
  cloudPath?: string
}

export class ProgressiveUploadManager {
  private uploads: Map<string, UploadFile> = new Map()
  private onProgressCallback?: (fileId: string, progress: number) => void
  private onStatusChangeCallback?: (fileId: string, status: UploadFile['status']) => void
  private onCompleteCallback?: (fileId: string, result: any) => void
  private onErrorCallback?: (fileId: string, error: string) => void

  constructor() {
    this.uploads = new Map()
  }

  onProgress(callback: (fileId: string, progress: number) => void) {
    this.onProgressCallback = callback
    return this
  }

  onStatusChange(callback: (fileId: string, status: UploadFile['status']) => void) {
    this.onStatusChangeCallback = callback
    return this
  }

  onComplete(callback: (fileId: string, result: any) => void) {
    this.onCompleteCallback = callback
    return this
  }

  onError(callback: (fileId: string, error: string) => void) {
    this.onErrorCallback = callback
    return this
  }

  /**
   * Add a file and immediately start 20% background upload
   */
  async addFile(file: File): Promise<string> {
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Create preview URL
    const preview = URL.createObjectURL(file)
    
    const uploadFile: UploadFile = {
      id: fileId,
      file,
      preview,
      progress: 0,
      status: 'pending'
    }
    
    this.uploads.set(fileId, uploadFile)
    
    // Start background compression and partial upload
    this.startBackgroundUpload(fileId)
    
    return fileId
  }

  /**
   * Start the 20% background upload
   */
  private async startBackgroundUpload(fileId: string) {
    const upload = this.uploads.get(fileId)
    if (!upload) return

    try {
      // Update status
      upload.status = 'uploading'
      this.onStatusChangeCallback?.(fileId, 'uploading')
      
      // Compress image to 20% quality
      const thumbnail = await compressImage(upload.file, 0.2)
      upload.thumbnail = thumbnail
      
      // Simulate progress for compression
      upload.progress = 20
      this.onProgressCallback?.(fileId, 20)
      
      upload.status = 'compressed'
      this.onStatusChangeCallback?.(fileId, 'compressed')
      
      // Upload thumbnail to server
      await this.uploadThumbnail(fileId, thumbnail)
      
    } catch (error) {
      upload.status = 'failed'
      upload.error = error instanceof Error ? error.message : 'Upload failed'
      this.onErrorCallback?.(fileId, upload.error)
    }
  }

  /**
   * Upload thumbnail to server
   */
  private async uploadThumbnail(fileId: string, thumbnail: Blob): Promise<void> {
    const upload = this.uploads.get(fileId)
    if (!upload) return

    const formData = new FormData()
    formData.append('thumbnail', thumbnail)
    formData.append('fileId', fileId)
    formData.append('fileName', upload.file.name)
    formData.append('fileSize', upload.file.size.toString())
    
    const response = await fetch('/api/upload/thumbnail', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error('Failed to upload thumbnail')
    }
    
    const data = await response.json()
    upload.uploadUrl = data.uploadUrl
    upload.cloudPath = data.cloudPath
  }

  /**
   * Complete the full upload when user confirms
   */
  async completeUpload(fileId: string, guestInfo: { name: string; phone?: string; email?: string }) {
    const upload = this.uploads.get(fileId)
    if (!upload) {
      throw new Error('Upload not found')
    }

    try {
      upload.status = 'uploading'
      this.onStatusChangeCallback?.(fileId, 'uploading')
      
      // If we have a pre-signed URL, use it for direct upload
      if (upload.uploadUrl) {
        await this.uploadDirectToGCS(upload)
      } else {
        // Otherwise, upload through our server
        await this.uploadThroughServer(upload, guestInfo)
      }
      
      upload.status = 'completed'
      upload.progress = 100
      this.onProgressCallback?.(fileId, 100)
      this.onStatusChangeCallback?.(fileId, 'completed')
      this.onCompleteCallback?.(fileId, { 
        cloudPath: upload.cloudPath,
        fileName: upload.file.name 
      })
      
    } catch (error) {
      upload.status = 'failed'
      upload.error = error instanceof Error ? error.message : 'Upload failed'
      this.onErrorCallback?.(fileId, upload.error)
      throw error
    }
  }

  /**
   * Upload directly to Google Cloud Storage using signed URL
   */
  private async uploadDirectToGCS(upload: UploadFile): Promise<void> {
    if (!upload.uploadUrl) {
      throw new Error('No upload URL available')
    }

    const xhr = new XMLHttpRequest()
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 80) + 20 // Start from 20%
          upload.progress = percentComplete
          this.onProgressCallback?.(upload.id, percentComplete)
        }
      })
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })
      
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'))
      })
      
      xhr.open('PUT', upload.uploadUrl!, true)
      xhr.setRequestHeader('Content-Type', upload.file.type)
      xhr.send(upload.file)
    })
  }

  /**
   * Upload through our server (fallback)
   */
  private async uploadThroughServer(upload: UploadFile, guestInfo: any): Promise<void> {
    const formData = new FormData()
    formData.append('file', upload.file)
    formData.append('guestName', guestInfo.name)
    if (guestInfo.phone) formData.append('guestPhone', guestInfo.phone)
    if (guestInfo.email) formData.append('guestEmail', guestInfo.email)
    
    const xhr = new XMLHttpRequest()
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 80) + 20
          upload.progress = percentComplete
          this.onProgressCallback?.(upload.id, percentComplete)
        }
      })
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText)
          upload.cloudPath = response.cloudPath
          resolve()
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })
      
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'))
      })
      
      xhr.open('POST', '/api/upload/complete', true)
      xhr.send(formData)
    })
  }

  /**
   * Cancel an upload
   */
  cancelUpload(fileId: string) {
    const upload = this.uploads.get(fileId)
    if (upload && upload.preview) {
      URL.revokeObjectURL(upload.preview)
    }
    this.uploads.delete(fileId)
  }

  /**
   * Get upload by ID
   */
  getUpload(fileId: string): UploadFile | undefined {
    return this.uploads.get(fileId)
  }

  /**
   * Get all uploads
   */
  getAllUploads(): UploadFile[] {
    return Array.from(this.uploads.values())
  }

  /**
   * Clear completed uploads
   */
  clearCompleted() {
    for (const [id, upload] of this.uploads.entries()) {
      if (upload.status === 'completed') {
        if (upload.preview) {
          URL.revokeObjectURL(upload.preview)
        }
        this.uploads.delete(id)
      }
    }
  }

  /**
   * Clear all uploads
   */
  clearAll() {
    for (const upload of this.uploads.values()) {
      if (upload.preview) {
        URL.revokeObjectURL(upload.preview)
      }
    }
    this.uploads.clear()
  }
}
