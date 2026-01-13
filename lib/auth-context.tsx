"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

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
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for existing session on mount
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      let API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
      if (API_URL.endsWith("/")) {
        API_URL = API_URL.slice(0, -1)
      }
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
      setUser(data.user)
      localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("token", data.token)
      document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Lax`
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
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
