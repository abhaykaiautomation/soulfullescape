import Link from 'next/link'
import { Calendar, Clock, Users, DollarSign, ClipboardList } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDateShort, formatCurrency } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import type { TripWithComputed } from '@/types'

interface TripCardProps {
  trip: TripWithComputed
}

function SpotIndicator({ remaining }: { remaining: number }) {
  if (remaining <= 0) return <Badge variant="error" dot>Sold Out</Badge>
  if (remaining === 1) return <Badge variant="error" dot>Last spot!</Badge>
  if (remaining <= 5) return <Badge variant="warning" dot>Only {remaining} spots left!</Badge>
  return <Badge variant="success" dot>{remaining} spots available</Badge>
}

export function TripCard({ trip }: TripCardProps) {
  const isFull = trip.status === 'FULL' || trip.spotsRemaining <= 0
  const isCancelled = trip.status === 'CANCELLED'
  const isUnavailable = isFull || isCancelled

  return (
    <article className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200">
      {/* Image placeholder */}
      <div className="h-44 bg-gradient-to-br from-teal/30 to-navy/40 relative flex items-end p-4">
        {isCancelled && (
          <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">Cancelled</span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-navy text-xl mb-3 leading-snug">
          {trip.title}
        </h3>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-teal shrink-0" aria-hidden />
            <span>{formatDateShort(trip.tripDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-teal shrink-0" aria-hidden />
            <span>{trip.startTime} – {trip.endTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={15} className="text-teal shrink-0" aria-hidden />
            <span>{trip.capacity} person experience</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={15} className="text-teal shrink-0" aria-hidden />
            <span className="font-semibold text-navy">
              {formatCurrency(trip.pricePerPerson)} per person
            </span>
          </div>
        </div>

        <div className="mt-auto space-y-3">
          <SpotIndicator remaining={trip.spotsRemaining} />

          {isCancelled ? (
            <Button variant="secondary" fullWidth disabled>Cancelled</Button>
          ) : isFull ? (
            <Link href={ROUTES.waitlist(trip.id)} className="block">
              <Button
                fullWidth
                leftIcon={<ClipboardList size={16} />}
                className="bg-gold text-navy hover:bg-gold-dark focus-visible:ring-gold"
              >
                Join Waitlist
              </Button>
            </Link>
          ) : (
            <Link href={ROUTES.trip(trip.id)} className="block">
              <Button fullWidth>View & Book</Button>
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

export function TripCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-6 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-10 bg-gray-200 rounded-full mt-4" />
      </div>
    </div>
  )
}
