import { requireAdmin, ApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { formatDateTime, formatDateShort } from '@/lib/utils'

function escapeCsvField(value: string): string {
  if (/[,"\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('tripId') ?? undefined

    const bookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        ...(tripId ? { tripId } : {}),
      },
      include: {
        trip: { select: { title: true, tripDate: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const headers = [
      'Name',
      'Email',
      'WhatsApp',
      'Trip',
      'Trip Date',
      'Spots',
      'Total (USD)',
      'Status',
      'Booked At',
    ]

    const rows = bookings.map((b) => [
      escapeCsvField(b.customerName),
      escapeCsvField(b.customerEmail),
      escapeCsvField(b.whatsappPhone),
      escapeCsvField(b.trip.title),
      formatDateShort(b.trip.tripDate),
      b.spotsReserved.toString(),
      Number(b.totalPrice).toFixed(2),
      b.status,
      formatDateTime(b.createdAt),
    ])

    const lines = [headers, ...rows].map((row) => row.join(','))
    // BOM prefix for Excel UTF-8 compatibility
    const csv = '﻿' + lines.join('\r\n')

    const today = new Date().toISOString().slice(0, 10)
    const filename = `soulfullescape_bookings_${today}.csv`

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    if (err instanceof ApiError) {
      return Response.json({ error: err.message }, { status: err.status })
    }
    console.error('[GET /api/bookings/export]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
