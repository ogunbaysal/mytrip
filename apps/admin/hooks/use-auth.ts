"use client"

import { useState, useEffect } from "react"

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate checking authentication status
    const checkAuth = () => {
      const hasAuth = localStorage.getItem("admin-authenticated")
      setIsAuthenticated(!!hasAuth)
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    // Simulate login API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === "demo@mytrip.com" && password === "demo123") {
          localStorage.setItem("admin-authenticated", "true")
          setIsAuthenticated(true)
          resolve(true)
        } else {
          reject(new Error("Geçersiz e-posta veya şifre"))
        }
      }, 1000)
    })
  }

  const logout = () => {
    localStorage.removeItem("admin-authenticated")
    setIsAuthenticated(false)
  }

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  }
}