'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Phone, MessageSquare, Shield, ArrowRight } from 'lucide-react'
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

export function GuestAuthOTPOnly({ eventId, tableId, onAuthenticated }: GuestAuthProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
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

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '')
    
    // Format as XXX-XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    } else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
    }
  }

  const handleSendOTP = async () => {
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    if (!phone) {
      setError('Please enter your phone number')
      return
    }

    // Basic phone validation
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    const phoneRegex = /^[0-9]{10}$/
    
    if (!phoneRegex.test(cleanPhone)) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // For testing/development, use a mock OTP
      if (process.env.NODE_ENV === 'development') {
        setOtpSent(true)
        startOtpTimer()
        const mockOtp = '123456'
        console.log('Development OTP:', mockOtp)
        setTimeout(() => {
          alert(`Development mode - Your OTP is: ${mockOtp}`)
        }, 500)
        setIsLoading(false)
        return
      }

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
      if (data.otp) {
        console.log('Development OTP:', data.otp)
        alert(`Development mode - Your OTP is: ${data.otp}`)
      }
    } catch (error) {
      console.error('OTP send error:', error)
      setError(error instanceof Error ? error.message : 'Failed to send OTP. Please try again.')
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
      // For development, accept mock OTP
      if (process.env.NODE_ENV === 'development' && otp === '123456') {
        // Create a real session in development mode
        const mockResponse = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: phone.replace(/[\s\-\(\)]/g, ''),
            otp: '123456', // This will need to be handled in the API
            eventId,
            name,
            tableId,
          }),
        })
        
        if (mockResponse.ok) {
          const data = await mockResponse.json()
          // Store session with proper structure
          const sessionData = {
            guest: data.guest,
            session: data.session,
            token: data.session?.token,
            expiresAt: data.session?.expiresAt
          }
          localStorage.setItem('guestSession', JSON.stringify(sessionData))
          onAuthenticated(data.guest)
        } else {
          // Fallback for dev mode
          const mockGuest = {
            id: 'guest-' + Date.now(),
            name,
            phone: phone.replace(/[\s\-\(\)]/g, ''),
            tableId,
            eventId
          }
          
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + 3) // 3 days
          
          // For dev mode, we'll use a simple token
          localStorage.setItem('guestSession', JSON.stringify({
            guest: mockGuest,
            session: { token: 'dev-token' },
            token: 'dev-token',
            expiresAt: expiresAt.toISOString()
          }))
          
          onAuthenticated(mockGuest)
        }
        setIsLoading(false)
        return
      }

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

      // Store session with proper structure
      const sessionData = {
        guest: data.guest,
        session: data.session,
        token: data.session?.token,
        expiresAt: data.session?.expiresAt
      }
      localStorage.setItem('guestSession', JSON.stringify(sessionData))

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
      setError(error instanceof Error ? error.message : 'Invalid OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto p-6"
    >
      <div className="soft-texture rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="heading-font text-4xl font-semibold text-[var(--text-dark)] mb-4">
            Welcome to Sarah & John's Gallery
          </h1>
          <p className="body-font text-lg text-[var(--text-dark)] opacity-80">
            Please enter your name to start uploading
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
          >
            <p className="body-font text-sm text-red-600">{error}</p>
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Name Field */}
          <div>
            <label className="block body-font text-sm font-medium text-[var(--text-dark)] mb-3">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              disabled={otpSent}
              className="w-full px-4 py-4 text-lg text-[var(--text-dark)] bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[var(--primary-accent)] transition-all disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Phone Field */}
          <div>
            <label className="block body-font text-sm font-medium text-[var(--text-dark)] mb-3">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              placeholder="123-456-7890"
              required
              disabled={otpSent}
              maxLength={12}
              className="w-full px-4 py-4 text-lg text-[var(--text-dark)] bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[var(--primary-accent)] transition-all disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {!otpSent ? (
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={isLoading || !name.trim() || !phone.trim()}
              className="btn-primary w-full py-4 text-lg font-medium rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending...
                </span>
              ) : (
                "Continue"
              )}
            </button>
          ) : (
            <>
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Verification Code
                </label>
                <div className="flex gap-2 justify-center mb-4">
                  {[...Array(6)].map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      value={otp[i] || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        const newOtp = otp.split('')
                        newOtp[i] = value
                        setOtp(newOtp.join(''))
                        
                        // Auto-focus next input
                        if (value && i < 5) {
                          const target = e.target as HTMLInputElement
                          const nextInput = target.parentElement?.children[i + 1] as HTMLInputElement
                          nextInput?.focus()
                        }
                      }}
                      onKeyDown={(e) => {
                        // Handle backspace
                        if (e.key === 'Backspace' && !otp[i] && i > 0) {
                          const target = e.target as HTMLInputElement
                          const prevInput = target.parentElement?.children[i - 1] as HTMLInputElement
                          prevInput?.focus()
                        }
                      }}
                      className="w-12 h-14 text-center text-2xl font-mono text-gray-900 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  ))}
                </div>
                
                {otpTimer > 0 ? (
                  <p className="text-sm text-gray-500 text-center">
                    Resend code in {otpTimer} seconds
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="text-sm text-purple-600 hover:text-purple-700 w-full text-center font-medium"
                  >
                    Resend verification code
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleVerifyOTP}
                disabled={isLoading || otp.length !== 6}
                className="btn-primary w-full py-4 text-lg font-medium rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-8"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </span>
                ) : (
                  "Let's Go!"
                )}
              </button>
            </>
          )}
        </div>
        
        <p className="body-font text-xs text-[var(--text-dark)] opacity-60 text-center mt-8">
          Your phone number will only be used for this event
        </p>
      </div>
    </motion.div>
  )
}
