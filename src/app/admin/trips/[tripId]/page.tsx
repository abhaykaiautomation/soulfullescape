'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TripForm } from '@/components/admin/TripForm'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ROUTES } from '@/constants/routes'
import type { TripInput } from '@/lib/schemas/trip.schema'
import type { TripWithComputed } from '@/types'

export default function EditTripPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const { firebaseUser } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [trip, setTrip] = useState<TripWithComputed | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!firebaseUser) return
    firebaseUser.getIdToken().then((token) =>
      fetch(`/api/trips/${tripId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then(({ data }) => setTrip(data))
        .catch(() => toast('Trip not found', 'error'))
        .finally(() => setLoading(false))
    )
  }, [tripId, firebaseUser])

  const handleSubmit = async (data: TripInput) => {
    if (!firebaseUser) return
    const token = await firebaseUser.getIdToken()

    const res = await fetch(`/api/trips/${tripId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })

    const json = await res.json()
    if (!res.ok) {
      toast(json.error ?? 'Failed to update trip', 'error')
      return
    }

    toast('Trip updated!', 'success')
    router.push(ROUTES.adminTrips)
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  if (!trip) return null

  // Format tripDate for datetime-local input
  const tripDateLocal = trip.tripDate
    ? new Date(trip.tripDate).toISOString().slice(0, 16)
    : ''

  const defaultValues: Partial<TripInput> = {
    title: trip.title,
    description: trip.description,
    tripDate: tripDateLocal,
    startTime: trip.startTime,
    endTime: trip.endTime,
    capacity: trip.capacity,
    pricePerPerson: Number(trip.pricePerPerson),
    status: trip.status === 'PUBLISHED' || trip.status === 'DRAFT' ? trip.status : 'DRAFT',
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <Link href={ROUTES.adminTrips} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-6 transition-colors">
        <ArrowLeft size={16} />
        Back to trips
      </Link>

      <h1 className="font-display font-bold text-navy text-2xl mb-8">Edit Trip</h1>

      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
        <TripForm
          mode="edit"
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          spotsBooked={trip.spotsBooked}
        />
      </div>
    </div>
  )
}
