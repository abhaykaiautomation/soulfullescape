export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, ApiError } from '@/lib/api-auth'
import { tripSchema } from '@/lib/schemas/trip.schema'

function withComputed(trip: {
  capacity: number
  spotsBooked: number
  pricePerPerson: { toNumber?: () => number } | number
  [key: string]: unknown
}) {
  const spotsRemaining = trip.capacity - trip.spotsBooked
  return {
    ...trip,
    pricePerPerson: typeof trip.pricePerPerson === 'object' && trip.pricePerPerson !== null
      ? (trip.pricePerPerson as { toNumber: () => number }).toNumber()
      : trip.pricePerPerson,
    spotsRemaining,
    maxBookable: Math.min(10, spotsRemaining),
  }
}

export async function GET(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: params.tripId } })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Hide non-published trips from public
    const authHeader = request.headers.get('Authorization')
    if (!authHeader && trip.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    return NextResponse.json({ data: withComputed(trip) })
  } catch (err) {
    console.error('[GET /api/trips/[tripId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  try {
    await requireAdmin(request)

    const trip = await prisma.trip.findUnique({ where: { id: params.tripId } })
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

    const body = await request.json()

    // Validate capacity constraint if being reduced
    if (body.capacity !== undefined && body.capacity < trip.spotsBooked) {
      return NextResponse.json(
        { error: `Capacity cannot be less than spots already booked (${trip.spotsBooked})` },
        { status: 422 }
      )
    }

    const updated = await prisma.trip.update({
      where: { id: params.tripId },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description && { description: body.description }),
        ...(body.tripDate && { tripDate: new Date(body.tripDate) }),
        ...(body.startTime && { startTime: body.startTime }),
        ...(body.endTime && { endTime: body.endTime }),
        ...(body.capacity !== undefined && { capacity: body.capacity }),
        ...(body.pricePerPerson !== undefined && { pricePerPerson: body.pricePerPerson }),
        ...(body.status && { status: body.status }),
      },
    })

    return NextResponse.json({ data: withComputed(updated) })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[PATCH /api/trips/[tripId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  try {
    await requireAdmin(request)

    const trip = await prisma.trip.findUnique({ where: { id: params.tripId } })
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

    // Cancel all associated bookings and mark trip cancelled
    const [cancelledBookings] = await prisma.$transaction([
      prisma.booking.updateMany({
        where: { tripId: params.tripId, status: 'CONFIRMED' },
        data: { status: 'CANCELLED' },
      }),
      prisma.trip.update({
        where: { id: params.tripId },
        data: { status: 'CANCELLED' },
      }),
    ])

    return NextResponse.json({ data: { cancelled: true, bookingsCancelled: cancelledBookings.count } })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[DELETE /api/trips/[tripId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
