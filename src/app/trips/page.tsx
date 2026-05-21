import type { Metadata } from 'next'
import { Waves } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { TripCard } from '@/components/trips/TripCard'
import type { TripWithComputed } from '@/types'

export const metadata: Metadata = {
  title: 'Upcoming Trips',
  description: 'Browse all upcoming Soulfullescape day trips in Puerto Rico.',
}

export const revalidate = 30

async function getTrips(): Promise<TripWithComputed[]> {
  const trips = await prisma.trip.findMany({
    where: {
      status: { in: ['PUBLISHED', 'FULL'] },
      tripDate: { gte: new Date() },
    },
    orderBy: { tripDate: 'asc' },
  })

  const withComputed = trips.map((t) => {
    const spotsRemaining = t.capacity - t.spotsBooked
    return {
      ...t,
      pricePerPerson: Number(t.pricePerPerson),
      spotsRemaining,
      maxBookable: Math.min(10, spotsRemaining),
    }
  })

  // Available trips first, sold-out trips at the end (each group sorted by date)
  return [
    ...withComputed.filter((t) => t.status === 'PUBLISHED'),
    ...withComputed.filter((t) => t.status === 'FULL'),
  ]
}

export default async function TripsPage() {
  const trips = await getTrips()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="mb-10">
        <h1 className="font-display font-bold text-navy text-4xl mb-3">Upcoming Trips</h1>
        <p className="text-gray-500 text-lg">
          Small groups. Curated experiences. Spots are limited.
        </p>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Waves size={56} className="mx-auto mb-4 text-gray-300" aria-hidden />
          <p className="text-xl font-medium">No upcoming trips</p>
          <p className="text-sm mt-2">New dates drop regularly — check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  )
}
