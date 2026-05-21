export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, ApiError } from '@/lib/api-auth'

export async function GET(
  request: Request,
  { params }: { params: { waitlistId: string } }
) {
  try {
    const { user } = await requireAuth(request)

    const entry = await prisma.waitlist.findUnique({
      where: { id: params.waitlistId },
      include: {
        trip: { select: { id: true, title: true, tripDate: true, startTime: true, endTime: true } },
      },
    })

    if (!entry) return NextResponse.json({ error: 'Waitlist entry not found' }, { status: 404 })
    if (entry.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ data: entry })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
