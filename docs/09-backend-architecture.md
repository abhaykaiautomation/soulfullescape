# 09 — Backend Architecture

## Purpose

Define the structure, conventions, and patterns for all server-side logic in the Next.js API layer.

## Business Goal

Ensure the backend is secure, predictable, and maintainable — with consistent patterns every developer can follow.

---

## API Layer: Next.js Route Handlers

All backend logic lives in `app/api/` using Next.js 14 Route Handlers.

```
app/api/
├── auth/
│   └── me/
│       └── route.ts              GET — return current user profile
│
├── users/
│   └── [uid]/
│       └── route.ts              GET — user detail (admin only)
│
├── trips/
│   ├── route.ts                  GET list, POST create (admin)
│   └── [tripId]/
│       └── route.ts              GET detail, PATCH update, DELETE cancel
│
├── bookings/
│   ├── route.ts                  GET all (admin), POST create
│   └── [bookingId]/
│       ├── route.ts              GET detail
│       └── export/
│           └── route.ts          GET CSV export (admin)
│
└── admin/
    └── stats/
        └── route.ts              GET dashboard summary stats (admin)
```

---

## Request Lifecycle

Every API route follows this exact middleware stack:

```
Request
   │
   ▼
1. Extract Authorization header
   │
   ▼
2. Verify Firebase ID token (Firebase Admin SDK)
   │   → 401 if missing or invalid
   │
   ▼
3. Load user record from DB (by firebase_uid)
   │   → 401 if user not found in DB
   │
   ▼
4. Check role (for admin routes)
   │   → 403 if role !== 'ADMIN'
   │
   ▼
5. Validate request body (Zod schema)
   │   → 422 if validation fails
   │
   ▼
6. Execute business logic (Prisma queries / transactions)
   │   → 409 if conflict (e.g. trip full)
   │
   ▼
7. Dispatch side effects (WhatsApp) — async, non-blocking
   │
   ▼
8. Return response
```

---

## Auth Middleware Helper

```ts
// lib/api-auth.ts
export async function requireAuth(request: Request): Promise<AuthContext>
export async function requireAdmin(request: Request): Promise<AuthContext>
```

These helpers encapsulate steps 1–4. Every protected route calls one of them as the first line.

---

## Response Format

### Success
```json
// Single resource
{ "data": { ... } }

// Collection
{ "data": [ ... ], "count": 42 }

// Created
201 { "data": { ... } }

// No content
204 (empty body)
```

### Error
```json
{ "error": "Human-readable message" }
```

HTTP status codes:
| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | No content (delete) |
| 400 | Bad request (malformed) |
| 401 | Unauthenticated |
| 403 | Unauthorized (wrong role) |
| 404 | Not found |
| 409 | Conflict (overbooking, duplicate) |
| 422 | Validation error |
| 500 | Internal server error |

---

## Validation Layer

All request bodies are validated with **Zod** schemas defined in `lib/schemas/`:

```
lib/schemas/
├── trip.schema.ts
├── booking.schema.ts
└── user.schema.ts
```

Schemas are shared between:
- API route validation (server)
- Form validation (client via React Hook Form + Zod resolver)

---

## Database Access Pattern

- All DB access via **Prisma Client** singleton (`lib/prisma.ts`)
- Never use raw SQL except in documented performance-critical queries
- All writes that touch multiple tables use `prisma.$transaction()`
- Read queries on public data (trip listings) may skip auth for SSR pages

```ts
// lib/prisma.ts — singleton pattern for serverless
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['query'] : [] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## Environment Variable Access

All env vars accessed via a typed config module:

```ts
// lib/config.ts
export const config = {
  neonDatabaseUrl: process.env.DATABASE_URL!,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID!,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID!,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN!,
  twilioWhatsappFrom: process.env.TWILIO_WHATSAPP_FROM!,
}
```

The `!` assertions are validated at startup with a `validateEnv()` check.

---

## Logging

Phase 1:
- `console.error()` for unexpected errors with stack traces
- `console.log()` for WhatsApp send results

Phase 2:
- Structured logging via Pino or Axiom
- Error tracking via Sentry

---

## Rate Limiting

Phase 1: Vercel's built-in edge rate limiting (configure in `vercel.json`).
Phase 2: Upstash Redis-based rate limiter on the booking endpoint.

---

## CORS

Next.js API routes are same-origin by default. If a separate frontend origin is ever needed, configure in `next.config.js`:

```js
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://soulfullescape.com' },
      ],
    },
  ]
}
```

---

## Acceptance Criteria

- [ ] Every protected route calls `requireAuth()` or `requireAdmin()` as first line
- [ ] Every POST/PATCH body validated with a Zod schema before processing
- [ ] No raw SQL queries (except documented exceptions)
- [ ] Booking creation uses `prisma.$transaction()`
- [ ] WhatsApp send wrapped in try/catch and never throws to caller
- [ ] All env vars accessed through `config` module with startup validation

## Related Documents

- [07-system-architecture.md](07-system-architecture.md)
- [10-database-schema.md](10-database-schema.md)
- [12-booking-engine.md](12-booking-engine.md)
- [15-api-design.md](15-api-design.md)
- [16-security-rules.md](16-security-rules.md)
