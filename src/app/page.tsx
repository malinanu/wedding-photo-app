'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GuestAuthOTPOnly } from '@/components/guest-auth-otp-only'
import { PhotoUpload } from '@/components/photo-upload'
import { PhotoGallery } from '@/components/photo-gallery'
import { Heart, Camera, Sparkles, LogOut, User, Clock, Upload, Images } from 'lucide-react'
import Confetti from 'react-confetti'
import { Button } from '@/components/ui/button'

interface GuestInfo {
  id: string
  name: string
  phone?: string
  email?: string
  tableId?: string
}

export default function Home() {
  const [step, setStep] = useState<'auth' | 'upload'>('auth')
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null)
  const [uploadedCount, setUploadedCount] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [eventId, setEventId] = useState<string>('')
  const [tableId, setTableId] = useState<string | undefined>()
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('upload')

  useEffect(() => {
    // Parse URL parameters (from QR code scan)
    const params = new URLSearchParams(window.location.search)
    const event = params.get('event') || 'default-event-id'
    const table = params.get('table') || undefined
    
    setEventId(event)
    setTableId(table)

    // Check for existing session
    const savedSession = localStorage.getItem('guestSession')
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession)
        // Check if session is expired
        if (session.expiresAt && new Date(session.expiresAt) > new Date()) {
          if (session.guest) {
            setGuestInfo(session.guest)
            setSessionExpiry(new Date(session.expiresAt))
            setStep('upload')
          }
        } else {
          // Session expired, clear it
          localStorage.removeItem('guestSession')
          console.log('Session expired, please login again')
        }
      } catch (error) {
        console.error('Invalid session', error)
        localStorage.removeItem('guestSession')
      }
    }
  }, [])

  const handleAuthenticated = (info: GuestInfo) => {
    setGuestInfo(info)
    // Set session expiry to 3 days from now
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 3)
    setSessionExpiry(expiry)
    setStep('upload')
  }
  
  const handleLogout = () => {
    localStorage.removeItem('guestSession')
    setGuestInfo(null)
    setSessionExpiry(null)
    setStep('auth')
    setUploadedCount(0)
  }
  
  // Format remaining session time
  const getSessionTimeRemaining = () => {
    if (!sessionExpiry) return null
    const now = new Date()
    const diff = sessionExpiry.getTime() - now.getTime()
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`
  }

  const handleUploadComplete = (files: any[]) => {
    setUploadedCount(prev => prev + files.length)
    setShowConfetti(true)
    
    // Show success briefly then switch to gallery
    setTimeout(() => {
      setShowConfetti(false)
      setActiveTab('gallery') // Switch to gallery to show uploaded photos
    }, 3000)
  }

  return (
    <main className="min-h-screen soft-texture">
      {/* Confetti Animation */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
          colors={['#C2B280', '#E7E1CC', '#F5F5F5']}
        />
      )}

      {/* Header - Simple and elegant */}
      {step === 'upload' && (
        <div className="pt-6 pb-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="heading-font text-3xl font-semibold text-[var(--text-dark)] mb-2">
              Sarah & John's Wedding
            </h1>
            <p className="body-font text-[var(--text-dark)] opacity-70">
              Share your memories with us
            </p>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {step === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <GuestAuthOTPOnly
                eventId={eventId}
                tableId={tableId}
                onAuthenticated={handleAuthenticated}
              />
            </motion.div>
          )}

          {step === 'upload' && guestInfo && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* User Info Bar - Simplified */}
              <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="heading-font text-lg font-medium text-[var(--text-dark)]">{guestInfo.name}</h3>
                    <div className="body-font flex items-center gap-2 text-sm text-[var(--text-dark)] opacity-60 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>Session valid for {getSessionTimeRemaining()}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="body-font px-3 py-2 text-sm font-medium text-[var(--text-dark)] bg-white border border-gray-200 rounded-lg hover:bg-[var(--subtle-accent)] transition-all flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>

              {/* Tab Navigation - Clean design */}
              <div className="bg-white rounded-xl shadow-sm mb-8 p-1">
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
                      activeTab === 'upload'
                        ? 'bg-[var(--primary-accent)] text-white shadow-sm'
                        : 'text-[var(--text-dark)] hover:bg-[var(--subtle-accent)]'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span className="body-font font-medium">Upload</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('gallery')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
                      activeTab === 'gallery'
                        ? 'bg-[var(--primary-accent)] text-white shadow-sm'
                        : 'text-[var(--text-dark)] hover:bg-[var(--subtle-accent)]'
                    }`}
                  >
                    <Images className="w-4 h-4" />
                    <span className="body-font font-medium">Gallery</span>
                    {uploadedCount > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                        {uploadedCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'upload' ? (
                  <motion.div
                    key="upload-tab"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <PhotoUpload
                      eventId={eventId}
                      onUploadComplete={handleUploadComplete}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="gallery-tab"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <PhotoGallery
                      guestId={guestInfo.id}
                      canViewAll={!!guestInfo.tableId}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Footer - Subtle */}
      <div className="fixed bottom-0 left-0 right-0 p-4 text-center">
        <p className="body-font text-xs text-[var(--text-dark)] opacity-50">
          Having trouble? Ask the wedding staff for help
        </p>
      </div>
    </main>
  )
}
