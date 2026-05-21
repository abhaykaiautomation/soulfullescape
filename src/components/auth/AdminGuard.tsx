'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { FullPageSpinner } from '@/components/ui/Spinner'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { firebaseUser, dbUser, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (loading) return
    if (!firebaseUser) {
      router.push('/login')
      return
    }
    if (dbUser && dbUser.role !== 'ADMIN') {
      toast('Admin access required', 'error')
      router.push('/')
    }
  }, [loading, firebaseUser, dbUser, router, toast])

  if (loading || !firebaseUser || !dbUser) {
    return <FullPageSpinner label="Verifying admin access..." />
  }

  if (dbUser.role !== 'ADMIN') return null

  return <>{children}</>
}
