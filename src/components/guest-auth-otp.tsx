'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Phone, Mail, ArrowRight, Shield, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GuestAuthOTPProps {
  eventId: string
  tableId?: string
  onAuthenticated: (guestInfo: {
    name: string
    phone?: string
    email?: string
    tableId?: string
  }) => void
}

export function GuestAuthOTP({ eventId, tableId, onAuthenticated }: GuestAuthOTPProps) {
  const [step, setStep] = useState<'details' | 'otp'>('details')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const formatPhoneNumber = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as Sri Lankan number
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
  }

  const sendOTP = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const cleanPhone = phone.replace(/\D/g, '')
      
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
      
      setStep('otp')
      setResendTimer(60) // 60 seconds before resend
      
      // In development, auto-fill OTP if provided
      if (process.env.NODE_ENV === 'development' && data.otp) {
        const otpArray = data.otp.split('')
        setOtp(otpArray)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return // Only allow single digit
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
    
    // Auto-submit if all fields filled
    if (newOtp.every(digit => digit) && newOtp.length === 6) {
      verifyOTP(newOtp.join(''))
    }
  }

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const verifyOTP = async (otpCode?: string) => {
    const otpValue = otpCode || otp.join('')
    
    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const cleanPhone = phone.replace(/\D/g, '')
      
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: cleanPhone,
          otp: otpValue,
          eventId,
          name,
          email: email || undefined,
          tableId: tableId || undefined,
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
        name,
        phone: cleanPhone,
        email: email || undefined,
        tableId: tableId || undefined,
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Verification failed')
      // Clear OTP fields on error
      setOtp(['', '', '', '', '', ''])
      document.getElementById('otp-0')?.focus()
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
        <AnimatePresence mode="wait">
          {step === 'details' ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-black" />
                </div>
                <h2 className="text-3xl font-bold text-black mb-2">
                  Welcome! 👋
                </h2>
                <p className="text-black">
                  Let's get you verified
                </p>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); sendOTP() }} className="space-y-4">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Your Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black/50 w-5 h-5" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="w-full pl-12 pr-4 py-4 text-lg text-black border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>
                </div>
                
                {/* Phone Field - Required for OTP */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Phone Number * (Sri Lanka)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black/50 w-5 h-5" />
                    <span className="absolute left-12 top-1/2 transform -translate-y-1/2 text-black">
                      +94
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="71-234-5678"
                      required
                      maxLength={12}
                      className="w-full pl-20 pr-4 py-4 text-lg text-black border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>
                  <p className="text-xs text-black/70 mt-1">
                    We'll send you a verification code
                  </p>
                </div>
                
                {/* Email Field - Optional */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Email (optional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black/50 w-5 h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full pl-12 pr-4 py-4 text-lg text-black border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>
                </div>
                
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}
                
                {/* Submit Button */}
                <Button
                  type="submit"
                  size="xl"
                  variant="upload"
                  disabled={isLoading || !name.trim() || !phone.trim()}
                  className="w-full mt-6"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Get Verification Code
                      <ArrowRight className="w-6 h-6 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-10 h-10 text-black" />
                </div>
                <h2 className="text-3xl font-bold text-black mb-2">
                  Verify Your Phone
                </h2>
                <p className="text-black">
                  Enter the 6-digit code sent to
                </p>
                <p className="text-black font-semibold">
                  +94 {phone}
                </p>
              </div>
              
              {/* OTP Input Fields */}
              <div className="flex justify-center gap-2 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    className="w-12 h-14 text-2xl text-black text-center border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4">
                  {error}
                </div>
              )}
              
              {/* Verify Button */}
              <Button
                onClick={() => verifyOTP()}
                size="xl"
                variant="upload"
                disabled={isLoading || otp.some(digit => !digit)}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Continue
                    <ArrowRight className="w-6 h-6 ml-2" />
                  </>
                )}
              </Button>
              
              {/* Resend OTP */}
              <div className="text-center mt-4">
                {resendTimer > 0 ? (
                  <p className="text-black">
                    Resend code in {resendTimer} seconds
                  </p>
                ) : (
                  <button
                    onClick={sendOTP}
                    disabled={isLoading}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Resend Code
                  </button>
                )}
              </div>
              
              {/* Change Number */}
              <button
                onClick={() => {
                  setStep('details')
                  setOtp(['', '', '', '', '', ''])
                  setError('')
                }}
                className="text-black/70 hover:text-black text-sm mt-3 block mx-auto">
                Change phone number
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <p className="text-xs text-black/70 text-center mt-6">
          Your information is kept private and secure
        </p>
      </div>
    </motion.div>
  )
}
