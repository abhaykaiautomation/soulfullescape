'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, Clock, Users } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { WaitlistForm } from '@/components/booking/WaitlistForm'
import { Spinner } from '@/components/ui/Spinner'
import { formatDateShort } from '@/lib/utils'
import { apiRequest, ApiError } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import { ROUTES } from '@/constants/routes'
import type { TripWithComputed } from '@/types'

function WaitlistPageContent() {
  const { tripId } = useParams<{ tripId: string }>()
  const [trip, setTrip] = useState<TripWithComputed | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    apiRequest<{ data: TripWithComputed }>(`/api/trips/${tripId}`)
      .then(({ data }) => {
        if (data.status === 'CANCELLED') {
          toast('This trip has been cancelled.', 'error')
          router.push(ROUTES.trips)
          return
        }
        if (data.tripDate < new Date()) {
          toast('This trip has already taken place.', 'error')
          router.push(ROUTES.trips)
          return
        }
        // If spots opened back up, redirect to booking
        if (data.status === 'PUBLISHED' && data.spotsRemaining > 0) {
          router.push(ROUTES.book(tripId))
          return
        }
        setTrip(data)
      })
      .catch((err: ApiError) => {
        toast(err.message || 'Trip not found', 'error')
        router.push(ROUTES.trips)
      })
      .finally(() => setLoading(false))
  }, [tripId, router, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!trip) return null

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      {/* Trip summary */}
      <div className="bg-navy rounded-2xl p-5 mb-8 text-white">
        <div className="inline-block bg-gold/20 text-gold text-xs font-semibold px-3 py-1 rounded-full mb-3">
          Sold Out — Waitlist
        </div>
        <h1 className="font-display font-bold text-xl mb-3">{trip.title}</h1>
        <div className="space-y-1.5 text-white/70 text-sm">
          <div className="flex items-center gap-2">
            <Calendar size={14} aria-hidden />
            {formatDateShort(trip.tripDate)}
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} aria-hidden />
            {trip.startTime} – {trip.endTime}
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} aria-hidden />
            Full — {trip.capacity} person experience
          </div>
        </div>
      </div>

      <h2 className="font-display font-semibold text-navy text-2xl mb-2">
        Join the Waitlist
      </h2>
      <p className="text-gray-500 text-sm mb-6">
        Add your name and we'll WhatsApp you the moment a spot opens up.
      </p>

      <WaitlistForm trip={trip} />
    </div>
  )
}

export default function WaitlistPage() {
  return (
    <AuthGuard>
      <WaitlistPageContent />
    </AuthGuard>
  )
}
