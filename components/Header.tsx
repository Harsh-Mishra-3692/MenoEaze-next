'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { usePathname } from 'next/navigation'
import AuthModal from './AuthModal'
import SymptomForm from './SymptomForm'
import { Menu, X, Bot } from 'lucide-react'

export default function Header() {
  const { isAuthenticated, logout, user } = useAuth()
  const pathname = usePathname()

  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + '/')

  const navClass = (path: string) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive(path)
        ? 'text-purple-600 bg-purple-50'
        : 'text-gray-700 hover:text-purple-600'
    }`

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }

      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setLogOpen(false)
      }
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false)
        setLogOpen(false)
        setAuthOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)

    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U'

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b shadow-sm">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          <Link href="/" className="flex items-center gap-2">
            ❤️
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              MenoEaze
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">

            <Link href="/" className={navClass('/')}>Home</Link>

            {isAuthenticated && (
              <>
                <Link href="/dashboard" className={navClass('/dashboard')}>
                  Dashboard
                </Link>

                <Link href="/assistant" className={`${navClass('/assistant')} flex items-center gap-1`}>
                  <Bot size={16} className="text-purple-500 animate-pulse" />
                  AI Assistant
                </Link>

                <button
                  onClick={() => setLogOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-md transition"
                >
                  + Log Symptom
                </button>
              </>
            )}

            <Link href="/community" className={navClass('/community')}>
              Community
            </Link>

            {isAuthenticated ? (
              <div className="relative ml-4" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(p => !p)}
                  className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white flex items-center justify-center font-semibold text-sm"
                >
                  {userInitial}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-lg border py-2">
                    <div className="px-4 py-2 text-xs text-gray-500 truncate">
                      {user?.email}
                    </div>

                    <div className="border-t my-1" />

                    <button
                      onClick={() => {
                        logout()
                        setDropdownOpen(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-500"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthMode('login')
                    setAuthOpen(true)
                  }}
                  className="text-sm text-gray-700 hover:text-purple-600"
                >
                  Sign In
                </button>

                <button
                  onClick={() => {
                    setAuthMode('signup')
                    setAuthOpen(true)
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(p => !p)}
            className="md:hidden"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </header>

      {/* Log Modal */}
      {logOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            ref={modalRef}
            className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-8 relative animate-[fadeIn_.2s_ease]"
          >
            <button
              onClick={() => setLogOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            >
              ✕
            </button>

            <SymptomForm onSuccess={() => setLogOpen(false)} />
          </div>
        </div>
      )}

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />
    </>
  )
}