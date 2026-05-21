# 07 — System Architecture

## Purpose

Describe the complete technical architecture of the Soulfullescape platform, including how every layer communicates, where data lives, and how the system fails gracefully.

## Business Goal

Provide engineers with an authoritative reference so implementation decisions stay aligned with the intended architecture.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│   Browser / Mobile Safari / Chrome                              │
│   Next.js App Router (React, TypeScript, Tailwind CSS)          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│                       HOSTING LAYER                             │
│                   Vercel Edge Network                           │
│   - Static assets via CDN                                       │
│   - Server-side rendering (SSR) on Vercel Functions             │
│   - API Routes on Vercel Serverless Functions                   │
└────────┬──────────────────┬──────────────────┬──────────────────┘
         │                  │                  │
┌────────▼───────┐ ┌────────▼───────┐ ┌────────▼──────────────────┐
│ Firebase Auth  │ │  Neon Postgres │ │  Twilio / Meta Cloud API  │
│ (Identity)     │ │  (Data Store)  │ │  (WhatsApp Notifications)  │
│                │ │  via Prisma ORM│ │                            │
└────────────────┘ └────────────────┘ └────────────────────────────┘
```

---

## Layer Responsibilities

### 1. Client Layer — Next.js App Router

- Renders all UI: landing page, trip listings, booking form, admin dashboard
- Manages Firebase Auth state via `onAuthStateChanged`
- Sends Firebase ID token in `Authorization: Bearer <token>` header with every API call
- Handles optimistic UI where appropriate
- Never holds secrets or business logic

### 2. API Layer — Next.js API Routes

- All routes under `app/api/` or `pages/api/`
- **Every route validates** the Firebase ID token server-side using the Firebase Admin SDK
- Business logic lives here (booking transactions, RBAC checks, CSV export)
- Communicates with Neon PostgreSQL exclusively via Prisma ORM
- Dispatches WhatsApp messages via Twilio/Meta Cloud API after successful operations

### 3. Authentication — Firebase Auth

- Firebase handles token issuance, refresh, and revocation
- Firebase Admin SDK (server-side) verifies tokens without a network call (JWK caching)
- User roles (`GUEST`, `ADMIN`) are stored in the **PostgreSQL `users` table**, not in Firebase custom claims (for Phase 1 simplicity; Firebase custom claims are a Phase 2 option)
- On first login, the API upserts a `users` row keyed by `firebase_uid`

### 4. Database — Neon PostgreSQL + Prisma ORM

- Neon provides serverless PostgreSQL with connection pooling (PgBouncer)
- Prisma ORM handles migrations, type-safe queries, and transactions
- Critical booking writes use `prisma.$transaction()` for atomicity
- Connection string uses pooled endpoint for runtime; direct endpoint for migrations

### 5. Notifications — Twilio / Meta Cloud API

- After a successful booking, the API dispatches a WhatsApp message asynchronously
- WhatsApp send is **fire-and-forget** — a failure does NOT rollback the booking
- Errors are logged to console (Phase 1); structured error logging in Phase 2

---

## Data Flow: Booking Creation

```
Client                     API Route                  Database              WhatsApp
  │                            │                          │                     │
  │── POST /api/bookings ──────►│                          │                     │
  │   {Authorization: Bearer}  │                          │                     │
  │                            │── verifyToken() ─────────►│ (Firebase Admin)    │
  │                            │◄─ decoded uid ────────────│                     │
  │                            │                          │                     │
  │                            │── prisma.$transaction ───►│                     │
  │                            │   ├── SELECT trip        │                     │
  │                            │   ├── CHECK capacity     │                     │
  │                            │   ├── INSERT booking     │                     │
  │                            │   └── UPDATE spots_booked│                     │
  │                            │◄─ booking record ─────────│                     │
  │                            │                          │                     │
  │                            │── sendWhatsApp() ─────────────────────────────►│
  │                            │   (async, non-blocking)  │                     │
  │                            │                          │                     │
  │◄── 201 { booking } ────────│                          │                     │
```

---

## Environment Separation

| Environment | Purpose | Neon Branch | Vercel Project |
|---|---|---|---|
| `development` | Local dev | `dev` branch | Local `next dev` |
| `preview` | PR preview | `preview` branch | Vercel preview URL |
| `production` | Live site | `main` branch | Vercel production URL |

---

## Key Architectural Decisions

### Decision 1: App Router over Pages Router
Next.js App Router enables React Server Components, streaming, and nested layouts — critical for admin dashboard performance and landing page SEO.

### Decision 2: Roles in PostgreSQL, not Firebase Claims
Firebase custom claims require token refresh for role changes to take effect. Storing roles in the database allows instant role changes without forcing re-authentication (Phase 1 simplicity).

### Decision 3: Prisma Transactions for Booking
`prisma.$transaction()` with serializable isolation ensures that concurrent booking requests cannot produce double-bookings. This is the single most important architectural constraint.

### Decision 4: WhatsApp is Non-Blocking
Booking integrity is more important than notification delivery. A failed WhatsApp send should never cause a booking to fail. The operator can manually notify guests in the rare case of notification failure.

### Decision 5: Neon Serverless Connection Pooling
Vercel serverless functions open new connections on every invocation. Without connection pooling (PgBouncer via Neon's pooled endpoint), the database would exhaust connections under load.

---

## Scalability Limits (Phase 1)

| Constraint | Current Limit | Resolution (Phase 2) |
|---|---|---|
| Concurrent bookings | ~50 req/s (Neon free tier) | Upgrade Neon plan |
| WhatsApp messages | Twilio trial limits | Upgrade Twilio account |
| Serverless cold starts | ~200–500ms | Vercel Pro warm instances |
| Admin CSV export | In-memory (< 10k rows) | Streaming export |

---

## Error Handling Philosophy

- **Client errors (4xx)**: Return `{ error: string }` with descriptive message. Client displays to user.
- **Server errors (5xx)**: Return generic `{ error: "Internal server error" }`. Details logged server-side only.
- **Transaction conflicts**: Return `409 Conflict` with `{ error: "Trip is now full" }`.
- **Auth failures**: Return `401 Unauthorized` — client redirects to `/login`.

## Related Documents

- [08-frontend-architecture.md](08-frontend-architecture.md)
- [09-backend-architecture.md](09-backend-architecture.md)
- [10-database-schema.md](10-database-schema.md)
- [11-authentication.md](11-authentication.md)
- [12-booking-engine.md](12-booking-engine.md)
