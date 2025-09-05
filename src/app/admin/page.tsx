'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Users, Image, Download, Settings, QrCode, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QRCodeCanvas as QRCodeComponent } from 'qrcode.react'

interface EventStats {
  totalGuests: number
  totalPhotos: number
  totalSize: number
  tables: number
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'qrcodes' | 'settings'>('overview')
  const [stats, setStats] = useState<EventStats>({
    totalGuests: 0,
    totalPhotos: 0,
    totalSize: 0,
    tables: 0,
  })
  const [qrCodes, setQrCodes] = useState<{ table: number; url: string }[]>([])

  useEffect(() => {
    // Generate QR codes for tables (example with 10 tables)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const eventId = 'wedding2025' // This would come from the event configuration
    
    const codes = Array.from({ length: 10 }, (_, i) => ({
      table: i + 1,
      url: `${baseUrl}?event=${eventId}&table=${i + 1}`
    }))
    
    setQrCodes(codes)
    
    // Fetch stats (mock data for now)
    setStats({
      totalGuests: 42,
      totalPhotos: 238,
      totalSize: 1.2 * 1024 * 1024 * 1024, // 1.2GB
      tables: 10,
    })
  }, [])

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(2)} GB`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
          <p className="text-black mt-2">Manage your wedding photo collection</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-6">
            {[
              { id: 'overview', label: 'Overview', icon: Calendar },
              { id: 'photos', label: 'Photos', icon: Image },
              { id: 'qrcodes', label: 'QR Codes', icon: QrCode },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-2 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-black'
                      : 'border-transparent text-black/70 hover:text-black'
                  }`}
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
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black text-sm">Total Guests</p>
                  <p className="text-3xl font-bold text-black">{stats.totalGuests}</p>
                </div>
                <Users className="w-12 h-12 text-purple-500 opacity-20" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black text-sm">Total Photos</p>
                  <p className="text-3xl font-bold text-black">{stats.totalPhotos}</p>
                </div>
                <Image className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black text-sm">Storage Used</p>
                  <p className="text-3xl font-bold text-black">{formatBytes(stats.totalSize)}</p>
                </div>
                <Download className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black text-sm">Tables</p>
                  <p className="text-3xl font-bold text-black">{stats.tables}</p>
                </div>
                <QrCode className="w-12 h-12 text-orange-500 opacity-20" />
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'qrcodes' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-black mb-2">QR Codes for Tables</h2>
              <p className="text-black">
                Print these QR codes and place them on each table for guests to scan
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {qrCodes.map((qr) => (
                <motion.div
                  key={qr.table}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-6 rounded-xl shadow-md text-center"
                >
                  <h3 className="text-lg font-bold mb-3">Table {qr.table}</h3>
                  <div className="bg-white p-2 inline-block rounded">
                    <QRCodeComponent
                      value={qr.url}
                      size={150}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        navigator.clipboard.writeText(qr.url)
                        alert('URL copied!')
                      }}
                    >
                      <Link className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        // Download QR code
                        const canvas = document.querySelector(`canvas`) as HTMLCanvasElement
                        const url = canvas.toDataURL()
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `table-${qr.table}-qr.png`
                        a.click()
                      }}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-xl">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Pro Tip</h3>
              <p className="text-blue-800">
                Print QR codes on tent cards or stickers for each table. 
                Consider adding instructions like "Scan to share your photos with the happy couple!"
              </p>
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Photo Gallery</h2>
            <p className="text-gray-600 mb-6">
              View and manage all uploaded photos
            </p>
            <Button size="lg" variant="upload">
              <Download className="w-5 h-5 mr-2" />
              Download All Photos
            </Button>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Event Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  defaultValue="Sarah & John's Wedding"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  defaultValue="2025-09-05"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Upload Size (MB)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  defaultValue="10"
                />
              </div>
              <Button size="lg" className="mt-4">
                Save Settings
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
