import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Calendar, Clock, Users, DollarSign, MapPin } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { TripStatusBadge } from '@/components/trips/TripStatusBadge'
import { BookingCTA } from '@/components/trips/BookingCTA'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Props {
  params: { tripId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trip = await prisma.trip.findUnique({
    where: { id: params.tripId },
    select: { title: true, description: true },
  })
  if (!trip) return {}
  return {
    title: trip.title,
    description: trip.description.slice(0, 160),
  }
}

export default async function TripDetailPage({ params }: Props) {
  const trip = await prisma.trip.findUnique({ where: { id: params.tripId } })

  if (!trip || trip.status === 'CANCELLED') notFound()

  const spotsRemaining = trip.capacity - trip.spotsBooked
  const maxBookable = Math.min(10, spotsRemaining)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-start gap-3">
            <div>
              <TripStatusBadge status={trip.status} />
              <h1 className="font-display font-bold text-navy text-3xl md:text-4xl mt-3 mb-1 leading-snug">
                {trip.title}
              </h1>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Calendar, label: 'Date', value: formatDate(trip.tripDate) },
              { icon: Clock, label: 'Time', value: `${trip.startTime} – ${trip.endTime}` },
              { icon: Users, label: 'Group size', value: `Up to ${trip.capacity} people` },
              { icon: DollarSign, label: 'Price', value: `${formatCurrency(Number(trip.pricePerPerson))} per person` },
              { icon: MapPin, label: 'Location', value: 'Puerto Rico (exact address on booking)' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-cream rounded-xl p-4">
                <div className="flex items-center gap-2 text-teal mb-1">
                  <Icon size={16} aria-hidden />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
                </div>
                <p className="text-navy font-medium text-sm">{value}</p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="font-display font-semibold text-navy text-xl mb-3">
              About This Trip
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {trip.description}
            </p>
          </div>
        </div>

        {/* Booking sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-display font-semibold text-navy text-xl mb-1">
                Reserve Your Spot
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                {spotsRemaining > 0
                  ? `${spotsRemaining} of ${trip.capacity} spots remaining`
                  : 'This trip is sold out'}
              </p>
              <BookingCTA
                tripId={trip.id}
                tripStatus={trip.status}
                spotsRemaining={spotsRemaining}
                maxBookable={maxBookable}
                pricePerPerson={Number(trip.pricePerPerson)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
