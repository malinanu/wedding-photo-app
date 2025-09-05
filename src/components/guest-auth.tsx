'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Phone, Mail, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GuestAuthProps {
  eventId: string
  tableId?: string
  onAuthenticated: (guestInfo: {
    name: string
    phone?: string
    email?: string
    tableId?: string
  }) => void
}

export function GuestAuth({ eventId, tableId, onAuthenticated }: GuestAuthProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      alert('Please enter your name')
      return
    }
    
    setIsLoading(true)
    
    try {
      // Call authentication API
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
        name,
        phone: phone || undefined,
        email: email || undefined,
        tableId: tableId || undefined,
      })
    } catch (error) {
      console.error('Authentication error:', error)
      alert('Something went wrong. Please try again.')
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
            <User className="w-10 h-10 text-black" />
          </div>
          <h2 className="text-3xl font-bold text-black mb-2">
            Welcome! 👋
          </h2>
          <p className="text-black">
            Tell us who you are
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field - Required */}
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
          
          {/* Phone Field - Optional */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Phone Number (optional)
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black/50 w-5 h-5" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="123-456-7890"
                className="w-full pl-12 pr-4 py-4 text-lg text-black border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>
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
        </form>
        
        <p className="text-xs text-black/70 text-center mt-6">
          Your information is kept private and secure
        </p>
      </div>
    </motion.div>
  )
}
