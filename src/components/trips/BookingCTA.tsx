'use client'

import { useRouter } from 'next/navigation'
import { ClipboardList } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import type { TripStatus } from '@prisma/client'

interface BookingCTAProps {
  tripId: string
  tripStatus: TripStatus
  spotsRemaining: number
  maxBookable: number
  pricePerPerson: number
}

export function BookingCTA({
  tripId,
  tripStatus,
  spotsRemaining,
  maxBookable,
  pricePerPerson,
}: BookingCTAProps) {
  const { firebaseUser } = useAuth()
  const router = useRouter()

  const isFull = tripStatus === 'FULL' || spotsRemaining <= 0

  const handleBook = () => {
    const dest = ROUTES.book(tripId)
    if (!firebaseUser) {
      router.push(`/login?returnUrl=${encodeURIComponent(dest)}`)
    } else {
      router.push(dest)
    }
  }

  const handleWaitlist = () => {
    const dest = ROUTES.waitlist(tripId)
    if (!firebaseUser) {
      router.push(`/login?returnUrl=${encodeURIComponent(dest)}`)
    } else {
      router.push(dest)
    }
  }

  return (
    <div className="space-y-4">
      {/* Availability badge */}
      {isFull ? (
        <Badge variant="error" dot className="text-sm">Sold Out</Badge>
      ) : spotsRemaining === 1 ? (
        <Badge variant="error" dot className="text-sm">Last spot!</Badge>
      ) : spotsRemaining <= 5 ? (
        <Badge variant="warning" dot className="text-sm">Only {spotsRemaining} spots left</Badge>
      ) : (
        <Badge variant="success" dot className="text-sm">{spotsRemaining} spots available</Badge>
      )}

      <div className="text-2xl font-bold text-navy">
        {formatCurrency(pricePerPerson)}
        <span className="text-sm font-normal text-gray-500 ml-1">/ person</span>
      </div>

      {isFull ? (
        <div className="space-y-3">
          <Button
            fullWidth
            size="lg"
            onClick={handleWaitlist}
            className="bg-gold text-navy hover:bg-gold-dark focus-visible:ring-gold"
            leftIcon={<ClipboardList size={18} />}
          >
            {firebaseUser ? 'Join Waitlist' : 'Sign In to Join Waitlist'}
          </Button>
          <p className="text-xs text-center text-gray-400">
            Free to join — we'll WhatsApp you if a spot opens
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <Button fullWidth size="lg" onClick={handleBook}>
            {firebaseUser ? 'Book This Trip' : 'Sign In to Book'}
          </Button>
          <p className="text-xs text-center text-gray-400">
            Confirmation sent via WhatsApp instantly
          </p>
        </div>
      )}
    </div>
  )
}
