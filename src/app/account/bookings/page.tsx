'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Users } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { formatDateShort, formatCurrency, formatRelativeTime } from '@/lib/utils'
import type { BookingWithTrip } from '@/types'

function BookingsContent() {
  const { firebaseUser } = useAuth()
  const [bookings, setBookings] = useState<BookingWithTrip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!firebaseUser) return
    firebaseUser.getIdToken().then((token) =>
      fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then(({ data }) => setBookings(data ?? []))
        .catch(console.error)
        .finally(() => setLoading(false))
    )
  }, [firebaseUser])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display font-bold text-navy text-3xl mb-8">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No bookings yet</p>
          <p className="text-sm mt-1 mb-6">Find a trip and reserve your spot!</p>
          <Link href="/trips">
            <Button>Browse Trips</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-navy">{b.trip.title}</h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} aria-hidden />
                      {formatDateShort(b.trip.tripDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={13} aria-hidden />
                      {b.spotsReserved} spot{b.spotsReserved !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Badge
                    variant={b.status === 'CONFIRMED' ? 'success' : 'neutral'}
                  >
                    {b.status}
                  </Badge>
                  <p className="font-bold text-navy mt-2">
                    {formatCurrency(Number(b.totalPrice))}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Booked {formatRelativeTime(b.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AccountBookingsPage() {
  return (
    <AuthGuard>
      <BookingsContent />
    </AuthGuard>
  )
}
