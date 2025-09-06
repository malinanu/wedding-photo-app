'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Camera, X, Check, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { formatFileSize } from '@/lib/utils'
import { ProgressiveUploadManager, UploadFile } from '@/lib/upload-manager'
interface PhotoUploadProps {
  eventId?: string
  maxSize?: number
  onUploadComplete?: (files: any[]) => void
}

export function PhotoUpload({ 
  eventId, 
  maxSize = 10 * 1024 * 1024, // 10MB default
  onUploadComplete 
}: PhotoUploadProps) {
  const [uploads, setUploads] = useState<UploadFile[]>([])
  const [uploadManager] = useState(() => new ProgressiveUploadManager())

  React.useEffect(() => {
    uploadManager
      .onProgress((fileId, progress) => {
        setUploads(prev => prev.map(u => 
          u.id === fileId ? { ...u, progress } : u
        ))
      })
      .onStatusChange((fileId, status) => {
        setUploads(prev => prev.map(u => 
          u.id === fileId ? { ...u, status } : u
        ))
      })
      .onError((fileId, error) => {
        setUploads(prev => prev.map(u => 
          u.id === fileId ? { ...u, status: 'failed', error } : u
        ))
      })
  }, [uploadManager])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newUploads: UploadFile[] = []
    
    for (const file of acceptedFiles) {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Max size is ${formatFileSize(maxSize)}`)
        continue
      }
      
      const fileId = await uploadManager.addFile(file)
      const upload = uploadManager.getUpload(fileId)
      if (upload) {
        newUploads.push(upload)
      }
    }
    
    setUploads(prev => [...prev, ...newUploads])
  }, [maxSize, uploadManager])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic']
    },
    maxSize,
    multiple: true
  })

  const removeUpload = (fileId: string) => {
    uploadManager.cancelUpload(fileId)
    setUploads(prev => prev.filter(u => u.id !== fileId))
  }

  const confirmAllUploads = async () => {
    const guestSession = localStorage.getItem('guestSession')
    let token = ''
    let guestId = ''
    
    if (guestSession) {
      try {
        const session = JSON.parse(guestSession)
        // Try different token locations based on how it was stored
        token = session.token || session.session?.token || ''
        guestId = session.guest?.id || ''
        
        console.log('Session data:', {
          hasToken: !!token,
          hasGuestId: !!guestId,
          tokenLength: token.length
        })
        
        if (!token) {
          console.error('No token found in session:', session)
          alert('Session expired. Please refresh the page and login again.')
          return
        }
      } catch (error) {
        console.error('Failed to parse session:', error)
        alert('Session expired. Please refresh the page and login again.')
        return
      }
    } else {
      alert('Session expired. Please refresh the page and login again.')
      return
    }
    
    const completedUploads = []
    
    for (const upload of uploads) {
      if (upload.status === 'compressed' || upload.status === 'pending') {
        try {
          // Upload to server
          const formData = new FormData()
          formData.append('file', upload.file)
          formData.append('eventId', eventId || 'default-event-id')
          formData.append('guestId', guestId)
          
          // Set token as cookie before making request
          document.cookie = `guest-session=${token}; path=/; max-age=${3 * 24 * 60 * 60}` // 3 days
          
          const response = await fetch('/api/upload/simple', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            credentials: 'include', // Include cookies
            body: formData,
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log('Upload successful:', result)
            setUploads(prev => prev.map(u => 
              u.id === upload.id ? { ...u, status: 'completed' } : u
            ))
            completedUploads.push({ ...upload, ...result })
          } else {
            const errorText = await response.text()
            console.error('Upload response error:', response.status, errorText)
            throw new Error(`Upload failed: ${response.status} - ${errorText}`)
          }
        } catch (error) {
          console.error('Failed to upload:', error)
          setUploads(prev => prev.map(u => 
            u.id === upload.id ? { ...u, status: 'failed', error: error instanceof Error ? error.message : 'Upload failed' } : u
          ))
        }
      }
    }
    
    if (onUploadComplete && completedUploads.length > 0) {
      onUploadComplete(completedUploads)
    }
  }


  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="heading-font text-3xl font-semibold text-[var(--text-dark)] mb-2">
          Upload Photos 📸
        </h2>
      </div>

      {/* Main Upload Button - Dominates the screen */}
      <div
        {...getRootProps()}
        className={cn(
          "relative cursor-pointer transition-all duration-300 mb-8",
          isDragActive ? "scale-105" : "hover:scale-[1.02]"
        )}
      >
        <input {...getInputProps()} />
        
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: isDragActive ? 1.05 : 1 }}
          transition={{ duration: 0.3 }}
          className="soft-texture rounded-2xl p-16 text-center shadow-lg"
        >
          <div className={cn(
            "w-32 h-32 mx-auto rounded-2xl flex items-center justify-center shadow-lg mb-6 transition-all duration-300",
            isDragActive 
              ? "bg-[var(--primary-accent)] scale-110" 
              : "bg-[var(--primary-accent)] hover:shadow-xl"
          )}>
            <Camera className="w-16 h-16 text-white" />
          </div>
          
          <div>
            <h3 className="heading-font text-3xl font-semibold text-[var(--text-dark)] mb-4">
              {isDragActive ? "Drop photos here!" : "Tap to Upload"}
            </h3>
            <p className="body-font text-lg text-[var(--text-dark)] opacity-80 mb-2">
              Drag & drop or tap to select photos
            </p>
            <p className="body-font text-sm text-[var(--text-dark)] opacity-60">
              Max {formatFileSize(maxSize)} per photo
            </p>
          </div>
        </motion.div>
      </div>


      {/* Upload Preview Grid */}
      {uploads.length > 0 && (
        <div>
          <h4 className="heading-font text-xl font-semibold text-[var(--text-dark)] mb-6">
            Your Photos
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <AnimatePresence>
              {uploads.map(upload => (
                <motion.div
                  key={upload.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-white shadow-md">
                    {upload.preview && (
                      <img
                        src={upload.preview}
                        alt={upload.file.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Progress Overlay */}
                    {upload.status === 'uploading' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-white text-center">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          <div className="w-16 h-1 bg-white/30 rounded-full">
                            <div 
                              className="h-full bg-[var(--primary-accent)] rounded-full transition-all"
                              style={{width: `${upload.progress}%`}}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    {upload.status === 'compressed' && (
                      <div className="absolute top-2 right-2 bg-[var(--primary-accent)] text-white rounded-full p-1.5">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    
                    {upload.status === 'completed' && (
                      <div className="absolute inset-0 bg-[var(--primary-accent)]/20 flex items-center justify-center">
                        <div className="bg-[var(--primary-accent)] text-white rounded-full p-2">
                          <Check className="w-5 h-5" />
                        </div>
                      </div>
                    )}
                    
                    {/* Remove Button */}
                    {upload.status !== 'completed' && (
                      <button
                        onClick={() => removeUpload(upload.id)}
                        className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  <p className="body-font mt-2 text-sm text-[var(--text-dark)] opacity-70 truncate">
                    {upload.file.name}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* Upload All Button */}
          {uploads.some(u => u.status === 'compressed' || u.status === 'pending') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center"
            >
              <button
                onClick={confirmAllUploads}
                className="btn-primary px-8 py-4 text-lg font-medium rounded-xl shadow-xl flex items-center gap-3"
              >
                <Upload className="w-6 h-6" />
                Upload All Photos
              </button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
