'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GuestAuth } from '@/components/guest-auth'
import { PhotoUpload } from '@/components/photo-upload'
import { Heart, Camera, Sparkles } from 'lucide-react'
import Confetti from 'react-confetti'

interface GuestInfo {
  name: string
  phone?: string
  email?: string
  tableId?: string
}

export default function Home() {
  const [step, setStep] = useState<'auth' | 'upload' | 'success'>('auth')
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null)
  const [uploadedCount, setUploadedCount] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [eventId, setEventId] = useState<string>('')
  const [tableId, setTableId] = useState<string | undefined>()

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
        if (session.guest) {
          setGuestInfo(session.guest)
          setStep('upload')
        }
      } catch (error) {
        console.error('Invalid session', error)
      }
    }
  }, [])

  const handleAuthenticated = (info: GuestInfo) => {
    setGuestInfo(info)
    setStep('upload')
  }

  const handleUploadComplete = (files: any[]) => {
    setUploadedCount(prev => prev + files.length)
    setShowConfetti(true)
    setStep('success')
    
    // Hide confetti after 5 seconds
    setTimeout(() => {
      setShowConfetti(false)
      setStep('upload') // Allow more uploads
    }, 5000)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Confetti Animation */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}

      {/* Header */}
      <div className="pt-8 pb-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-lg"
        >
          <Heart className="w-6 h-6 text-pink-500" />
          <span className="text-xl font-bold text-gray-800">
            Sarah & John's Wedding
          </span>
          <Heart className="w-6 h-6 text-pink-500" />
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-gray-600 text-lg"
        >
          Share your memories with us! 📸
        </motion.p>
      </div>

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
              <GuestAuth
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
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Welcome, {guestInfo.name}! 👋
                </h2>
                <p className="text-gray-600 mt-2">
                  {uploadedCount > 0 
                    ? `You've shared ${uploadedCount} photo${uploadedCount > 1 ? 's' : ''}. Keep them coming!`
                    : 'Ready to share your photos?'
                  }
                </p>
              </div>
              <PhotoUpload
                eventId={eventId}
                onUploadComplete={handleUploadComplete}
              />
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 0.5,
                  repeat: 2
                }}
                className="inline-block"
              >
                <div className="w-32 h-32 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-16 h-16 text-white" />
                </div>
              </motion.div>
              
              <h2 className="text-4xl font-bold text-gray-800 mb-4">
                Thank You! 🎉
              </h2>
              <p className="text-xl text-gray-600">
                Your photos have been uploaded successfully!
              </p>
              <p className="text-lg text-gray-500 mt-2">
                Redirecting you back...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 text-center bg-white/80 backdrop-blur-sm">
        <p className="text-sm text-gray-600">
          Having trouble? Ask the wedding staff for help 💕
        </p>
      </div>
    </main>
  )
}
