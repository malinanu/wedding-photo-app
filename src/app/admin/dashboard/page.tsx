'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Users, 
  Image, 
  Download, 
  Settings, 
  QrCode, 
  Link,
  Menu,
  X,
  Eye,
  Trash2,
  Search,
  Filter,
  Camera
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QRCodeCanvas as QRCodeComponent } from 'qrcode.react'
import { cn } from '@/lib/utils'

interface EventStats {
  totalGuests: number
  totalPhotos: number
  totalSize: number
  tables: number
}

interface Photo {
  id: string
  fileName: string
  thumbnailUrl: string
  cloudUrl: string
  size: number
  uploadedAt: string
  guestName: string
}

interface PhotoWithError extends Photo {
  hasError?: boolean
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'qrcodes' | 'settings'>('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [stats, setStats] = useState<EventStats>({
    totalGuests: 0,
    totalPhotos: 0,
    totalSize: 0,
    tables: 0,
  })
  const [photos, setPhotos] = useState<PhotoWithError[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithError | null>(null)
  const [eventQRCode, setEventQRCode] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchPhotos()
    generateQRCode()
  }, [])

  const fetchStats = async () => {
    try {
      console.log('Fetching admin stats...')
      const response = await fetch('/api/admin/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Stats fetched successfully:', data)
        setStats({
          totalGuests: data.totalGuests || 0,
          totalPhotos: data.totalPhotos || 0,
          totalSize: data.totalSize || 0,
          tables: data.tables || 1
        })
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch stats - HTTP error:', response.status, errorText)
        // Set empty stats on error
        setStats({
          totalGuests: 0,
          totalPhotos: 0,
          totalSize: 0,
          tables: 1,
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats - Network error:', error)
      // Set empty stats on error
      setStats({
        totalGuests: 0,
        totalPhotos: 0,
        totalSize: 0,
        tables: 1,
      })
    }
  }

  const fetchPhotos = async () => {
    setLoading(true)
    try {
      console.log('Fetching admin photos...')
      const response = await fetch('/api/admin/photos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Photos fetched successfully:', data)
        setPhotos(data.photos || [])
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch photos - HTTP error:', response.status, errorText)
        setPhotos([])
      }
    } catch (error) {
      console.error('Failed to fetch photos - Network error:', error)
      setPhotos([])
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const eventId = 'default-event-id'
    const qrUrl = `${baseUrl}?event=${eventId}`
    setEventQRCode(qrUrl)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Handle image error
  const handleImageError = (photoId: string) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === photoId ? { ...photo, hasError: true } : photo
    ))
  }

  const downloadAllPhotos = async () => {
    // Implementation for downloading all photos
    alert('Downloading all photos... (This feature will be implemented)')
  }

  const cleanupOrphanedPhotos = async () => {
    if (!confirm('This will remove photo records that don\'t have valid image files. Continue?')) {
      return
    }

    try {
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Cleanup completed: ${result.message}`)
        
        // Refresh data
        fetchStats()
        fetchPhotos()
      } else {
        alert('Cleanup failed. Please try again.')
      }
    } catch (error) {
      console.error('Cleanup failed:', error)
      alert('Cleanup failed. Please check console for details.')
    }
  }

  const deletePhoto = async (photoId: string) => {
    if (confirm('Are you sure you want to delete this photo?')) {
      try {
        const response = await fetch(`/api/admin/photos/${photoId}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          setPhotos(prev => prev.filter(p => p.id !== photoId))
          setSelectedPhoto(null)
        }
      } catch (error) {
        console.error('Failed to delete photo:', error)
      }
    }
  }

  const filteredPhotos = photos.filter(photo => 
    photo.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    photo.guestName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const StatCard = ({ title, value, icon: Icon, color, delay = 0 }: { 
    title: string
    value: string | number
    icon: any
    color: string
    delay?: number
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white p-4 md:p-6 rounded-xl shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="body-font text-sm text-[var(--text-dark)] opacity-60">{title}</p>
          <p className="heading-font text-2xl md:text-3xl font-semibold text-[var(--text-dark)] mt-1">{value}</p>
        </div>
        <Icon className={cn("w-10 h-10 md:w-12 md:h-12 opacity-20", color)} />
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen soft-texture">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-font text-2xl md:text-3xl font-semibold text-[var(--text-dark)]">
                Admin Dashboard
              </h1>
              <p className="body-font text-[var(--text-dark)] opacity-70 text-sm md:text-base mt-1">
                Wedding Photo Management
              </p>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-[var(--subtle-accent)] hover:bg-[var(--primary-accent)] hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={cn(
        "bg-white shadow-sm transition-all duration-300 md:block",
        mobileMenuOpen ? "block" : "hidden"
      )}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:gap-6">
            {[
              { id: 'overview', label: 'Overview', icon: Calendar },
              { id: 'photos', label: 'Photos', icon: Image },
              { id: 'qrcodes', label: 'QR Code', icon: QrCode },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any)
                    setMobileMenuOpen(false)
                  }}
                  className={cn(
                    "py-3 md:py-4 px-2 flex items-center gap-2 border-b-2 transition-colors body-font font-medium",
                    activeTab === tab.id
                      ? "border-[var(--primary-accent)] text-[var(--primary-accent)]"
                      : "border-transparent text-[var(--text-dark)] opacity-70 hover:opacity-100"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatCard 
                title="Total Guests" 
                value={stats.totalGuests} 
                icon={Users} 
                color="text-[var(--primary-accent)]"
                delay={0}
              />
              <StatCard 
                title="Total Photos" 
                value={stats.totalPhotos} 
                icon={Image} 
                color="text-[var(--primary-accent)]"
                delay={0.1}
              />
              <StatCard 
                title="Storage Used" 
                value={formatBytes(stats.totalSize)} 
                icon={Download} 
                color="text-[var(--primary-accent)]"
                delay={0.2}
              />
              <StatCard 
                title="QR Code" 
                value="1" 
                icon={QrCode} 
                color="text-[var(--primary-accent)]"
                delay={0.3}
              />
            </div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <h2 className="heading-font text-xl font-semibold text-[var(--text-dark)] mb-4">Recent Activity</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="body-font font-medium text-[var(--text-dark)]">New photos uploaded</p>
                    <p className="body-font text-sm text-[var(--text-dark)] opacity-60">5 minutes ago</p>
                  </div>
                  <span className="body-font text-sm font-medium text-[var(--primary-accent)]">+12 photos</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="body-font font-medium text-[var(--text-dark)]">New guest registered</p>
                    <p className="body-font text-sm text-[var(--text-dark)] opacity-60">15 minutes ago</p>
                  </div>
                  <span className="body-font text-sm font-medium text-[var(--primary-accent)]">John Doe</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            {/* Search and Actions */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="relative flex-1 w-full md:max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search photos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="body-font w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[var(--primary-accent)] text-[var(--text-dark)] transition-all"
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={cleanupOrphanedPhotos}
                    className="px-4 py-3 text-sm font-medium text-[var(--text-dark)] bg-white border-2 border-gray-200 rounded-xl hover:bg-[var(--subtle-accent)] hover:border-[var(--primary-accent)] transition-all flex items-center justify-center gap-2 flex-1 md:flex-none"
                  >
                    <Trash2 className="w-4 h-4" />
                    Cleanup
                  </button>
                  <button
                    onClick={downloadAllPhotos}
                    className="btn-primary px-6 py-3 text-sm font-medium rounded-xl shadow-lg flex items-center justify-center gap-2 flex-1 md:flex-none"
                  >
                    <Download className="w-5 h-5" />
                    Download All
                  </button>
                </div>
              </div>
            </div>

            {/* Photo Grid */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-accent)]"></div>
                  <p className="body-font mt-4 text-[var(--text-dark)] opacity-70">Loading photos...</p>
                </div>
              ) : filteredPhotos.length === 0 ? (
                <div className="text-center py-12">
                  <Image className="w-16 h-16 mx-auto text-[var(--primary-accent)] opacity-30 mb-4" />
                  <p className="body-font text-[var(--text-dark)] opacity-70">No photos uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredPhotos.map((photo) => (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group cursor-pointer"
                      onClick={() => !photo.hasError && setSelectedPhoto(photo)}
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm">
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
                            src={photo.thumbnailUrl}
                            alt={photo.fileName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={() => handleImageError(photo.id)}
                          />
                        )}
                      </div>
                      
                      {!photo.hasError && (
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                          <button className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
                            <Eye className="w-4 h-4 text-[var(--text-dark)]" />
                          </button>
                          <button 
                            className="p-2 bg-white/90 rounded-full hover:bg-red-100 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              deletePhoto(photo.id)
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
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
                      
                      <div className="mt-2">
                        <p className="body-font text-xs text-[var(--text-dark)] opacity-70 truncate">{photo.fileName}</p>
                        <p className="body-font text-xs text-[var(--text-dark)] opacity-50">{photo.guestName}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR Code Tab */}
        {activeTab === 'qrcodes' && (
          <div className="space-y-6">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm">
              <h2 className="heading-font text-xl md:text-2xl font-semibold text-[var(--text-dark)] mb-2">Event QR Code</h2>
              <p className="body-font text-[var(--text-dark)] opacity-70 mb-6">
                Print this QR code and display it at the venue entrance or on tables for guests to scan
              </p>

              <div className="flex justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="soft-texture p-8 rounded-xl text-center max-w-md"
                >
                  <h3 className="heading-font text-2xl font-semibold text-[var(--text-dark)] mb-6">Wedding Photo Upload</h3>
                  <div className="bg-white p-4 inline-block rounded-xl shadow-sm">
                    <QRCodeComponent
                      value={eventQRCode}
                      size={250}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="body-font mt-4 text-sm text-[var(--text-dark)] opacity-70 mb-6">
                    Scan to share your photos with the happy couple
                  </p>
                  <div className="flex gap-3">
                    <button
                      className="flex-1 px-4 py-3 text-sm font-medium text-[var(--text-dark)] bg-white border-2 border-gray-200 rounded-xl hover:bg-[var(--subtle-accent)] transition-all flex items-center justify-center gap-2"
                      onClick={() => {
                        navigator.clipboard.writeText(eventQRCode)
                        alert('URL copied to clipboard!')
                      }}
                    >
                      <Link className="w-4 h-4" />
                      Copy Link
                    </button>
                    <button
                      className="btn-primary flex-1 py-3 text-sm font-medium rounded-xl shadow-lg flex items-center justify-center gap-2"
                      onClick={() => {
                        const canvas = document.querySelector('canvas') as HTMLCanvasElement
                        const url = canvas.toDataURL()
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'wedding-photo-qr.png'
                        a.click()
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Download QR
                    </button>
                  </div>
                </motion.div>
              </div>

              <div className="mt-8 p-4 bg-[var(--subtle-accent)] rounded-xl">
                <h3 className="heading-font text-lg font-medium text-[var(--text-dark)] mb-2">Pro Tip</h3>
                <p className="body-font text-[var(--text-dark)] opacity-80 text-sm md:text-base">
                  Print QR codes on tent cards or stickers for each table. 
                  Consider adding instructions like "Scan to share your photos with the happy couple!"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm">
            <h2 className="heading-font text-xl md:text-2xl font-semibold text-[var(--text-dark)] mb-6">Event Settings</h2>
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block body-font text-sm font-medium text-[var(--text-dark)] mb-3">
                  Event Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[var(--primary-accent)] text-[var(--text-dark)] transition-all"
                  defaultValue="Sarah & John's Wedding"
                />
              </div>
              <div>
                <label className="block body-font text-sm font-medium text-[var(--text-dark)] mb-3">
                  Event Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[var(--primary-accent)] text-[var(--text-dark)] transition-all"
                  defaultValue="2025-09-05"
                />
              </div>
              <div>
                <label className="block body-font text-sm font-medium text-[var(--text-dark)] mb-3">
                  Venue
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[var(--primary-accent)] text-[var(--text-dark)] transition-all"
                  defaultValue="Grand Ballroom Hotel"
                />
              </div>
              <div>
                <label className="block body-font text-sm font-medium text-[var(--text-dark)] mb-3">
                  Max Upload Size (MB)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[var(--primary-accent)] text-[var(--text-dark)] transition-all"
                  defaultValue="10"
                />
              </div>
              <div>
                <label className="block body-font text-sm font-medium text-[var(--text-dark)] mb-3">
                  Event Passcode (Optional)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[var(--primary-accent)] text-[var(--text-dark)] transition-all"
                  placeholder="Leave empty for no passcode"
                  defaultValue="1234"
                />
              </div>
              <button className="btn-primary px-8 py-3 text-sm font-medium rounded-xl shadow-lg mt-6 w-full md:w-auto">
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Photo Viewer Modal */}
      {selectedPhoto && !selectedPhoto.hasError && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.cloudUrl}
              alt={selectedPhoto.fileName}
              className="w-full h-full object-contain rounded-lg"
              onError={() => {
                handleImageError(selectedPhoto.id)
                setSelectedPhoto(null)
              }}
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Download button */}
            <button
              onClick={() => {
                // Download functionality for admin
                const link = document.createElement('a')
                link.href = selectedPhoto.cloudUrl
                link.download = selectedPhoto.fileName
                link.click()
              }}
              className="absolute top-4 right-16 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>

            <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
              <p className="body-font font-medium">{selectedPhoto.fileName}</p>
              <p className="body-font text-sm opacity-80">Uploaded by {selectedPhoto.guestName}</p>
              <p className="body-font text-sm opacity-70">{formatBytes(selectedPhoto.size)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
