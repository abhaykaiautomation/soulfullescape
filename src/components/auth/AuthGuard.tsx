'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { FullPageSpinner } from '@/components/ui/Spinner'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`)
    }
  }, [loading, firebaseUser, pathname, router])

  if (loading) return <FullPageSpinner label="Checking your session..." />
  if (!firebaseUser) return null

  return <>{children}</>
}
