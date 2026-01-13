"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export type UserRole = "ADMIN" | "BASE_COMMANDER" | "LOGISTICS_OFFICER"

export interface User {
  id: string
  email: string
  role: UserRole
  baseId?: string
  baseName?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Hydrate auth state from localStorage after mount (client-only)
  useEffect(() => {
    try {
      const savedUserStr = typeof window !== "undefined" ? localStorage.getItem("user") : null
      const savedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null

      if (savedUserStr && savedToken) {
        const parsedUser: User = JSON.parse(savedUserStr)
        setUser(parsedUser)
        setToken(savedToken)
      } else {
        // Clean up inconsistent state
        if (typeof window !== "undefined") {
          localStorage.removeItem("user")
          localStorage.removeItem("token")
        }
        setUser(null)
        setToken(null)
      }
    } catch {
      // Reset on any error
      setUser(null)
      setToken(null)
      if (typeof window !== "undefined") {
        localStorage.removeItem("user")
        localStorage.removeItem("token")
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      let API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
      if (API_URL.endsWith("/")) API_URL = API_URL.slice(0, -1)

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Login failed")
      }

      const data = await res.json()
      const newUser: User = data.user
      const newToken: string = data.token

      // Persist and update state
      setUser(newUser)
      setToken(newToken)
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(newUser))
        localStorage.setItem("token", newToken)
      }
      // Keep cookie for middleware compatibility
      document.cookie = `token=${newToken}; path=/; max-age=86400; SameSite=Lax`
    } catch (error) {
      console.error("Login error:", error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("user")
      localStorage.removeItem("token")
    }
    // Clear cookie for middleware
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  }

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: Boolean(user && token),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}
