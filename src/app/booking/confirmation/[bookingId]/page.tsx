'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CheckCircle, Calendar, Clock, Users, MessageCircle } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { BookingWithTrip } from '@/types'

function ConfirmationContent() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { firebaseUser } = useAuth()
  const [booking, setBooking] = useState<BookingWithTrip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!firebaseUser) return

    firebaseUser.getIdToken().then((token) =>
      fetch(`/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then(({ data, error: e }) => {
          if (e) setError(e)
          else setBooking(data)
        })
        .catch(() => setError('Failed to load booking'))
        .finally(() => setLoading(false))
    )
  }, [bookingId, firebaseUser])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">{error ?? 'Booking not found'}</p>
        <Link href="/trips">
          <Button variant="secondary">Browse Trips</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 md:py-20 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle size={40} className="text-green-500" aria-hidden />
        </div>
      </div>

      <h1 className="font-display font-bold text-navy text-3xl mb-2">
        You're in!
      </h1>
      <p className="text-gray-500 text-lg mb-8">
        Get ready to escape, connect, and recharge.
      </p>

      {/* Booking summary card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left space-y-4 mb-8">
        <h2 className="font-display font-semibold text-navy text-xl">{booking.trip.title}</h2>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-gray-600">
            <Calendar size={16} className="text-teal shrink-0" aria-hidden />
            <span>{formatDate(booking.trip.tripDate)}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Clock size={16} className="text-teal shrink-0" aria-hidden />
            <span>{booking.trip.startTime} – {booking.trip.endTime}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Users size={16} className="text-teal shrink-0" aria-hidden />
            <span>{booking.spotsReserved} spot{booking.spotsReserved !== 1 ? 's' : ''} reserved</span>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">Total paid</span>
          <span className="font-bold text-navy text-lg">{formatCurrency(Number(booking.totalPrice))}</span>
        </div>
      </div>

      <div className="bg-teal/10 rounded-xl px-5 py-4 flex items-start gap-3 text-left mb-8">
        <MessageCircle size={20} className="text-teal shrink-0 mt-0.5" aria-hidden />
        <p className="text-sm text-teal-dark">
          Your confirmation was sent to <strong>{booking.whatsappPhone}</strong> on WhatsApp.
          You'll find all details there.
        </p>
      </div>

      <Link href="/trips">
        <Button variant="secondary" fullWidth>Browse More Trips</Button>
      </Link>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <AuthGuard>
      <ConfirmationContent />
    </AuthGuard>
  )
}
