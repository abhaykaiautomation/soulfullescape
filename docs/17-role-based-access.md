# 17 — Role-Based Access Control

## Purpose

Define the complete permission model for the Soulfullescape platform, specifying exactly what each role can and cannot do.

## Business Goal

Ensure guests can only access their own data, and admins have the controls they need — with no grey areas or accidental privilege leakage.

---

## Roles

| Role | Description | Assignment |
|---|---|---|
| `GUEST` | Registered platform user who can browse and book trips | Default on registration |
| `ADMIN` | Platform operator with full management access | Manual DB update only |

There is no self-service role elevation. Admin role is assigned directly in the database by the platform owner.

---

## Permission Matrix

| Action | Public | GUEST | ADMIN |
|---|---|---|---|
| View landing page | ✓ | ✓ | ✓ |
| View published trips | ✓ | ✓ | ✓ |
| View trip detail (published) | ✓ | ✓ | ✓ |
| View trip detail (draft/cancelled) | ✗ | ✗ | ✓ |
| Sign in / register | ✓ | redirect | redirect |
| Book a trip | ✗ → /login | ✓ | ✓ |
| View own bookings | ✗ | ✓ | ✓ |
| View another user's bookings | ✗ | ✗ | ✓ |
| View account page | ✗ | ✓ | ✓ |
| Access /admin | ✗ → / | ✗ → / | ✓ |
| Create trip | ✗ | ✗ | ✓ |
| Edit trip | ✗ | ✗ | ✓ |
| Cancel trip | ✗ | ✗ | ✓ |
| View all bookings | ✗ | ✗ | ✓ |
| Export bookings CSV | ✗ | ✗ | ✓ |
| Cancel any booking | ✗ | ✗ | ✓ |
| View dashboard stats | ✗ | ✗ | ✓ |

---

## Client-Side Guard: `AdminGuard`

```tsx
// components/auth/AdminGuard.tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { redirect } from 'next/navigation'
import { Spinner } from '@/components/ui/Spinner'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, dbUser, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user || dbUser?.role !== 'ADMIN') {
    redirect('/')
  }

  return <>{children}</>
}
```

Used in admin layout:
```tsx
// app/admin/layout.tsx
export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <AdminSidebar />
      <main>{children}</main>
    </AdminGuard>
  )
}
```

---

## Client-Side Guard: `AuthGuard`

```tsx
// components/auth/AuthGuard.tsx
'use client'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  if (loading) return <Spinner />
  if (!user) {
    router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`)
    return null
  }

  return <>{children}</>
}
```

---

## Server-Side Guard: API Middleware

```ts
// lib/api-auth.ts

export async function requireAuth(request: Request) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    throw new ApiError(401, 'Authentication required')
  }

  let decoded: DecodedIdToken
  try {
    decoded = await adminAuth.verifyIdToken(token)
  } catch {
    throw new ApiError(401, 'Invalid or expired token')
  }

  const user = await prisma.user.findUnique({
    where: { firebaseUid: decoded.uid },
  })

  if (!user) {
    throw new ApiError(401, 'User account not found')
  }

  return { decoded, user }
}

export async function requireAdmin(request: Request) {
  const { decoded, user } = await requireAuth(request)

  if (user.role !== 'ADMIN') {
    throw new ApiError(403, 'Admin access required')
  }

  return { decoded, user }
}
```

---

## Ownership Check Pattern

For resources owned by a user (e.g. bookings), apply ownership check after auth:

```ts
// app/api/bookings/[bookingId]/route.ts
const { user } = await requireAuth(request)
const booking = await prisma.booking.findUnique({ where: { id: params.bookingId } })

if (!booking) throw new ApiError(404, 'Booking not found')
if (booking.userId !== user.id && user.role !== 'ADMIN') {
  throw new ApiError(403, 'Access denied')
}
```

---

## Admin Role Assignment (Manual)

```sql
-- Run directly in Neon console or via Prisma Studio
UPDATE users
SET role = 'ADMIN'
WHERE email = 'sofia@soulfullescape.com';
```

This is intentionally manual in Phase 1. Phase 2 will add an admin invite system.

---

## Edge Cases

| Scenario | Handling |
|---|---|
| Admin demoted while session active | Role re-checked on each API call — no session caching of role |
| Guest accesses `/admin` directly | `AdminGuard` redirects to `/` immediately |
| Unauthenticated POST to `/api/bookings` | `requireAuth()` returns 401 |
| Admin accesses another user's booking | Allowed — admin has cross-user read access |
| Guest tries to view admin stats endpoint | `requireAdmin()` returns 403 |

---

## Future Enhancements

- Firebase custom claims for role (avoids DB lookup per request)
- Admin invite system (generate one-time invite link)
- Additional roles: `STAFF` (can view bookings but not create trips), `VIEWER` (read-only admin)
- Audit log table: tracks who made which admin actions and when

---

## Acceptance Criteria

- [ ] No admin action possible without `role === 'ADMIN'` verified from DB
- [ ] No guest can view another user's booking via direct URL
- [ ] Unauthenticated user accessing `/book/*` redirected to `/login` with returnUrl
- [ ] `AdminGuard` redirects non-admins on all admin pages
- [ ] `requireAdmin()` returns 403 (not 401) for authenticated non-admin users

## Related Documents

- [11-authentication.md](11-authentication.md)
- [16-security-rules.md](16-security-rules.md)
- [06-site-map.md](06-site-map.md)
- [skills/protected-routes.md](../skills/protected-routes.md)
