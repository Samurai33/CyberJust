"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { authenticateDashboard, logoutDashboard } from "@/app/actions/auth"

interface AuthContextType {
  isAuthenticated: boolean
  isAuthenticating: boolean
  logoClickCount: number
  showAuthModal: boolean
  handleLogoClick: () => void
  authenticate: (code: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  closeAuthModal: () => void
  resetClickCount: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const REQUIRED_CLICKS = 3

export function AuthProvider({
  children,
  initialAuthenticated = false,
}: {
  children: React.ReactNode
  initialAuthenticated?: boolean
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [logoClickCount, setLogoClickCount] = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Reset click count after 5 seconds of inactivity
  useEffect(() => {
    if (logoClickCount > 0 && logoClickCount < REQUIRED_CLICKS) {
      const timer = setTimeout(() => {
        setLogoClickCount(0)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [logoClickCount])

  const handleLogoClick = useCallback(() => {
    if (isAuthenticated) return

    const newCount = logoClickCount + 1
    setLogoClickCount(newCount)

    if (newCount >= REQUIRED_CLICKS) {
      setShowAuthModal(true)
      setLogoClickCount(0)
    }
  }, [logoClickCount, isAuthenticated])

  const authenticate = useCallback(async (code: string) => {
    setIsAuthenticating(true)
    try {
      const result = await authenticateDashboard(code)
      if (result.success) {
        setIsAuthenticated(true)
        setShowAuthModal(false)
        setLogoClickCount(0)
      }
      return result
    } finally {
      setIsAuthenticating(false)
    }
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
    void logoutDashboard()
  }, [])

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false)
    setLogoClickCount(0)
  }, [])

  const resetClickCount = useCallback(() => {
    setLogoClickCount(0)
  }, [])

  const value: AuthContextType = {
    isAuthenticated,
    isAuthenticating,
    logoClickCount,
    showAuthModal,
    handleLogoClick,
    authenticate,
    logout,
    closeAuthModal,
    resetClickCount,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
