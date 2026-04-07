"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, useCallback } from "react"

// User type matching our Prisma schema
export interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  company: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  email_verified: boolean
  is_active: boolean
  last_login: string | null
  created_at: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; errorCode?: string }>
  logout: () => Promise<void>
  updateProfile: (data: UpdateProfileData) => Promise<{ success: boolean; error?: string }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  refreshUser: () => Promise<void>
  clearError: () => void
}

export interface UpdateProfileData {
  first_name?: string
  last_name?: string
  phone?: string
  company?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "LOGOUT" }

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: action.payload !== null,
        isLoading: false,
        error: null,
      }
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false }
    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }
    default:
      return state
  }
}

// Helper to safely parse JSON response
async function safeJsonParse(response: Response): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      return { success: false, error: "Server returned non-JSON response" }
    }
    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Failed to parse response" }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  })

  // Check authentication status on mount
  const refreshUser = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const result = await safeJsonParse(response)
        if (result.success && result.data?.user) {
          dispatch({ type: "SET_USER", payload: result.data.user })
        } else {
          dispatch({ type: "SET_USER", payload: null })
        }
      } else {
        dispatch({ type: "SET_USER", payload: null })
      }
    } catch (error) {
      console.error("[Auth] Failed to fetch user:", error)
      dispatch({ type: "SET_USER", payload: null })
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; errorCode?: string }> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      dispatch({ type: "SET_ERROR", payload: null })

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const result = await safeJsonParse(response)
      if (!result.success) {
        dispatch({ type: "SET_ERROR", payload: result.error || "Login failed" })
        return { success: false, error: result.error || "Login failed" }
      }

      const data = result.data

      if (!response.ok) {
        dispatch({ type: "SET_ERROR", payload: data.error || "Login failed" })
        return { success: false, error: data.error || "Login failed", errorCode: data.errorCode }
      }

      dispatch({ type: "SET_USER", payload: data.user })
      return { success: true }
    } catch (error) {
      const errorMessage = "An unexpected error occurred. Please try again."
      dispatch({ type: "SET_ERROR", payload: errorMessage })
      return { success: false, error: errorMessage }
    }
  }

  // NOTE: Registration is handled through the email verification flow at /register page
  // using /api/auth/send-verification and /api/auth/verify-email endpoints

  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("[Auth] Logout error:", error)
    } finally {
      dispatch({ type: "LOGOUT" })
    }
  }

  const updateProfile = async (profileData: UpdateProfileData): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })

      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profileData),
      })

      const result = await safeJsonParse(response)
      if (!result.success) {
        dispatch({ type: "SET_ERROR", payload: result.error || "Update failed" })
        return { success: false, error: result.error || "Update failed" }
      }

      const data = result.data

      if (!response.ok) {
        dispatch({ type: "SET_ERROR", payload: data.error || "Update failed" })
        return { success: false, error: data.error || "Update failed" }
      }

      dispatch({ type: "SET_USER", payload: data.user })
      return { success: true }
    } catch (error) {
      const errorMessage = "An unexpected error occurred. Please try again."
      dispatch({ type: "SET_ERROR", payload: errorMessage })
      return { success: false, error: errorMessage }
    }
  }

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const result = await safeJsonParse(response)
      if (!result.success) {
        return { success: false, error: result.error || "Password change failed" }
      }

      const data = result.data

      if (!response.ok) {
        return { success: false, error: data.error || "Password change failed" }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: "An unexpected error occurred. Please try again." }
    }
  }

  const clearError = () => {
    dispatch({ type: "SET_ERROR", payload: null })
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
