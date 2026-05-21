import { adminAuth } from './firebase-admin'
import { prisma } from './prisma'
import type { User } from '@prisma/client'
import type { DecodedIdToken } from 'firebase-admin/auth'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface AuthContext {
  decoded: DecodedIdToken
  user: User
}

export async function requireAuth(request: Request): Promise<AuthContext> {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) throw new ApiError(401, 'Authentication required')

  let decoded: DecodedIdToken
  try {
    decoded = await adminAuth.verifyIdToken(token)
  } catch {
    throw new ApiError(401, 'Invalid or expired token')
  }

  const user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } })
  if (!user) throw new ApiError(401, 'User account not found')

  return { decoded, user }
}

export async function requireAdmin(request: Request): Promise<AuthContext> {
  const ctx = await requireAuth(request)
  if (ctx.user.role !== 'ADMIN') throw new ApiError(403, 'Admin access required')
  return ctx
}

export function isPrismaSerializationFailure(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'P2034'
  )
}
