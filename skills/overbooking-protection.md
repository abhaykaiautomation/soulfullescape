# Skill: Overbooking Protection

## Purpose

Complete technical specification for the mechanisms that prevent Soulfullescape from ever selling more spots than a trip has capacity for.

## Business Goal

Zero overbooking incidents under any load condition — this is a hard business requirement, not a nice-to-have.

## Scope

- The overbooking failure mode
- Database-level protection (Serializable transactions)
- Application-level guards
- Testing the protection
- Monitoring

---

## Architecture Notes

Overbooking occurs when the gap between reading `spots_booked` and writing the new value allows two concurrent requests to both "see" availability and both commit a booking.

The only correct fix is database-level atomicity — not application-level locking. Prisma's Serializable isolation level delegates this to PostgreSQL, which aborts conflicting transactions automatically.

```
WITHOUT protection:
  Request A: reads spots_booked=19, capacity=20 → 1 spot available → proceeds
  Request B: reads spots_booked=19, capacity=20 → 1 spot available → proceeds
  Request A: writes spots_booked=20 ✓
  Request B: writes spots_booked=21 ✗ — OVERBOOKED

WITH Serializable:
  Request A: reads spots_booked=19 → proceeds → commits (spots_booked=20, status=FULL)
  Request B: attempts to read → PostgreSQL detects conflict → aborts with P2034
  Request B: API returns 409 "Trip is now full"
```

---

## Implementation Details

### Layer 1: Application Guard (Pre-Transaction)

First check before entering the transaction:

```ts
const trip = await prisma.trip.findUnique({ where: { id: tripId } })

if (!trip) throw new ApiError(404, 'Trip not found')
if (trip.status !== 'PUBLISHED') throw new ApiError(409, 'Trip is not available')
if (trip.tripDate < new Date()) throw new ApiError(409, 'Trip has already taken place')

const spotsRemaining = trip.capacity - trip.spotsBooked
const maxBookable = Math.min(10, spotsRemaining)

if (requested < 1) throw new ApiError(422, 'Must request at least 1 spot')
if (requested > maxBookable) throw new ApiError(409, `Only ${spotsRemaining} spot(s) remaining`)
```

This check is fast and handles the common case (trip already full at page load). It does NOT prevent overbooking under concurrency — that's the transaction's job.

### Layer 2: Serializable Transaction (The Real Protection)

```ts
await prisma.$transaction(
  async (tx) => {
    // Re-read inside the transaction — this is what gets serialized
    const trip = await tx.trip.findUnique({ where: { id: tripId } })

    // Re-validate inside transaction (trip state may have changed since Layer 1 check)
    const spotsRemaining = trip.capacity - trip.spotsBooked
    if (requested > spotsRemaining) {
      throw new ApiError(409, `Only ${spotsRemaining} spot(s) remaining`)
    }

    await tx.booking.create({ data: { ... } })

    await tx.trip.update({
      where: { id: tripId },
      data: {
        spotsBooked: { increment: requested },
        status: spotsRemaining - requested <= 0 ? 'FULL' : trip.status,
      },
    })
  },
  { isolationLevel: 'Serializable' }
)
```

Under Serializable isolation, PostgreSQL ensures that:
1. The read of `spots_booked` inside the transaction is consistent
2. If another transaction modifies `spots_booked` concurrently, one of them is aborted (P2034)
3. The committed transactions form a serializable order — no phantom reads

### Layer 3: Auto-FULL Status

When the last spot is taken, the trip status is immediately set to `FULL`:

```ts
status: newSpotsBooked >= trip.capacity ? 'FULL' : trip.status
```

This short-circuits all subsequent booking attempts at Layer 1 (status check) without needing to enter a transaction.

### Layer 4: Serialization Failure Handler

```ts
} catch (err) {
  if (err?.code === 'P2034') {
    return NextResponse.json(
      { error: 'Trip is now full. Please try another date.' },
      { status: 409 }
    )
  }
  throw err
}
```

---

## Why NOT Application-Level Locking?

Some platforms use `SELECT FOR UPDATE` or application-level mutexes. These approaches:
- Require infrastructure (Redis, DB lock tables)
- Introduce deadlock risk
- Reduce throughput significantly
- Are harder to reason about correctly

PostgreSQL Serializable isolation achieves the same result with:
- No external infrastructure
- Automatic conflict detection
- Clear error code (`P2034`) to handle
- Better throughput under low-conflict scenarios

---

## Testing Overbooking Protection

### Integration Test (Required)

```ts
it('20 concurrent bookings on 5-spot trip → exactly 5 succeed', async () => {
  // Setup
  const trip = await prisma.trip.create({
    data: {
      title: 'Test Trip',
      capacity: 5,
      spotsBooked: 0,
      status: 'PUBLISHED',
      tripDate: addDays(new Date(), 1),
      // ...other required fields
    },
  })
  const users = await Promise.all(
    Array.from({ length: 20 }, () => createTestUser())
  )

  // Execute 20 concurrent requests
  const results = await Promise.allSettled(
    users.map((user) =>
      fetch('/api/bookings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId: trip.id,
          customerName: user.name,
          customerEmail: user.email,
          whatsappPhone: '+17875551234',
          spotsRequested: 1,
        }),
      }).then((res) => ({ status: res.status, data: res.json() }))
    )
  )

  // Verify
  const successes = results.filter(
    (r) => r.status === 'fulfilled' && (await r.value).status === 201
  )
  expect(successes).toHaveLength(5)

  const updatedTrip = await prisma.trip.findUnique({ where: { id: trip.id } })
  expect(updatedTrip.spotsBooked).toBe(5)
  expect(updatedTrip.status).toBe('FULL')
})
```

### Manual Test (Quick Verification)

```bash
# Run 10 concurrent booking requests using xargs (macOS/Linux)
seq 10 | xargs -P 10 -I{} curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tripId":"ID","customerName":"Test","customerEmail":"t@t.com","whatsappPhone":"+1787","spotsRequested":1}' \
  http://localhost:3000/api/bookings | jq '.data.id // .error'
```

---

## Monitoring

Phase 1 — log serialization failures:
```ts
if (err?.code === 'P2034') {
  console.warn('[Booking] Serialization failure:', { tripId, requested })
}
```

Phase 2 — structured metrics:
- Counter: `booking.serialization_failure` (indicates high concurrency on a trip)
- Counter: `booking.overbooking_attempt` (prevented by Layer 1 check)
- Alert: any `spots_booked > capacity` in DB (should never trigger)

---

## Acceptance Criteria

- [ ] Integration test passes: 20 concurrent → exactly 5 succeed
- [ ] `spots_booked` never exceeds `capacity` (DB invariant)
- [ ] `P2034` errors return 409, not 500
- [ ] Trip status auto-set to `FULL` when last spot taken
- [ ] Layer 1 check prevents most requests from entering the transaction

## Future Improvements

- Automatic retry (once) on P2034 before returning 409
- Optimistic locking alternative (version column approach)
- Real-time spot count via WebSocket/SSE for landing page

## Related Documents

- [skills/transaction-handling.md](transaction-handling.md)
- [skills/booking-system.md](booking-system.md)
- [docs/12-booking-engine.md](../docs/12-booking-engine.md)
- [docs/24-testing-strategy.md](../docs/24-testing-strategy.md)
