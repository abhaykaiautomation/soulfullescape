import { PrismaClient, TripStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Admin user (requires matching Firebase UID — update after creating Firebase account)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@soulfullescape.com' },
    update: {},
    create: {
      firebaseUid: 'seed-admin-uid-replace-me',
      name: 'Sofia Velázquez',
      email: 'admin@soulfullescape.com',
      role: 'ADMIN',
    },
  })

  // Guest user
  const guest = await prisma.user.upsert({
    where: { email: 'guest@example.com' },
    update: {},
    create: {
      firebaseUid: 'seed-guest-uid-replace-me',
      name: 'Camila Rodriguez',
      email: 'guest@example.com',
      role: 'GUEST',
    },
  })

  const now = new Date()
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000)

  // Upcoming trips
  const trip1 = await prisma.trip.upsert({
    where: { id: 'seed-trip-1' },
    update: {},
    create: {
      id: 'seed-trip-1',
      title: 'Lake Day — Nature & Vibes',
      description:
        'Escape to our hidden freshwater lake deep in the Puerto Rican jungle. Kayak, swim, enjoy a curated DJ set, and share a communal meal under the trees. This is not a public beach. This is your day.',
      tripDate: addDays(now, 14),
      startTime: '8:00 AM',
      endTime: '5:00 PM',
      capacity: 20,
      spotsBooked: 14,
      pricePerPerson: 74.99,
      status: TripStatus.PUBLISHED,
    },
  })

  const trip2 = await prisma.trip.upsert({
    where: { id: 'seed-trip-2' },
    update: {},
    create: {
      id: 'seed-trip-2',
      title: 'Sunset Session',
      description:
        'A late afternoon escape timed to perfection — arrive in daylight, watch the sun set over the jungle canopy, and dance into the early evening with our resident DJ. Light food included.',
      tripDate: addDays(now, 21),
      startTime: '2:00 PM',
      endTime: '9:00 PM',
      capacity: 15,
      spotsBooked: 3,
      pricePerPerson: 89.99,
      status: TripStatus.PUBLISHED,
    },
  })

  const trip3 = await prisma.trip.upsert({
    where: { id: 'seed-trip-3' },
    update: {},
    create: {
      id: 'seed-trip-3',
      title: 'Full Moon Float',
      description:
        'Our most magical experience. Kayak under the full moon, the lake shimmering silver. Ambient music, candles, and the silence of the jungle around you. Spots are extremely limited.',
      tripDate: addDays(now, 28),
      startTime: '6:00 PM',
      endTime: '11:00 PM',
      capacity: 10,
      spotsBooked: 0,
      pricePerPerson: 99.99,
      status: TripStatus.PUBLISHED,
    },
  })

  // Sample bookings
  await prisma.booking.upsert({
    where: { id: 'seed-booking-1' },
    update: {},
    create: {
      id: 'seed-booking-1',
      userId: guest.id,
      tripId: trip1.id,
      customerName: 'Camila Rodriguez',
      customerEmail: 'guest@example.com',
      whatsappPhone: '+17875551234',
      spotsReserved: 4,
      pricePerPerson: 74.99,
      totalPrice: 299.96,
      status: 'CONFIRMED',
    },
  })

  console.log('Seed complete.')
  console.log(`  Admin: ${admin.email}`)
  console.log(`  Guest: ${guest.email}`)
  console.log(`  Trips: ${trip1.title}, ${trip2.title}, ${trip3.title}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
