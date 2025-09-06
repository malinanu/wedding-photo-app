'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Simple hardcoded authentication for demo
      // In production, this should call your authentication API
      if (username === 'admin' && password === 'admin123') {
        // Set auth status and redirect
        localStorage.setItem('adminAuthenticated', 'true')
        router.push('/admin/dashboard')
      } else {
        setError('Invalid username or password')
      }
    } catch (error) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen soft-texture flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[var(--primary-accent)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="heading-font text-3xl font-semibold text-[var(--text-dark)] mb-2">
              Admin Portal
            </h1>
            <p className="body-font text-[var(--text-dark)] opacity-70">
              Wedding Photo Management
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

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block body-font text-sm font-medium text-[var(--text-dark)] mb-3">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="w-full px-4 py-4 text-lg text-[var(--text-dark)] bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[var(--primary-accent)] transition-all"
              />
            </div>

            <div>
              <label className="block body-font text-sm font-medium text-[var(--text-dark)] mb-3">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full px-4 py-4 pr-12 text-lg text-[var(--text-dark)] bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[var(--primary-accent)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[var(--text-dark)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !username.trim() || !password.trim()}
              className="btn-primary w-full py-4 text-lg font-medium rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-[var(--subtle-accent)] rounded-xl">
            <p className="body-font text-xs text-[var(--text-dark)] opacity-70 text-center">
              Demo credentials: admin / admin123
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
