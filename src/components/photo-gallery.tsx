'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Eye, Users, User, Loader2, Image as ImageIcon, Camera, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { formatFileSize } from '@/lib/utils'

interface Photo {
  id: string
  fileName: string
  originalName: string
  url: string
  thumbnailUrl?: string
  size: string
  uploadedAt: string
  uploadedBy?: {
    name: string
    table?: string
  }
}

interface PhotoWithError extends Photo {
  hasError?: boolean
}

interface PhotoGalleryProps {
  guestId?: string
  canViewAll?: boolean
}

export function PhotoGallery({ guestId, canViewAll = false }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<PhotoWithError[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingAll, setViewingAll] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithError | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  // Fetch photos
  const fetchPhotos = async (viewAll: boolean = false) => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('guestSession')
      let authToken = ''
      
      if (token) {
        try {
          const session = JSON.parse(token)
          authToken = session.token || session.session?.token || ''
        } catch (e) {
          console.error('Failed to parse session')
        }
      }

      const response = await fetch(`/api/photos/list?viewAll=${viewAll}&t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch photos')
      }

      const data = await response.json()
      setPhotos(data.photos || [])
      setTotalCount(data.totalCount || 0)
      setViewingAll(data.viewingMode === 'all')
    } catch (error) {
      console.error('Error fetching photos:', error)
      setError('Failed to load photos. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPhotos(canViewAll && viewingAll)
  }, [])

  // Toggle between own photos and all photos
  const toggleViewMode = () => {
    const newViewAll = !viewingAll
    setViewingAll(newViewAll)
    fetchPhotos(newViewAll)
  }

  // Handle image load error
  const handleImageError = (photoId: string) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === photoId ? { ...photo, hasError: true } : photo
    ))
  }

  // Download photo
  const downloadPhoto = async (photo: PhotoWithError) => {
    if (photo.hasError) {
      alert('Photo is no longer available for download')
      return
    }
    
    try {
      const response = await fetch(photo.url)
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = photo.originalName || photo.fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download photo. It may no longer be available.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-accent)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="body-font text-red-500">{error}</p>
        <Button 
          onClick={() => fetchPhotos(viewingAll)} 
          className="mt-4 btn-primary"
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-20">
        <Camera className="w-16 h-16 text-[var(--primary-accent)] opacity-30 mx-auto mb-4" />
        <h3 className="heading-font text-lg font-semibold text-[var(--text-dark)] mb-2">
          No Photos Yet
        </h3>
        <p className="body-font text-[var(--text-dark)] opacity-70">
          {viewingAll ? 'No photos have been uploaded to this event yet.' : 'You haven\'t uploaded any photos yet.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="heading-font text-2xl font-semibold text-[var(--text-dark)] mb-2">
          {viewingAll ? 'All Event Photos' : 'Your Photos'}
        </h3>
        <p className="body-font text-sm text-[var(--text-dark)] opacity-60">
          {totalCount} photo{totalCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {canViewAll && (
          <Button
            onClick={toggleViewMode}
            variant="outline"
            className="body-font px-4 py-2 text-sm font-medium text-[var(--text-dark)] bg-white border-2 border-gray-200 rounded-xl hover:bg-[var(--subtle-accent)] hover:border-[var(--primary-accent)] transition-all"
          >
            {viewingAll ? (
              <>
                <User className="w-4 h-4 mr-2" />
                My Photos
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                All Photos
              </>
            )}
          </Button>
        )}
        
        <Button
          onClick={() => fetchPhotos(viewingAll)}
          variant="outline"
          className="body-font px-3 py-2 text-sm font-medium text-[var(--text-dark)] bg-white border-2 border-gray-200 rounded-xl hover:bg-[var(--subtle-accent)] hover:border-[var(--primary-accent)] transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>


      {/* Photo Grid - Minimalist Design */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <AnimatePresence>
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
              className="relative group cursor-pointer"
              onClick={() => !photo.hasError && setSelectedPhoto(photo)}
            >
              <div className="aspect-square rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all">
                {photo.hasError ? (
                  /* Fallback for broken images */
                  <div className="w-full h-full bg-[var(--subtle-accent)] flex flex-col items-center justify-center text-[var(--text-dark)] opacity-60">
                    <Camera className="w-8 h-8 mb-2" />
                    <span className="body-font text-xs text-center px-2">
                      Image unavailable
                    </span>
                  </div>
                ) : (
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.originalName}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                    onError={() => handleImageError(photo.id)}
                  />
                )}
              </div>
              
              {/* Simple hover overlay - minimalist approach */}
              {!photo.hasError && (
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedPhoto(photo)
                    }}
                    className="p-3 bg-white/90 hover:bg-white rounded-full text-[var(--text-dark)] shadow-lg"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      downloadPhoto(photo)
                    }}
                    className="p-3 bg-white/90 hover:bg-white rounded-full text-[var(--text-dark)] shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Error overlay for broken images */}
              {photo.hasError && (
                <div className="absolute inset-0 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <X className="w-6 h-6 text-red-500 mx-auto mb-1" />
                    <span className="body-font text-xs text-red-600">Unavailable</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Photo Viewer Modal - Clean and minimal */}
      <AnimatePresence>
        {selectedPhoto && !selectedPhoto.hasError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-5xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.originalName}
                className="w-full h-full object-contain rounded-lg"
                onError={() => {
                  handleImageError(selectedPhoto.id)
                  setSelectedPhoto(null)
                }}
              />
              
              {/* Close button */}
              <Button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors border-none"
                variant="ghost"
              >
                <X className="w-5 h-5" />
              </Button>

              {/* Download button */}
              <Button
                onClick={() => downloadPhoto(selectedPhoto)}
                className="absolute top-4 right-16 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors border-none"
                variant="ghost"
              >
                <Download className="w-5 h-5" />
              </Button>

              {/* Photo info */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
                <p className="body-font font-medium">{selectedPhoto.originalName}</p>
                <div className="flex items-center gap-4 text-sm opacity-80 mt-1">
                  <span>{formatFileSize(parseInt(selectedPhoto.size))}</span>
                  <span>{new Date(selectedPhoto.uploadedAt).toLocaleDateString()}</span>
                  {selectedPhoto.uploadedBy && (
                    <span>by {selectedPhoto.uploadedBy.name}</span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
