# 03 — Product Requirements

## Purpose

Enumerate every functional and non-functional requirement so that development work can be unambiguously scoped, accepted, or deferred.

## Business Goal

Ensure all stakeholders share a common definition of "done" for Phase 1 of the Soulfullescape platform.

## Scope

Phase 1 only. Phase 2 and Phase 3 requirements are tracked in [30-future-enhancements.md](30-future-enhancements.md).

---

## Functional Requirements

### FR-01 — Landing Page

| ID | Requirement | Priority |
|---|---|---|
| FR-01-1 | Display hero section with tagline and primary CTA | P0 |
| FR-01-2 | Show experience pillars (nature, music, food, etc.) | P0 |
| FR-01-3 | Display upcoming available trips in a card grid | P0 |
| FR-01-4 | Show real-time remaining spots per trip | P0 |
| FR-01-5 | Navigate to booking form from trip card | P0 |
| FR-01-6 | Responsive layout: mobile, tablet, desktop | P0 |

### FR-02 — Authentication

| ID | Requirement | Priority |
|---|---|---|
| FR-02-1 | Guest can sign in with Google OAuth | P0 |
| FR-02-2 | Guest can sign in with email + password | P0 |
| FR-02-3 | Guest can register with email + password | P0 |
| FR-02-4 | Forgot password / reset via Firebase | P0 |
| FR-02-5 | Auth state persists across page refreshes | P0 |
| FR-02-6 | Unauthenticated users redirected to login before booking | P0 |
| FR-02-7 | Admin role stored in DB and synced on login | P0 |

### FR-03 — Trip Discovery

| ID | Requirement | Priority |
|---|---|---|
| FR-03-1 | List all upcoming trips with status (available/full/cancelled) | P0 |
| FR-03-2 | Show trip date, time, capacity, spots remaining, price | P0 |
| FR-03-3 | Trip detail page with full description and media | P0 |
| FR-03-4 | Filter trips by date (future only by default) | P1 |

### FR-04 — Booking Engine

| ID | Requirement | Priority |
|---|---|---|
| FR-04-1 | Guest selects number of spots (1 to max_bookable) | P0 |
| FR-04-2 | `max_bookable = Math.min(10, capacity - spots_booked)` | P0 |
| FR-04-3 | Booking locked via DB transaction to prevent race conditions | P0 |
| FR-04-4 | Booking rejected if trip is full or cancelled | P0 |
| FR-04-5 | `spots_booked` incremented atomically on successful booking | P0 |
| FR-04-6 | Trip auto-marked "FULL" when `spots_booked >= capacity` | P0 |
| FR-04-7 | Booking confirmation stored in DB | P0 |
| FR-04-8 | Guest receives WhatsApp confirmation message | P0 |
| FR-04-9 | Guest sees confirmation screen after booking | P0 |
| FR-04-10 | Duplicate booking prevention per user per trip | P1 |

### FR-05 — Admin Dashboard

| ID | Requirement | Priority |
|---|---|---|
| FR-05-1 | Admin-only route protected by RBAC | P0 |
| FR-05-2 | Create new trip (title, description, date, capacity, price) | P0 |
| FR-05-3 | Edit existing trip | P0 |
| FR-05-4 | Cancel a trip | P0 |
| FR-05-5 | View all bookings for a trip | P0 |
| FR-05-6 | View all bookings across all trips | P0 |
| FR-05-7 | Export bookings to CSV | P0 |
| FR-05-8 | Dashboard summary cards (total trips, revenue, bookings) | P1 |

### FR-06 — WhatsApp Notifications

| ID | Requirement | Priority |
|---|---|---|
| FR-06-1 | Send confirmation on successful booking | P0 |
| FR-06-2 | Message includes: trip title, date, spots, guest name | P0 |
| FR-06-3 | Graceful failure: booking succeeds even if WhatsApp fails | P0 |
| FR-06-4 | Log WhatsApp delivery status | P1 |

---

## Non-Functional Requirements

### NFR-01 — Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-01-1 | Largest Contentful Paint (LCP) | < 2.5 s |
| NFR-01-2 | First Input Delay (FID) | < 100 ms |
| NFR-01-3 | Cumulative Layout Shift (CLS) | < 0.1 |
| NFR-01-4 | API response time (p95) | < 500 ms |
| NFR-01-5 | Booking transaction completion | < 2 s |

### NFR-02 — Security

| ID | Requirement |
|---|---|
| NFR-02-1 | All API routes validate Firebase ID token server-side |
| NFR-02-2 | Admin routes validate `role = 'ADMIN'` from DB |
| NFR-02-3 | All DB queries use Prisma parameterised statements |
| NFR-02-4 | Environment variables never exposed to client bundle |
| NFR-02-5 | CORS restricted to known origins |
| NFR-02-6 | Rate limiting on booking endpoint |

### NFR-03 — Reliability

| ID | Requirement |
|---|---|
| NFR-03-1 | Zero overbooking incidents |
| NFR-03-2 | Booking state consistent after any single point of failure |
| NFR-03-3 | WhatsApp failure must not rollback booking |

### NFR-04 — Accessibility

| ID | Requirement |
|---|---|
| NFR-04-1 | WCAG 2.1 AA compliance |
| NFR-04-2 | Keyboard navigable booking flow |
| NFR-04-3 | Screen reader compatible forms |

### NFR-05 — Maintainability

| ID | Requirement |
|---|---|
| NFR-05-1 | Every module has a corresponding skills doc |
| NFR-05-2 | TypeScript strict mode enabled |
| NFR-05-3 | ESLint + Prettier enforced via CI |

---

## Acceptance Criteria (Phase 1 Complete)

- [ ] Guest can discover, book, and receive WhatsApp confirmation end-to-end
- [ ] Admin can create, edit, cancel trips and export bookings to CSV
- [ ] Zero overbooking under concurrent load (tested with concurrent requests)
- [ ] All P0 requirements implemented and passing automated tests
- [ ] Lighthouse score ≥ 90 on mobile for landing page
- [ ] No TypeScript errors in strict mode

## Related Documents

- [12-booking-engine.md](12-booking-engine.md)
- [14-admin-dashboard.md](14-admin-dashboard.md)
- [13-whatsapp-notifications.md](13-whatsapp-notifications.md)
