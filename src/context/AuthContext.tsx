'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import type { User } from '@prisma/client'

interface AuthContextValue {
  firebaseUser: FirebaseUser | null
  dbUser: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [dbUser, setDbUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function syncUser(fbUser: FirebaseUser) {
    try {
      const token = await fbUser.getIdToken()
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const { data } = await res.json()
        setDbUser(data)
      }
    } catch {
      // Network error during sync — not fatal
    }
  }

  async function refreshUser() {
    if (firebaseUser) await syncUser(firebaseUser)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)
      if (fbUser) {
        await syncUser(fbUser)
      } else {
        setDbUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signOut() {
    await firebaseSignOut(auth)
    setFirebaseUser(null)
    setDbUser(null)
  }

  return (
    <AuthContext.Provider value={{ firebaseUser, dbUser, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
