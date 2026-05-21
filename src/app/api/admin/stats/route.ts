export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, ApiError } from '@/lib/api-auth'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [upcomingTrips, totalBookings, monthly] = await Promise.all([
      prisma.trip.count({
        where: { status: 'PUBLISHED', tripDate: { gte: now } },
      }),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.aggregate({
        where: { status: 'CONFIRMED', createdAt: { gte: startOfMonth } },
        _sum: { totalPrice: true, spotsReserved: true },
      }),
    ])

    return NextResponse.json({
      data: {
        upcomingTrips,
        totalBookings,
        spotsFilledThisMonth: monthly._sum.spotsReserved ?? 0,
        revenueThisMonth: Number(monthly._sum.totalPrice ?? 0),
      },
    })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[GET /api/admin/stats]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
