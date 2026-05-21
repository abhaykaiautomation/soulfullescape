export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin, ApiError, isPrismaSerializationFailure } from '@/lib/api-auth'
import { bookingSchema } from '@/lib/schemas/booking.schema'
import { sendWhatsAppConfirmation } from '@/lib/whatsapp'
import { Decimal } from '@prisma/client/runtime/library'

function serialise(booking: Record<string, unknown>) {
  return {
    ...booking,
    pricePerPerson: Number(booking.pricePerPerson),
    totalPrice: Number(booking.totalPrice),
  }
}

export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('tripId') ?? undefined
    const status = searchParams.get('status') ?? undefined

    const isAdmin = user.role === 'ADMIN'

    const bookings = await prisma.booking.findMany({
      where: {
        ...(isAdmin ? {} : { userId: user.id }),
        ...(tripId ? { tripId } : {}),
        ...(status ? { status: status as 'CONFIRMED' | 'CANCELLED' | 'PENDING' } : {}),
      },
      include: {
        trip: {
          select: { id: true, title: true, tripDate: true, startTime: true, endTime: true },
        },
        ...(isAdmin ? { user: { select: { id: true, name: true, email: true } } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      data: bookings.map(serialise),
      count: bookings.length,
    })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[GET /api/bookings]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAuth(request)

    const body = await request.json()
    const result = bookingSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message ?? 'Validation failed' },
        { status: 422 }
      )
    }

    const { tripId, customerName, customerEmail, whatsappPhone, spotsRequested } = result.data

    // Pre-flight check (fast, before entering expensive transaction)
    const tripPreflight = await prisma.trip.findUnique({ where: { id: tripId } })
    if (!tripPreflight) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }
    if (tripPreflight.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Trip is not available for booking' }, { status: 409 })
    }
    if (tripPreflight.tripDate < new Date()) {
      return NextResponse.json({ error: 'This trip has already taken place' }, { status: 409 })
    }

    // Serializable transaction — the real overbooking guard
    let booking: Record<string, unknown>
    let tripForWhatsApp: { title: string; tripDate: Date; startTime: string; endTime: string }

    try {
      const result = await prisma.$transaction(
        async (tx) => {
          const trip = await tx.trip.findUniqueOrThrow({ where: { id: tripId } })

          if (trip.status !== 'PUBLISHED') {
            throw new ApiError(409, 'Trip is not available')
          }

          const spotsRemaining = trip.capacity - trip.spotsBooked
          const maxBookable = Math.min(10, spotsRemaining)

          if (spotsRequested > maxBookable) {
            throw new ApiError(409, `Only ${spotsRemaining} spot(s) remaining`)
          }

          const pricePerPerson = trip.pricePerPerson
          const totalPrice = new Decimal(pricePerPerson).mul(spotsRequested)

          const newBooking = await tx.booking.create({
            data: {
              userId: user.id,
              tripId,
              customerName,
              customerEmail,
              whatsappPhone,
              spotsReserved: spotsRequested,
              pricePerPerson,
              totalPrice,
              status: 'CONFIRMED',
            },
          })

          const newSpotsBooked = trip.spotsBooked + spotsRequested
          await tx.trip.update({
            where: { id: tripId },
            data: {
              spotsBooked: newSpotsBooked,
              status: newSpotsBooked >= trip.capacity ? 'FULL' : trip.status,
            },
          })

          return { booking: newBooking, trip }
        },
        { isolationLevel: 'Serializable' }
      )

      booking = result.booking as unknown as Record<string, unknown>
      tripForWhatsApp = result.trip
    } catch (txErr) {
      if (txErr instanceof ApiError) {
        return NextResponse.json({ error: txErr.message }, { status: txErr.status })
      }
      if (isPrismaSerializationFailure(txErr)) {
        return NextResponse.json(
          { error: 'Trip is now full. Please try another date.' },
          { status: 409 }
        )
      }
      throw txErr
    }

    // WhatsApp — fire and forget
    sendWhatsAppConfirmation({
      to: whatsappPhone,
      customerName,
      tripTitle: tripForWhatsApp.title,
      tripDate: tripForWhatsApp.tripDate,
      startTime: tripForWhatsApp.startTime,
      endTime: tripForWhatsApp.endTime,
      spotsReserved: spotsRequested,
      totalPrice: Number((booking as { totalPrice: unknown }).totalPrice),
    }).catch((err: Error) => {
      console.error('[WhatsApp] Confirmation failed:', {
        bookingId: (booking as { id: string }).id,
        error: err.message,
      })
    })

    return NextResponse.json({ data: serialise(booking) }, { status: 201 })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[POST /api/bookings]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
