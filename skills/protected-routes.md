# Skill: Protected Routes

## Purpose

Implementation guide for securing routes so only authenticated users (and admins) can access protected pages and API endpoints.

## Business Goal

Ensure guests cannot access admin pages, unauthenticated users cannot access booking pages, and API endpoints cannot be called without valid tokens.

## Scope

- Client-side route guards
- Server-side API middleware
- Redirect logic with returnUrl
- Auth loading state handling

---

## Architecture Notes

Protection happens at two layers:
1. **Client-side** — React component guards that redirect in the browser (UX layer)
2. **Server-side** — API middleware that rejects requests (security layer)

Client guards provide UX (no flash of protected content). Server middleware provides actual security. Both are required — client guard alone is not sufficient security.

---

## Implementation Details

### AuthGuard (Client Component)

Redirects unauthenticated users to login, preserving the intended URL.

```tsx
// components/auth/AuthGuard.tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Spinner } from '@/components/ui/Spinner'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { firebaseUser, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`)
    }
  }, [loading, firebaseUser, pathname, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" label="Checking your session..." />
      </div>
    )
  }

  if (!firebaseUser) return null  // Redirect in progress

  return <>{children}</>
}
```

### AdminGuard (Client Component)

Redirects non-admins to the home page.

```tsx
// components/auth/AdminGuard.tsx
'use client'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { firebaseUser, dbUser, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!loading) {
      if (!firebaseUser) {
        router.push('/login')
      } else if (dbUser && dbUser.role !== 'ADMIN') {
        toast('Admin access required', 'error')
        router.push('/')
      }
    }
  }, [loading, firebaseUser, dbUser, router, toast])

  if (loading || !firebaseUser || !dbUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (dbUser.role !== 'ADMIN') return null  // Redirect in progress

  return <>{children}</>
}
```

### Usage in App Router Layouts

```tsx
// app/book/[tripId]/page.tsx — protected for any authenticated user
'use client'

export default function BookPage({ params }) {
  return (
    <AuthGuard>
      <BookingFormContent tripId={params.tripId} />
    </AuthGuard>
  )
}

// app/admin/layout.tsx — protected for admin only
export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <div className="flex">
        <AdminSidebar />
        <main>{children}</main>
      </div>
    </AdminGuard>
  )
}
```

### Return URL Handling After Login

```tsx
// app/login/page.tsx
'use client'

export default function LoginPage() {
  const { firebaseUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') ?? '/'

  useEffect(() => {
    if (firebaseUser) {
      router.push(returnUrl)
    }
  }, [firebaseUser, returnUrl, router])

  const handleGoogleSignIn = async () => {
    await signInWithGoogle()
    // onAuthStateChanged triggers → useEffect → router.push(returnUrl)
  }

  return (
    <LoginForm
      onGoogleSignIn={handleGoogleSignIn}
      onEmailSignIn={handleEmailSignIn}
    />
  )
}
```

### API Middleware — `requireAuth`

```ts
// lib/api-auth.ts
import { adminAuth } from './firebase-admin'
import { prisma } from './prisma'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function requireAuth(request: Request) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) throw new ApiError(401, 'Authentication required')

  let decoded
  try {
    decoded = await adminAuth.verifyIdToken(token)
  } catch {
    throw new ApiError(401, 'Invalid or expired token')
  }

  const user = await prisma.user.findUnique({
    where: { firebaseUid: decoded.uid },
  })

  if (!user) throw new ApiError(401, 'User account not found')

  return { decoded, user }
}

export async function requireAdmin(request: Request) {
  const { decoded, user } = await requireAuth(request)
  if (user.role !== 'ADMIN') throw new ApiError(403, 'Admin access required')
  return { decoded, user }
}
```

### API Route Error Handling Pattern

```ts
// app/api/bookings/route.ts
export async function POST(request: Request) {
  try {
    const { user } = await requireAuth(request)
    // ... rest of handler
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[POST /api/bookings]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## Folder Structure

```
components/
  auth/
    AuthGuard.tsx
    AdminGuard.tsx
lib/
  api-auth.ts             requireAuth() + requireAdmin() + ApiError
  firebase-admin.ts       Firebase Admin SDK singleton
hooks/
  useAuth.ts              Exposes { firebaseUser, dbUser, loading }
```

---

## Redirect Logic

| User State | Accessing | Redirect To |
|---|---|---|
| Unauthenticated | `/book/[id]` | `/login?returnUrl=/book/[id]` |
| Unauthenticated | `/admin` | `/login` |
| Authenticated GUEST | `/admin` | `/` with error toast |
| Authenticated (any) | `/login` (already signed in) | `returnUrl` or `/` |
| Authenticated ADMIN | `/login` (already signed in) | `/admin` |

---

## Edge Cases

| Case | Handling |
|---|---|
| `returnUrl` contains protocol (open redirect risk) | Validate returnUrl starts with `/` before using |
| Auth check resolves between renders | `loading` state prevents flash of protected content |
| Firebase token expires during session | SDK auto-refreshes; API middleware transparently handles refreshed token |
| User deleted from Firebase | `verifyIdToken` throws → 401 → client clears session |

---

## Security Note: Open Redirect Prevention

```ts
// Validate returnUrl before redirecting
const isValidReturnUrl = (url: string): boolean => {
  return url.startsWith('/') && !url.startsWith('//')
}

const safeReturnUrl = isValidReturnUrl(returnUrl) ? returnUrl : '/'
router.push(safeReturnUrl)
```

---

## Acceptance Criteria

- [ ] Unauthenticated access to `/book/*` redirects to `/login?returnUrl=...`
- [ ] After login, user is redirected to original destination
- [ ] Non-admin access to `/admin` redirects to `/` with toast
- [ ] All API routes call `requireAuth()` or `requireAdmin()` as first operation
- [ ] Loading spinner shown during auth check (no flash of protected content)
- [ ] `returnUrl` validated to prevent open redirect

## Future Improvements

- Next.js middleware for server-side redirect (before page render)
- Session revocation on role change
- Idle session timeout for admin accounts

## Related Documents

- [docs/11-authentication.md](../docs/11-authentication.md)
- [docs/17-role-based-access.md](../docs/17-role-based-access.md)
- [skills/firebase-authentication.md](firebase-authentication.md)
