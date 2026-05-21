export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, ApiError } from '@/lib/api-auth'

export async function GET(
  request: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { user } = await requireAuth(request)

    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: {
        trip: {
          select: { id: true, title: true, tripDate: true, startTime: true, endTime: true },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Guests can only access their own bookings
    if (booking.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({
      data: {
        ...booking,
        pricePerPerson: Number(booking.pricePerPerson),
        totalPrice: Number(booking.totalPrice),
      },
    })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[GET /api/bookings/[bookingId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
