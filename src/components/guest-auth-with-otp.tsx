'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Phone, Mail, ArrowRight, MessageSquare, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GuestAuthProps {
  eventId: string
  tableId?: string
  onAuthenticated: (guestInfo: {
    id: string
    name: string
    phone?: string
    email?: string
    tableId?: string
  }) => void
}

export function GuestAuthWithOTP({ eventId, tableId, onAuthenticated }: GuestAuthProps) {
  const [authMode, setAuthMode] = useState<'simple' | 'otp'>('simple')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [error, setError] = useState('')

  // Start OTP resend timer
  const startOtpTimer = () => {
    setOtpTimer(60) // 60 seconds
    const interval = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendOTP = async () => {
    if (!phone) {
      setError('Please enter your phone number')
      return
    }

    // Basic phone validation
    const phoneRegex = /^[0-9]{10}$/
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    
    if (!phoneRegex.test(cleanPhone)) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: cleanPhone,
          eventId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      setOtpSent(true)
      startOtpTimer()
      
      // In development, show the OTP
      if (process.env.NODE_ENV === 'development' && data.otp) {
        console.log('Development OTP:', data.otp)
        alert(`Development mode - Your OTP is: ${data.otp}`)
      }
    } catch (error) {
      console.error('OTP send error:', error)
      setError(error instanceof Error ? error.message : 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone.replace(/[\s\-\(\)]/g, ''),
          otp,
          eventId,
          name,
          tableId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP')
      }

      // Store session
      localStorage.setItem('guestSession', JSON.stringify(data))

      // Callback with guest info
      onAuthenticated({
        id: data.guest.id,
        name: data.guest.name,
        phone: data.guest.phone,
        email: data.guest.email,
        tableId: data.guest.tableId,
      })
    } catch (error) {
      console.error('OTP verification error:', error)
      setError(error instanceof Error ? error.message : 'Invalid OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSimpleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          name,
          phone: phone || undefined,
          email: email || undefined,
          tableId: tableId || undefined,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Authentication failed')
      }
      
      const data = await response.json()
      
      // Store session
      localStorage.setItem('guestSession', JSON.stringify(data))
      
      // Callback with guest info
      onAuthenticated({
        id: data.guest.id,
        name,
        phone: phone || undefined,
        email: email || undefined,
        tableId: tableId || undefined,
      })
    } catch (error) {
      console.error('Authentication error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto p-6"
    >
      <div className="bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome! 👋
          </h2>
          <p className="text-gray-600">
            Tell us who you are
          </p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => {
              setAuthMode('simple')
              setError('')
              setOtpSent(false)
            }}
            className={`flex-1 py-2 px-4 rounded-lg transition-all ${
              authMode === 'simple'
                ? 'bg-white shadow text-purple-600 font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Quick Login
          </button>
          <button
            onClick={() => {
              setAuthMode('otp')
              setError('')
            }}
            className={`flex-1 py-2 px-4 rounded-lg transition-all ${
              authMode === 'otp'
                ? 'bg-white shadow text-purple-600 font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <Shield className="w-4 h-4" />
              <span>Secure Login</span>
            </div>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {authMode === 'simple' ? (
            <motion.form
              key="simple"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSimpleAuth}
              className="space-y-4"
            >
              {/* Name Field - Required */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full pl-12 pr-4 py-4 text-lg text-gray-900 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </div>
              </div>
              
              {/* Phone Field - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="123-456-7890"
                    className="w-full pl-12 pr-4 py-4 text-lg text-gray-900 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </div>
              </div>
              
              {/* Email Field - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full pl-12 pr-4 py-4 text-lg text-gray-900 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </div>
              </div>
              
              {/* Submit Button */}
              <Button
                type="submit"
                size="xl"
                variant="upload"
                disabled={isLoading || !name.trim()}
                className="w-full mt-6"
              >
                {isLoading ? (
                  'Please wait...'
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-6 h-6 ml-2" />
                  </>
                )}
              </Button>
            </motion.form>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    disabled={otpSent}
                    className="w-full pl-12 pr-4 py-4 text-lg text-gray-900 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all disabled:bg-gray-50"
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="123-456-7890"
                    required
                    disabled={otpSent}
                    className="w-full pl-12 pr-4 py-4 text-lg text-gray-900 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all disabled:bg-gray-50"
                  />
                </div>
              </div>

              {!otpSent ? (
                <Button
                  type="button"
                  size="xl"
                  variant="upload"
                  onClick={handleSendOTP}
                  disabled={isLoading || !name.trim() || !phone.trim()}
                  className="w-full mt-6"
                >
                  {isLoading ? (
                    'Sending OTP...'
                  ) : (
                    <>
                      Send OTP
                      <MessageSquare className="w-6 h-6 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <>
                  {/* OTP Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="w-full px-4 py-4 text-center text-2xl font-mono text-gray-900 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all tracking-widest"
                    />
                    
                    {otpTimer > 0 ? (
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        Resend OTP in {otpTimer} seconds
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        className="text-sm text-purple-600 hover:text-purple-700 mt-2 w-full text-center"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="xl"
                    variant="upload"
                    onClick={handleVerifyOTP}
                    disabled={isLoading || otp.length !== 6}
                    className="w-full mt-6"
                  >
                    {isLoading ? (
                      'Verifying...'
                    ) : (
                      <>
                        Verify & Continue
                        <Shield className="w-6 h-6 ml-2" />
                      </>
                    )}
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        <p className="text-xs text-gray-500 text-center mt-6">
          Your information is kept private and secure
        </p>
      </div>
    </motion.div>
  )
}
