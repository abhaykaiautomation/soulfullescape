'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, Clock, DollarSign } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { BookingForm } from '@/components/booking/BookingForm'
import { Spinner } from '@/components/ui/Spinner'
import { formatDateShort, formatCurrency } from '@/lib/utils'
import { apiRequest, ApiError } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import { ROUTES } from '@/constants/routes'
import type { TripWithComputed } from '@/types'

function BookPageContent() {
  const { tripId } = useParams<{ tripId: string }>()
  const [trip, setTrip] = useState<TripWithComputed | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    apiRequest<{ data: TripWithComputed }>(`/api/trips/${tripId}`)
      .then(({ data }) => {
        if (data.status !== 'PUBLISHED' || data.spotsRemaining <= 0) {
          toast('This trip is no longer available for booking.', 'error')
          router.push(ROUTES.trips)
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
            <DollarSign size={14} aria-hidden />
            {formatCurrency(trip.pricePerPerson)} per person
          </div>
        </div>
      </div>

      <h2 className="font-display font-semibold text-navy text-2xl mb-6">
        Reserve Your Spots
      </h2>

      <BookingForm trip={trip} />
    </div>
  )
}

export default function BookPage() {
  return (
    <AuthGuard>
      <BookPageContent />
    </AuthGuard>
  )
}
