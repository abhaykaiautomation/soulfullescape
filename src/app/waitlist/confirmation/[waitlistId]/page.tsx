'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ClipboardList, Calendar, Clock, MessageCircle } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { formatDate } from '@/lib/utils'

interface WaitlistEntry {
  id: string
  position: number
  spotsRequested: number
  whatsappPhone: string
  customerName: string
  trip: {
    title: string
    tripDate: string
    startTime: string
    endTime: string
  }
}

function WaitlistConfirmationContent() {
  const { waitlistId } = useParams<{ waitlistId: string }>()
  const { firebaseUser } = useAuth()
  const [entry, setEntry] = useState<WaitlistEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!firebaseUser) return
    firebaseUser.getIdToken().then((token) =>
      fetch(`/api/waitlist/${waitlistId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then(({ data, error: e }) => {
          if (e) setError(e)
          else setEntry(data)
        })
        .catch(() => setError('Failed to load waitlist entry'))
        .finally(() => setLoading(false))
    )
  }, [waitlistId, firebaseUser])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !entry) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">{error ?? 'Entry not found'}</p>
        <Link href="/trips">
          <Button variant="secondary">Browse Trips</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 md:py-20 text-center">
      {/* Position badge */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gold/15 flex items-center justify-center">
            <ClipboardList size={40} className="text-gold" aria-hidden />
          </div>
          <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-navy flex items-center justify-center">
            <span className="text-white font-bold text-sm">#{entry.position}</span>
          </div>
        </div>
      </div>

      <h1 className="font-display font-bold text-navy text-3xl mb-2">
        You're on the list!
      </h1>
      <p className="text-gray-500 text-lg mb-2">
        You're{' '}
        <span className="font-semibold text-navy">
          #{entry.position} on the waitlist
        </span>
        {entry.position === 1 ? ' — you\'re first in line!' : '.'}
      </p>
      <p className="text-gray-400 text-sm mb-8">
        We'll WhatsApp you the moment a spot opens up.
      </p>

      {/* Trip summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left space-y-3 mb-6">
        <h2 className="font-display font-semibold text-navy text-xl">{entry.trip.title}</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-teal shrink-0" aria-hidden />
            {formatDate(entry.trip.tripDate)}
          </div>
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-teal shrink-0" aria-hidden />
            {entry.trip.startTime} – {entry.trip.endTime}
          </div>
        </div>
        <div className="border-t border-gray-100 pt-3 flex justify-between text-sm">
          <span className="text-gray-500">Spots requested</span>
          <span className="font-medium text-navy">{entry.spotsRequested}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Waitlist position</span>
          <span className="font-bold text-gold">#{entry.position}</span>
        </div>
      </div>

      <div className="bg-gold/10 rounded-xl px-5 py-4 flex items-start gap-3 text-left mb-8">
        <MessageCircle size={20} className="text-gold shrink-0 mt-0.5" aria-hidden />
        <p className="text-sm text-navy">
          Waitlist confirmation sent to <strong>{entry.whatsappPhone}</strong> on WhatsApp.
        </p>
      </div>

      <Link href="/trips">
        <Button variant="secondary" fullWidth>Browse Other Trips</Button>
      </Link>
    </div>
  )
}

export default function WaitlistConfirmationPage() {
  return (
    <AuthGuard>
      <WaitlistConfirmationContent />
    </AuthGuard>
  )
}
