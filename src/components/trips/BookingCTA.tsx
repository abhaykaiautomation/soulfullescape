'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
    if (!firebaseUser) {
      router.push(`/login?returnUrl=${encodeURIComponent(ROUTES.book(tripId))}`)
    } else {
      router.push(ROUTES.book(tripId))
    }
  }

  return (
    <div className="space-y-4">
      {/* Availability indicator */}
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
        <Button fullWidth disabled>
          Sold Out
        </Button>
      ) : (
        <Button fullWidth size="lg" onClick={handleBook}>
          {firebaseUser ? 'Book This Trip' : 'Sign In to Book'}
        </Button>
      )}

      <p className="text-xs text-center text-gray-400">
        Confirmation sent via WhatsApp instantly
      </p>
    </div>
  )
}
