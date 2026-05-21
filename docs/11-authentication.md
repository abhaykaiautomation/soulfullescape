# 11 — Authentication

## Purpose

Specify the complete authentication system: how users sign in, how tokens are verified, how sessions are managed, and how roles are enforced.

## Business Goal

Ensure that only authorised users can book trips, and only admins can access management features — with zero security gaps.

## Architecture Notes

- **Provider**: Firebase Authentication
- **Client SDK**: `firebase/auth` (browser)
- **Server SDK**: `firebase-admin` (API routes)
- **Roles**: Stored in PostgreSQL `users.role`, not Firebase custom claims
- **Token type**: Firebase ID token (JWT, 1-hour expiry, auto-refreshed by SDK)

---

## Authentication Methods

### Method 1: Google OAuth

```
User clicks "Sign in with Google"
      │
      ▼
Firebase Google OAuth popup
      │
      ├── User cancels → stay on login page
      │
      └── User authorises
              │
              ▼
      Firebase returns ID token + user info
              │
              ▼
      POST /api/auth/me (with token)
              │
              └── API upserts user in DB (create or update name/email)
```

### Method 2: Email + Password

```
User submits email + password
      │
      ├── signInWithEmailAndPassword(auth, email, password)
      │       │
      │       ├── Firebase error (wrong credentials) → inline error message
      │       │
      │       └── Success → Firebase returns ID token
      │               │
      │               └── POST /api/auth/me → upsert user in DB
      │
      └── createUserWithEmailAndPassword (registration)
              │
              └── Same upsert flow
```

---

## Firebase Client SDK Init

```ts
// lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ...
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(app)
```

---

## Firebase Admin SDK Init

```ts
// lib/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: config.firebaseProjectId,
      clientEmail: config.firebaseClientEmail,
      privateKey: config.firebasePrivateKey,
    }),
  })
}

export const adminAuth = getAuth()
```

---

## Token Verification (Server-Side)

```ts
// lib/api-auth.ts
export async function requireAuth(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) throw new ApiError(401, 'Missing token')

  const decoded = await adminAuth.verifyIdToken(token)
  const user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } })
  if (!user) throw new ApiError(401, 'User not found')

  return { decoded, user }
}

export async function requireAdmin(request: Request) {
  const { decoded, user } = await requireAuth(request)
  if (user.role !== 'ADMIN') throw new ApiError(403, 'Admin access required')
  return { decoded, user }
}
```

---

## Auth Context (Client-Side)

```tsx
// context/AuthContext.tsx
interface AuthContextValue {
  user: FirebaseUser | null
  dbUser: DbUser | null        // includes role
  loading: boolean
  signOut: () => Promise<void>
}

// Implementation watches onAuthStateChanged
// When user is set, fetches /api/auth/me to get role and DB user
// Caches DB user for session duration
```

---

## User Upsert on Login

Every sign-in triggers `POST /api/auth/me` which:

1. Verifies Firebase ID token
2. `prisma.user.upsert()` where `firebaseUid = decoded.uid`
3. Creates user with `role: GUEST` on first login
4. Updates `name` and `email` on subsequent logins (in case Firebase profile changed)
5. Returns the user record including `role`

---

## Password Reset Flow

```
User clicks "Forgot password"
      │
      ▼
Enter email address
      │
      ▼
sendPasswordResetEmail(auth, email)
      │
      ├── Firebase sends reset email
      └── UI shows: "Check your inbox" (regardless of whether email exists — prevents enumeration)
```

---

## Session Management

- Firebase ID tokens expire after **1 hour**
- Firebase SDK automatically refreshes tokens in the background via refresh tokens
- The client-side `useAuth()` hook always calls `user.getIdToken()` (with `forceRefresh: false`) before API calls — Firebase returns cached token or auto-refreshes
- On sign-out: `signOut(auth)` → Firebase clears local storage → context resets → redirect to `/`

---

## Role-Based Access Control (Summary)

Full RBAC detail in [17-role-based-access.md](17-role-based-access.md).

| Role | Permissions |
|---|---|
| `GUEST` | Browse trips, book trips, view own bookings |
| `ADMIN` | All GUEST permissions + create/edit/cancel trips, view all bookings, export CSV |

Role is set manually in the database. There is no self-service role elevation.

---

## Security Considerations

| Risk | Mitigation |
|---|---|
| Token forgery | Firebase Admin SDK verifies signature with Google's JWKs |
| Token replay | Firebase tokens have 1-hour expiry; admin SDK checks `exp` claim |
| Role escalation | Role read from DB after token verification, not from token |
| Session fixation | Firebase manages session storage securely |
| Email enumeration on reset | Same UI response regardless of whether email exists |
| Admin credential exposure | Firebase Admin private key only in server env vars, never client |

---

## Environment Variables Required

```env
# Client-side (NEXT_PUBLIC_ prefix — safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Server-side only (never expose to client)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

---

## Edge Cases

- User deletes Firebase account externally → next API call returns 401, user session cleared on client
- Admin demoted while logged in → role re-checked on each API request, not cached client-side beyond session
- Google account email changes → upsert updates email field; firebase_uid remains stable
- Concurrent logins from multiple devices → each device holds its own valid token

## Related Documents

- [17-role-based-access.md](17-role-based-access.md)
- [16-security-rules.md](16-security-rules.md)
- [skills/firebase-authentication.md](../skills/firebase-authentication.md)
- [skills/protected-routes.md](../skills/protected-routes.md)
