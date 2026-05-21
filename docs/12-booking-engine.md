# 12 — Booking Engine

## Purpose

Define the complete booking creation system, including the overbooking prevention algorithm, transaction logic, race condition handling, and all validation rules.

## Business Goal

Guarantee that every booking is accurate, atomic, and irreversible under concurrent load — the single most critical system in the platform.

---

## Core Business Rule

```
maximum_bookable_spots = Math.min(10, spots_remaining)

where:
  spots_remaining = trip.capacity - trip.spots_booked
```

This caps individual bookings at 10 spots even on large-capacity trips, preventing any single booking from monopolising a trip.

---

## Booking Validation Checklist

Before any database write, the API must verify:

| Check | Error Response |
|---|---|
| User is authenticated | `401 Unauthorized` |
| Trip exists | `404 Not Found` |
| Trip status is `PUBLISHED` | `409 Conflict: "Trip is not available for booking"` |
| Trip date is in the future | `409 Conflict: "This trip has already passed"` |
| `spots_requested >= 1` | `422 Unprocessable: "Must request at least 1 spot"` |
| `spots_requested <= 10` | `422 Unprocessable: "Cannot book more than 10 spots"` |
| `spots_remaining >= spots_requested` | `409 Conflict: "Not enough spots remaining"` |
| `whatsapp_phone` is valid format | `422 Unprocessable: "Invalid WhatsApp number"` |

---

## Transaction Implementation

```ts
// app/api/bookings/route.ts — POST handler

async function createBooking(request: Request) {
  const { user } = await requireAuth(request)
  const body = await request.json()
  const validated = bookingSchema.parse(body) // Zod — throws 422 on failure

  const booking = await prisma.$transaction(async (tx) => {
    // 1. Lock trip row for update (prevents concurrent overbooking)
    const trip = await tx.trip.findUnique({
      where: { id: validated.tripId },
    })

    if (!trip) throw new ApiError(404, 'Trip not found')
    if (trip.status !== 'PUBLISHED') throw new ApiError(409, 'Trip is not available')
    if (trip.tripDate < new Date()) throw new ApiError(409, 'Trip has already passed')

    const spotsRemaining = trip.capacity - trip.spotsBooked
    const maxBookable = Math.min(10, spotsRemaining)

    if (validated.spotsRequested < 1) throw new ApiError(422, 'Must request at least 1 spot')
    if (validated.spotsRequested > maxBookable) {
      throw new ApiError(409, `Only ${spotsRemaining} spot(s) remaining`)
    }

    // 2. Create booking record
    const newBooking = await tx.booking.create({
      data: {
        userId: user.id,
        tripId: validated.tripId,
        customerName: validated.customerName,
        customerEmail: validated.customerEmail,
        whatsappPhone: validated.whatsappPhone,
        spotsReserved: validated.spotsRequested,
        pricePerPerson: trip.pricePerPerson,
        totalPrice: trip.pricePerPerson.mul(validated.spotsRequested),
        status: 'CONFIRMED',
      },
    })

    // 3. Atomically update spots_booked and auto-set FULL status
    const newSpotsBooked = trip.spotsBooked + validated.spotsRequested
    await tx.trip.update({
      where: { id: trip.id },
      data: {
        spotsBooked: newSpotsBooked,
        status: newSpotsBooked >= trip.capacity ? 'FULL' : trip.status,
      },
    })

    return newBooking
  }, {
    isolationLevel: 'Serializable', // Prevent phantom reads under concurrent load
  })

  // 4. Send WhatsApp notification — non-blocking
  sendWhatsAppConfirmation(booking).catch((err) => {
    console.error('[WhatsApp] Failed to send confirmation:', err)
  })

  return NextResponse.json({ data: booking }, { status: 201 })
}
```

---

## Race Condition Protection

### The Problem

Without transactions, two concurrent requests could both read `spots_booked = 10` on a trip with `capacity = 11`, both pass the availability check, and both insert a booking — resulting in 12 spots booked against an 11-person capacity.

### The Solution

`prisma.$transaction()` with `isolationLevel: 'Serializable'` causes PostgreSQL to abort one of the conflicting transactions and return a serialization failure error. The application catches this error and returns `409 Conflict`.

PostgreSQL handles the serialization failure transparently — no manual locking syntax required. Prisma's serializable isolation is the correct, idiomatic approach for this case.

### Load Test Scenario

```
Trigger: 20 concurrent POST /api/bookings for a trip with 5 remaining spots
Expected: Exactly 5 bookings succeed (201), 15 fail (409)
Actual seats booked after test: 5 (no overbooking)
```

---

## Booking Status Lifecycle

```
CONFIRMED (default on creation)
      │
      └── CANCELLED (admin action or user cancellation — Phase 2)
```

Phase 1 does not implement user-initiated cancellation. Admin can cancel bookings manually in the dashboard (sets status to CANCELLED, does NOT decrement `spots_booked` — spots are not re-released in Phase 1).

---

## Price Snapshot

`price_per_person` and `total_price` are stored on the booking at creation time. If the admin later changes the trip price, existing bookings are unaffected. This is intentional — guests must not have their financial commitment changed post-booking.

---

## Zod Schema

```ts
// lib/schemas/booking.schema.ts
import { z } from 'zod'

export const bookingSchema = z.object({
  tripId: z.string().cuid(),
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  whatsappPhone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number'),
  spotsRequested: z.number().int().min(1).max(10),
})

export type BookingInput = z.infer<typeof bookingSchema>
```

---

## API Endpoint

```
POST /api/bookings
Authorization: Bearer <firebase_id_token>

Request body:
{
  "tripId": "clxxx...",
  "customerName": "Camila Rodriguez",
  "customerEmail": "camila@email.com",
  "whatsappPhone": "+17875551234",
  "spotsRequested": 4
}

Success 201:
{
  "data": {
    "id": "clyyy...",
    "tripId": "clxxx...",
    "customerName": "Camila Rodriguez",
    "spotsReserved": 4,
    "totalPrice": "299.96",
    "status": "CONFIRMED",
    "createdAt": "2025-07-19T14:22:00Z"
  }
}

Conflict 409:
{ "error": "Only 2 spot(s) remaining" }
```

---

## Edge Cases

| Scenario | Handling |
|---|---|
| Concurrent bookings exceed capacity | Serializable transaction → one succeeds, others fail with 409 |
| Trip cancelled after page load but before submit | `status !== 'PUBLISHED'` check → 409 |
| Trip date passed after page load | `tripDate < new Date()` check → 409 |
| WhatsApp send times out | Caught by `.catch()`, logged, booking record preserved |
| Prisma serialization failure error | Caught at top level, re-thrown as 409 |
| User tries to book same trip twice | Not prevented in Phase 1; allowed (group re-booking case) |

---

## Acceptance Criteria

- [ ] 20 concurrent booking requests on a 5-spot trip results in exactly 5 confirmations
- [ ] `spots_booked` never exceeds `capacity` in the database
- [ ] Trip status becomes `FULL` automatically when last spot is taken
- [ ] WhatsApp failure does not cause booking to rollback
- [ ] All validation errors return correct HTTP status codes
- [ ] Booking price is immutable after creation

## Related Documents

- [10-database-schema.md](10-database-schema.md)
- [13-whatsapp-notifications.md](13-whatsapp-notifications.md)
- [skills/booking-system.md](../skills/booking-system.md)
- [skills/overbooking-protection.md](../skills/overbooking-protection.md)
- [skills/transaction-handling.md](../skills/transaction-handling.md)
