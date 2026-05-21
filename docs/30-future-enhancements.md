# 30 — Future Enhancements

## Purpose

Track all features, improvements, and architectural upgrades deferred beyond Phase 1, with rationale for why they were deferred and what would trigger their prioritisation.

## Business Goal

Maintain a clear product roadmap so Phase 1 scope remains tight while capturing ideas before they are forgotten.

---

## Phase 2 — Growth Features

### P2-01: Stripe Payment Integration

**What:** Accept credit card payments at time of booking. Booking is only confirmed after payment succeeds.

**Why deferred:** Requires Stripe account setup, webhook handling, refund policies, and Stripe's identity verification process. Adds significant complexity before the product is validated.

**Trigger:** When operator wants to automate revenue collection and reduce no-shows.

**Architecture Impact:**
- New `payments` table (payment_intent_id, amount, status)
- Stripe webhook handler at `/api/webhooks/stripe`
- Booking moves to PENDING until payment confirmed
- Refund logic on trip cancellation

---

### P2-02: Waitlist for Sold-Out Trips

**What:** Guest can join a waitlist when a trip is full. If a spot opens (cancellation), next guest on waitlist is notified.

**Why deferred:** Requires cancellation logic (which releases spots) and a queue system.

**Architecture Impact:**
- New `waitlist` table (user_id, trip_id, position, created_at)
- PATCH `/api/bookings/[id]/cancel` — releases spots, triggers waitlist notification
- Background job (Vercel Cron) or webhook-driven waitlist advancement

---

### P2-03: Pre-Trip Reminder Notifications

**What:** WhatsApp reminder sent 24 hours before trip date with meeting point, what to bring, etc.

**Why deferred:** Requires scheduled job infrastructure.

**Architecture Impact:**
- Vercel Cron job: `0 9 * * *` — find trips in next 24 hours, send reminders to all confirmed bookings
- Template: "Tomorrow is the day! Here's everything you need to know..."

---

### P2-04: Trip Cancellation Notifications

**What:** When admin cancels a trip, all confirmed guests receive WhatsApp notification.

**Why deferred:** Simple to implement but requires careful UX around refund expectations (P2-01 dependency).

---

### P2-05: Guest Reviews and Ratings

**What:** Guests who attended a trip can leave a 1–5 star rating and written review. Visible on trip detail page.

**Architecture Impact:**
- New `reviews` table (booking_id, rating, comment, approved)
- Admin approval queue for reviews
- Average rating computed and displayed on trip cards

---

### P2-06: SMS Fallback

**What:** If WhatsApp delivery fails, retry via SMS to same number.

**Architecture Impact:**
- Twilio SMS API (same account)
- Retry logic in `lib/whatsapp.ts` with fallback to SMS

---

### P2-07: Firebase Custom Claims for Roles

**What:** Store `role` in Firebase custom claims so the API doesn't need a DB lookup on every request.

**Why deferred:** Custom claims require token refresh when changed — current DB approach is simpler.

**Architecture Impact:**
- Remove DB role lookup from `requireAuth()`
- Add custom claim sync on role change
- Handle token refresh on role change

---

## Phase 3 — Scale Features

### P3-01: React Native / Expo Mobile App

**What:** Native iOS/Android app for the same guest booking experience.

**Why deferred:** Web mobile experience is sufficient for Phase 1 volume.

**Architecture Impact:**
- Shared API (no change)
- Shared Zod schemas (extracted to `@soulfullescape/schemas` package)
- Deep links for booking confirmations

---

### P3-02: Analytics Dashboard

**What:** Revenue charts, popular trip times, guest retention rate, WhatsApp delivery rates — visible in admin.

**Architecture Impact:**
- Aggregate queries on `bookings` and `trips` tables
- Time-series charts (Recharts or Chart.js)
- Date range filtering

---

### P3-03: Affiliate / Referral Tracking

**What:** Influencers get a unique referral link. Track bookings attributed to each referrer.

**Architecture Impact:**
- New `referrals` table (code, user_id, commission_rate)
- UTM parameter tracking stored on booking
- Referral payout tracking

---

### P3-04: Gift Cards / Vouchers

**What:** Purchase a gift card worth X spots. Recipient redeems at booking.

**Architecture Impact:**
- New `vouchers` table (code, amount_remaining, expiry)
- Voucher validation and deduction at checkout

---

### P3-05: Multi-Destination Support

**What:** Soulfullescape expands to additional locations. Each destination has its own trip calendar.

**Architecture Impact:**
- New `destinations` table
- All trip and booking queries scoped to destination
- URL structure: `/destinations/[slug]/trips/[tripId]`

---

### P3-06: Multi-Language Support (i18n)

**What:** Spanish language version of the platform (critical for local Puerto Rican market).

**Architecture Impact:**
- `next-intl` for routing and message files
- `/es/` URL prefix
- Translated UI copy + trip descriptions (operator inputs both)

---

### P3-07: Human-Readable Trip Slugs

**What:** URLs like `/trips/lake-day-july-2025` instead of `/trips/clxxx`.

**Architecture Impact:**
- Add `slug` column to `trips` table
- Unique constraint on slug
- URL redirect from old CUID-based URLs

---

## Technical Debt Register

| Item | Priority | Notes |
|---|---|---|
| Upgrade to React Query / SWR | Medium | Replaces manual `useEffect` data fetching |
| Structured logging (Pino + Axiom) | Medium | Replaces `console.error` |
| Sentry error tracking | High | Required before Phase 2 launch |
| Lighthouse CI in GitHub Actions | Medium | Enforce performance budget on PRs |
| Dependency audit automation (Renovate) | Low | Weekly automated PR for dep updates |
| CSP headers | High | Required for security hardening |

---

## Decision Log

| Decision | Rationale | Revisit Trigger |
|---|---|---|
| No Stripe in Phase 1 | Validate demand before payment infrastructure | > 50 bookings/month |
| Roles in DB, not Firebase claims | Simplicity; instant role changes | High request volume hitting DB |
| No cancellation in Phase 1 | Spots not re-released; refund policy undefined | Customer demand |
| Twilio over Meta Cloud API | Faster setup; sandbox available | > 1000 messages/month |
| No React Query in Phase 1 | Complexity not justified | More than 3 pages with stale-data issues |

---

## Acceptance Criteria

This document has no acceptance criteria — it is a living record that is updated as Phase 1 decisions are made and Phase 2 planning begins.

## Related Documents

- [01-vision.md](01-vision.md)
- [03-product-requirements.md](03-product-requirements.md)
- [07-system-architecture.md](07-system-architecture.md)
