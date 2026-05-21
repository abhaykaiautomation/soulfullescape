import Link from 'next/link'
import { ArrowRight, Waves, Music, Utensils, Anchor, Users, Sun } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { TripCard } from '@/components/trips/TripCard'
import { Button } from '@/components/ui/Button'
import type { TripWithComputed } from '@/types'

export const revalidate = 60

async function getUpcomingTrips(): Promise<TripWithComputed[]> {
  const trips = await prisma.trip.findMany({
    where: { status: 'PUBLISHED', tripDate: { gte: new Date() } },
    orderBy: { tripDate: 'asc' },
    take: 6,
  })

  return trips.map((t) => {
    const spotsRemaining = t.capacity - t.spotsBooked
    return {
      ...t,
      pricePerPerson: Number(t.pricePerPerson),
      spotsRemaining,
      maxBookable: Math.min(10, spotsRemaining),
    }
  })
}

const pillars = [
  { icon: Anchor, label: 'Kayaking', desc: 'Glide across a hidden freshwater lake' },
  { icon: Music, label: 'Curated Music', desc: 'Live DJ sets in nature' },
  { icon: Utensils, label: 'Local Food', desc: 'Communal meals from the land' },
  { icon: Sun, label: 'Relaxation', desc: 'Hammocks, shade, and stillness' },
  { icon: Users, label: 'Community', desc: 'Group games and real connection' },
]

export default async function HomePage() {
  const trips = await getUpcomingTrips()

  return (
    <>
      {/* Hero */}
      <section className="relative bg-navy min-h-[85vh] flex items-center overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/90 to-teal/20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <span className="inline-block bg-teal/20 text-teal-light text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              Puerto Rico's best kept secret
            </span>

            <h1 className="font-display font-extrabold text-white text-5xl sm:text-6xl lg:text-7xl leading-[1.05] mb-6">
              Escape.{' '}
              <span className="text-teal-light">Connect.</span>
              <br />
              Recharge.
            </h1>

            <p className="text-white/70 text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
              A private day-trip to a hidden destination — where the jungle meets the lake,
              the music flows, and for one day, nothing else exists.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/trips">
                <Button size="lg" rightIcon={<ArrowRight size={20} />}>
                  View Upcoming Trips
                </Button>
              </Link>
              <Link href="#experience">
                <Button size="lg" variant="ghost" className="text-white border border-white/20 hover:bg-white/10 hover:text-white">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Pillars */}
      <section id="experience" className="py-16 md:py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-navy text-3xl md:text-4xl mb-4">
              One Day. Everything.
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              A curated escape where every element is intentional.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {pillars.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-teal/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-teal/20 transition-colors">
                  <Icon size={28} className="text-teal" aria-hidden />
                </div>
                <h3 className="font-semibold text-navy mb-1">{label}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Trips */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="font-display font-bold text-navy text-3xl md:text-4xl">
                Upcoming Trips
              </h2>
              <p className="text-gray-500 mt-2">Spots are limited. Book before they're gone.</p>
            </div>
            <Link href="/trips">
              <Button variant="secondary" rightIcon={<ArrowRight size={18} />}>
                View All
              </Button>
            </Link>
          </div>

          {trips.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Waves size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No upcoming trips right now.</p>
              <p className="text-sm mt-1">Check back soon — new dates drop regularly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-teal py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-white text-3xl md:text-4xl mb-4">
            Ready to escape?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Reserve your spot before they fill up. Each trip hosts a small, curated group.
          </p>
          <Link href="/trips">
            <Button
              size="lg"
              className="bg-white text-teal hover:bg-cream focus-visible:ring-white"
            >
              See Available Dates
            </Button>
          </Link>
        </div>
      </section>
    </>
  )
}
