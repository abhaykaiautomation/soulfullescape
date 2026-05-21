import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api-auth'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) throw new ApiError(401, 'Authentication required')

    let decoded
    try {
      decoded = await adminAuth.verifyIdToken(token)
    } catch {
      throw new ApiError(401, 'Invalid or expired token')
    }

    const user = await prisma.user.upsert({
      where: { firebaseUid: decoded.uid },
      update: {
        name: decoded.name ?? 'User',
        email: decoded.email ?? '',
      },
      create: {
        firebaseUid: decoded.uid,
        name: decoded.name ?? 'User',
        email: decoded.email ?? '',
        role: 'GUEST',
      },
    })

    return NextResponse.json({ data: user })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[POST /api/auth/me]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
