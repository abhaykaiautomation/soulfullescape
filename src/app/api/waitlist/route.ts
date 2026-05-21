export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin, ApiError } from '@/lib/api-auth'
import { waitlistSchema } from '@/lib/schemas/waitlist.schema'
import { sendWhatsAppConfirmation } from '@/lib/whatsapp'
import { normalisePhone } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('tripId') ?? undefined

    const entries = await prisma.waitlist.findMany({
      where: {
        ...(tripId ? { tripId } : {}),
        status: { not: 'CANCELLED' },
      },
      include: {
        trip: { select: { id: true, title: true, tripDate: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ tripId: 'asc' }, { position: 'asc' }],
    })

    return NextResponse.json({ data: entries, count: entries.length })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[GET /api/waitlist]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAuth(request)

    const body = await request.json()
    const result = waitlistSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message ?? 'Validation failed' },
        { status: 422 }
      )
    }

    const { tripId, customerName, customerEmail, whatsappPhone, spotsRequested } = result.data
    const normalisedPhone = normalisePhone(whatsappPhone)

    // Trip must exist and be FULL (or PUBLISHED — edge case where it just filled)
    const trip = await prisma.trip.findUnique({ where: { id: tripId } })
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    if (trip.status === 'CANCELLED') {
      return NextResponse.json({ error: 'This trip has been cancelled' }, { status: 409 })
    }
    if (trip.tripDate < new Date()) {
      return NextResponse.json({ error: 'This trip has already taken place' }, { status: 409 })
    }

    // Prevent duplicate waitlist entry for same user + trip
    const existing = await prisma.waitlist.findFirst({
      where: { userId: user.id, tripId, status: { not: 'CANCELLED' } },
    })
    if (existing) {
      return NextResponse.json(
        { error: `You are already on the waitlist at position #${existing.position}` },
        { status: 409 }
      )
    }

    // Assign next position atomically
    const entry = await prisma.$transaction(async (tx) => {
      const last = await tx.waitlist.findFirst({
        where: { tripId, status: { not: 'CANCELLED' } },
        orderBy: { position: 'desc' },
      })
      const position = (last?.position ?? 0) + 1

      return tx.waitlist.create({
        data: {
          userId: user.id,
          tripId,
          customerName,
          customerEmail,
          whatsappPhone: normalisedPhone,
          spotsRequested,
          position,
          status: 'WAITING',
        },
      })
    })

    // WhatsApp confirmation — fire and forget
    sendWhatsAppConfirmation({
      to: normalisedPhone,
      customerName,
      tripTitle: trip.title,
      tripDate: trip.tripDate,
      startTime: trip.startTime,
      endTime: trip.endTime,
      spotsReserved: spotsRequested,
      totalPrice: 0,
      waitlistPosition: entry.position,
    }).catch((err: Error) => {
      console.error('[WhatsApp][Waitlist] Failed:', { entryId: entry.id, error: err.message })
    })

    return NextResponse.json({ data: entry }, { status: 201 })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[POST /api/waitlist]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
