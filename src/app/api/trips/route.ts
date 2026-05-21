export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { ApiError, isPrismaSerializationFailure } from '@/lib/api-auth'
import { tripSchema } from '@/lib/schemas/trip.schema'

function withComputed(trip: {
  id: string
  capacity: number
  spotsBooked: number
  pricePerPerson: { toNumber: () => number } | number
  [key: string]: unknown
}) {
  const spotsRemaining = trip.capacity - trip.spotsBooked
  return {
    ...trip,
    pricePerPerson: typeof trip.pricePerPerson === 'object'
      ? (trip.pricePerPerson as { toNumber: () => number }).toNumber()
      : trip.pricePerPerson,
    spotsRemaining,
    maxBookable: Math.min(10, spotsRemaining),
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'

    // Verify admin for admin view
    if (isAdmin) {
      await requireAdmin(request)
      const trips = await prisma.trip.findMany({
        orderBy: { tripDate: 'asc' },
        include: { _count: { select: { bookings: true } } },
      })
      return NextResponse.json({
        data: trips.map(withComputed),
        count: trips.length,
      })
    }

    // Public: only published future trips
    const trips = await prisma.trip.findMany({
      where: {
        status: 'PUBLISHED',
        tripDate: { gte: new Date() },
      },
      orderBy: { tripDate: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        tripDate: true,
        startTime: true,
        endTime: true,
        capacity: true,
        spotsBooked: true,
        pricePerPerson: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ data: trips.map(withComputed), count: trips.length })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[GET /api/trips]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request)

    const body = await request.json()
    const result = tripSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message ?? 'Validation failed' },
        { status: 422 }
      )
    }

    const data = result.data
    const trip = await prisma.trip.create({
      data: {
        title: data.title,
        description: data.description,
        tripDate: new Date(data.tripDate),
        startTime: data.startTime,
        endTime: data.endTime,
        capacity: data.capacity,
        pricePerPerson: data.pricePerPerson,
        status: data.status,
        spotsBooked: 0,
      },
    })

    return NextResponse.json({ data: withComputed(trip) }, { status: 201 })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[POST /api/trips]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
