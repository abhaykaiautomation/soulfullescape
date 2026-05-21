# Skill: Firebase Authentication

## Purpose

Complete reference for implementing and maintaining Firebase Authentication in the Soulfullescape platform.

## Business Goal

Provide secure, frictionless sign-in via Google and email/password, with server-side token verification on every protected API call.

## Scope

- Firebase client SDK initialisation
- Google OAuth + Email/Password sign-in
- Firebase Admin SDK token verification
- User upsert on first login
- Auth state management in React

---

## Architecture Notes

Firebase Auth handles all credential management. The platform only stores a `firebase_uid` reference — never passwords or auth secrets. Roles are stored in PostgreSQL, not Firebase custom claims.

```
Client (browser)
  ├── Firebase Client SDK
  │     ├── Google OAuth popup
  │     ├── Email/password sign-in
  │     └── getIdToken() → JWT (1hr expiry, auto-refresh)
  │
  └── Every API call: Authorization: Bearer <token>
        │
        └── API Route
              └── Firebase Admin SDK
                    └── verifyIdToken(token) → decoded UID
                          └── DB lookup: users.firebase_uid = uid
```

---

## Implementation Details

### Client SDK Init

```ts
// lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(app)
```

### Admin SDK Init (Server Only)

```ts
// lib/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { config } from './config'

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

### Google Sign-In

```ts
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const provider = new GoogleAuthProvider()

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider)
  const token = await result.user.getIdToken()
  await fetch('/api/auth/me', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  return result.user
}
```

### Email/Password Sign-In

```ts
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'

export async function signIn(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password)
  const token = await result.user.getIdToken()
  await syncUserToDB(token)
  return result.user
}

export async function register(name: string, email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(result.user, { displayName: name })
  const token = await result.user.getIdToken()
  await syncUserToDB(token, { name })
  return result.user
}
```

### Token Retrieval (with Auto-Refresh)

```ts
export async function getCurrentUserToken(): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  return user.getIdToken() // Firebase auto-refreshes if expiring
}
```

### Password Reset

```ts
import { sendPasswordResetEmail } from 'firebase/auth'

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email)
  // Always show "check your inbox" — never confirm/deny email existence
}
```

---

## Folder Structure

```
lib/
  firebase.ts           Client SDK init
  firebase-admin.ts     Admin SDK init (server only)
  api-auth.ts           requireAuth() / requireAdmin() helpers
context/
  AuthContext.tsx        onAuthStateChanged provider
hooks/
  useAuth.ts            Exports { firebaseUser, dbUser, loading, signOut }
```

---

## Related Components

- `AuthGuard` — wraps protected pages, redirects on no auth
- `AdminGuard` — wraps admin pages, redirects on no admin role
- `LoginForm` — calls `signIn()` / `signInWithGoogle()`
- `RegisterForm` — calls `register()`
- `NavBar` — reads `useAuth()` for user state

---

## Database Dependencies

- `users.firebase_uid` — unique key linking Firebase UID to DB user
- `users.role` — GUEST or ADMIN; determines permissions

---

## API Dependencies

- `POST /api/auth/me` — upserts user in DB after every sign-in

---

## Edge Cases

| Case | Handling |
|---|---|
| User deletes Firebase account | Next API call returns 401; client clears session |
| Token expired | Firebase SDK auto-refreshes before `getIdToken()` returns |
| Google account email changes | Upsert updates email; firebase_uid stays stable |
| Invalid private key format | App throws on startup — check `\n` → newline conversion |
| Firebase project not configured | Client SDK throws on `initializeApp` |

---

## Error Handling

| Firebase Error Code | User Message |
|---|---|
| `auth/wrong-password` | "Incorrect email or password" |
| `auth/user-not-found` | "Incorrect email or password" (don't distinguish) |
| `auth/email-already-in-use` | "An account with this email already exists" |
| `auth/weak-password` | "Password must be at least 8 characters" |
| `auth/popup-closed-by-user` | (silent — user intentionally closed) |
| `auth/network-request-failed` | "Connection error. Check your internet." |

---

## Acceptance Criteria

- [ ] Google sign-in works end-to-end (popup → upsert → redirect)
- [ ] Email/password sign-in and registration work
- [ ] Password reset sends email (regardless of account existence)
- [ ] Admin SDK `verifyIdToken` called on every protected route
- [ ] `FIREBASE_PRIVATE_KEY` has correct `\n` conversion in `lib/config.ts`
- [ ] Auth state persists across page refreshes

## Future Improvements

- Firebase custom claims for role (eliminates DB lookup per request)
- Phone number authentication (WhatsApp-native login)
- Multi-factor authentication for admin accounts

## Related Documents

- [docs/11-authentication.md](../docs/11-authentication.md)
- [skills/protected-routes.md](protected-routes.md)
- [docs/16-security-rules.md](../docs/16-security-rules.md)
