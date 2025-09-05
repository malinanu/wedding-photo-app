'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, X, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatFileSize } from '@/lib/utils'
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
    // This would normally get guest info from a form or session
    const guestInfo = {
      name: 'Guest User', // Would come from authentication
      phone: '',
      email: ''
    }
    
    const completedUploads = []
    
    for (const upload of uploads) {
      if (upload.status === 'compressed' || upload.status === 'pending') {
        try {
          await uploadManager.completeUpload(upload.id, guestInfo)
          completedUploads.push(upload)
        } catch (error) {
          console.error('Failed to complete upload:', error)
        }
      }
    }
    
    if (onUploadComplete) {
      onUploadComplete(completedUploads)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-3 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300",
          isDragActive
            ? "border-blue-500 bg-blue-50 scale-105"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
        )}
      >
        <input {...getInputProps()} />
        
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: isDragActive ? 1.2 : 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
            {isDragActive ? (
              <Upload className="w-12 h-12 text-black animate-bounce" />
            ) : (
              <Camera className="w-12 h-12 text-black" />
            )}
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-black mb-2">
              {isDragActive ? "Drop photos here!" : "Add Your Photos"}
            </h3>
            <p className="text-black text-lg">
              Drag & drop or tap to select
            </p>
            <p className="text-sm text-black/70 mt-2">
              Max {formatFileSize(maxSize)} per photo
            </p>
          </div>
        </motion.div>
      </div>

      {/* Upload Preview Grid */}
      {uploads.length > 0 && (
        <div className="mt-8">
          <h4 className="text-xl font-semibold mb-4">
            Your Photos ({uploads.length})
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <AnimatePresence>
              {uploads.map(upload => (
                <motion.div
                  key={upload.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
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
                        <div className="text-black text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                          <span className="text-sm font-semibold">
                            {upload.progress}%
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    {upload.status === 'compressed' && (
                      <div className="absolute top-2 right-2 bg-green-500 text-black rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    
                    {upload.status === 'completed' && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <div className="bg-green-500 text-black rounded-full p-3">
                          <Check className="w-6 h-6" />
                        </div>
                      </div>
                    )}
                    
                    {/* Remove Button */}
                    {upload.status !== 'completed' && (
                      <button
                        onClick={() => removeUpload(upload.id)}
                        className="absolute top-2 right-2 bg-red-500 text-black rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4" />
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <p className="mt-2 text-sm text-black truncate">
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
              className="mt-8 flex justify-center"
            >
              <Button
                size="jumbo"
                variant="upload"
                onClick={confirmAllUploads}
                className="shadow-2xl"
              >
                <Upload className="w-8 h-8 mr-3" />
                Upload All Photos
              </Button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
