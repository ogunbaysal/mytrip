"use client"

import { useState } from "react"
import { signIn, signOut, useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const session = useSession()

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await signIn.email({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message || "Giriş başarısız")
      }

      if (data) {
        // Redirect will typically be handled by the client or router push
        // But better-auth might handle some via callbackURL
      }
      
      return data
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    await signOut()
    router.push("/login")
  }

  return {
    isAuthenticated: !!session.data,
    isLoading: session.isPending || isLoading,
    user: session.data?.user,
    login,
    logout,
  }
}