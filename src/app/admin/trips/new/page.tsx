'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TripForm } from '@/components/admin/TripForm'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ROUTES } from '@/constants/routes'
import type { TripInput } from '@/lib/schemas/trip.schema'

export default function NewTripPage() {
  const { firebaseUser } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (data: TripInput) => {
    if (!firebaseUser) return
    const token = await firebaseUser.getIdToken()

    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    const json = await res.json()
    if (!res.ok) {
      toast(json.error ?? 'Failed to create trip', 'error')
      return
    }

    toast('Trip created!', 'success')
    router.push(ROUTES.adminTrips)
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <Link
        href={ROUTES.adminTrips}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to trips
      </Link>

      <h1 className="font-display font-bold text-navy text-2xl mb-8">Create New Trip</h1>

      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
        <TripForm mode="create" onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
