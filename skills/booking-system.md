# Skill: Booking System

## Purpose

Encapsulate the complete knowledge required to implement, debug, and extend the Soulfullescape booking engine — from form submission to database commit.

## Business Goal

Enable developers to confidently work on the booking system knowing every rule, constraint, and edge case is documented here.

## Scope

- Booking form UI
- Booking API route
- Database transaction
- Spot count computation
- Status transitions

---

## Architecture Notes

The booking system is the most critical piece of the platform. It is intentionally isolated from other concerns. The flow is:

```
BookingForm (client)
  └── POST /api/bookings (API route)
        ├── requireAuth()
        ├── Zod validation
        └── prisma.$transaction()
              ├── SELECT trip (FOR UPDATE)
              ├── validate availability
              ├── INSERT booking
              └── UPDATE trip.spots_booked
```

WhatsApp notification is dispatched **after** the transaction commits — completely decoupled.

---

## Implementation Details

### Core Business Logic

```ts
const spotsRemaining = trip.capacity - trip.spotsBooked
const maxBookable = Math.min(10, spotsRemaining)

// Validation
if (requested < 1) throw ApiError(422, 'Must request at least 1 spot')
if (requested > maxBookable) throw ApiError(409, `Only ${spotsRemaining} spot(s) remaining`)
if (trip.status !== 'PUBLISHED') throw ApiError(409, 'Trip is not available')
if (trip.tripDate < new Date()) throw ApiError(409, 'Trip has already passed')

// After successful INSERT:
const newSpotsBooked = trip.spotsBooked + requested
const newStatus = newSpotsBooked >= trip.capacity ? 'FULL' : trip.status
```

### Transaction Isolation

Use `Serializable` isolation to prevent phantom reads under concurrent load:

```ts
await prisma.$transaction(async (tx) => { ... }, {
  isolationLevel: 'Serializable',
})
```

### Prisma Serialization Error Code

Catch and re-throw as 409:
```ts
if (err?.code === 'P2034') {
  throw new ApiError(409, 'Trip is now full. Please try another date.')
}
```

---

## Folder Structure

```
app/
  api/
    bookings/
      route.ts              POST create, GET list
      [bookingId]/
        route.ts            GET detail
lib/
  schemas/
    booking.schema.ts       Zod schema (shared client + server)
components/
  booking/
    BookingForm.tsx
    SpotSelector.tsx
    BookingConfirmation.tsx
hooks/
  useBooking.ts
```

---

## Related Components

- `BookingForm` — collects customer info and spot count
- `SpotSelector` — stepper UI with min/max enforcement
- `TripCard` — displays `maxBookable` and triggers navigation to booking form
- `BookingConfirmation` — success screen after booking

---

## Database Dependencies

Tables: `bookings`, `trips`, `users`

Critical columns:
- `trips.capacity` — total available spots
- `trips.spots_booked` — current count (incremented atomically)
- `trips.status` — must be `PUBLISHED` to accept bookings
- `bookings.price_per_person` — snapshot of price at booking time

---

## API Dependencies

- `POST /api/bookings` — creates booking (this system)
- `GET /api/trips/[tripId]` — provides `maxBookable` to the form

---

## Edge Cases

| Case | Handling |
|---|---|
| Race condition (concurrent requests) | Serializable transaction — one succeeds, others get 409 |
| Trip fills between page load and submit | `spotsRemaining` re-checked in transaction |
| WhatsApp fails | Error caught, logged, booking preserved |
| User submits form twice | Second request will succeed unless trip fills (Phase 1 allows it) |
| Trip cancelled after page load | `status !== 'PUBLISHED'` guard catches it |

---

## Error Handling

| Scenario | HTTP | Message |
|---|---|---|
| Not authenticated | 401 | "Authentication required" |
| Trip not found | 404 | "Trip not found" |
| Trip not published | 409 | "Trip is not available for booking" |
| Trip in the past | 409 | "This trip has already taken place" |
| Trip is full | 409 | "Trip is full" |
| Not enough spots | 409 | "Only N spot(s) remaining" |
| Serialization conflict | 409 | "Trip is now full. Please try another date." |
| Validation error | 422 | Field-specific message |

---

## Acceptance Criteria

- [ ] `maxBookable = Math.min(10, capacity - spots_booked)` enforced server-side
- [ ] Transaction uses Serializable isolation
- [ ] 20 concurrent requests on 5-spot trip → exactly 5 succeed
- [ ] Trip auto-marked FULL when last spot taken
- [ ] WhatsApp failure never causes booking to fail
- [ ] All error codes match the table above

## Future Improvements

- Duplicate booking prevention (user + trip unique constraint)
- Spot re-release on cancellation
- Waitlist queue integration

## Related Documents

- [docs/12-booking-engine.md](../docs/12-booking-engine.md)
- [skills/overbooking-protection.md](overbooking-protection.md)
- [skills/transaction-handling.md](transaction-handling.md)
- [skills/whatsapp-integration.md](whatsapp-integration.md)
