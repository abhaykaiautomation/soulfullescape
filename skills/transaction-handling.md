# Skill: Transaction Handling

## Purpose

Guide to implementing Prisma database transactions correctly in the Soulfullescape platform, with a focus on the booking engine's atomicity requirements.

## Business Goal

Guarantee that concurrent booking requests never produce inconsistent database state — no double-bookings, no partial writes.

## Scope

- Prisma `$transaction()` usage
- Isolation levels
- Error handling for transaction failures
- When to use transactions

---

## Architecture Notes

Transactions are used whenever a single logical operation requires multiple database writes that must succeed or fail together. In Soulfullescape, the booking creation is the only transaction-critical operation in Phase 1.

```
Booking transaction:
  ├── SELECT trip (check availability)
  ├── INSERT booking
  └── UPDATE trip.spots_booked

All three must succeed together, or none commit.
```

---

## Implementation Details

### When to Use Transactions

Use `prisma.$transaction()` when:
- Writing to multiple tables in one logical operation (INSERT booking + UPDATE trip)
- Reading a value and writing based on that value (read-modify-write on `spots_booked`)
- Preventing race conditions between concurrent requests

Do NOT use transactions for:
- Single-table writes
- Read-only queries
- Operations that can partially succeed

### Basic Transaction

```ts
const result = await prisma.$transaction([
  prisma.booking.create({ data: { ... } }),
  prisma.trip.update({ where: { id: tripId }, data: { spotsBooked: { increment: 4 } } }),
])
```

This is the **array form** — suitable when operations don't depend on each other's output.

### Interactive Transaction (Booking Engine)

The booking engine needs the **callback form** because we must read the trip before deciding what to write:

```ts
const booking = await prisma.$transaction(
  async (tx) => {
    // 1. Read trip inside the transaction
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
    })

    if (!trip) throw new ApiError(404, 'Trip not found')
    if (trip.status !== 'PUBLISHED') throw new ApiError(409, 'Trip is not available')

    const spotsRemaining = trip.capacity - trip.spotsBooked
    if (requested > spotsRemaining) {
      throw new ApiError(409, `Only ${spotsRemaining} spot(s) remaining`)
    }

    // 2. Write booking
    const newBooking = await tx.booking.create({
      data: { ... },
    })

    // 3. Update trip spots_booked
    const newSpotsBooked = trip.spotsBooked + requested
    await tx.trip.update({
      where: { id: trip.id },
      data: {
        spotsBooked: newSpotsBooked,
        status: newSpotsBooked >= trip.capacity ? 'FULL' : trip.status,
      },
    })

    return newBooking
  },
  {
    isolationLevel: 'Serializable',
    timeout: 10000,   // 10 seconds max (Prisma default is 5s)
  }
)
```

### Isolation Level: Serializable

`Serializable` is the strictest isolation level. It prevents:
- **Dirty reads** — reading uncommitted data from another transaction
- **Non-repeatable reads** — re-reading a row gives a different result
- **Phantom reads** — a query returns different rows on re-execution

For the booking engine, `Serializable` ensures that two concurrent transactions that both read `spots_booked = 10` will NOT both proceed — one will be aborted with a serialization failure.

```ts
{ isolationLevel: 'Serializable' }
```

### Catching Serialization Failures

PostgreSQL returns error code `40001` for serialization failures. Prisma surfaces this as `P2034`:

```ts
try {
  const booking = await prisma.$transaction(async (tx) => { ... }, {
    isolationLevel: 'Serializable',
  })
  return NextResponse.json({ data: booking }, { status: 201 })
} catch (err) {
  if (isPrismaSerializationFailure(err)) {
    return NextResponse.json(
      { error: 'Trip is now full. Please try another date.' },
      { status: 409 }
    )
  }
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  console.error('[POST /api/bookings]', err)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

function isPrismaSerializationFailure(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'P2034'
  )
}
```

### Throwing from Inside a Transaction

Throwing any error inside the transaction callback causes Prisma to automatically roll back all writes:

```ts
async (tx) => {
  const trip = await tx.trip.findUnique(...)

  // This throw triggers rollback — no booking or trip update will persist
  if (trip.status !== 'PUBLISHED') throw new ApiError(409, 'Not available')

  await tx.booking.create(...)
  await tx.trip.update(...)
  // If we reach here, both writes commit atomically
}
```

---

## Folder Structure

```
lib/
  prisma.ts         Prisma client singleton (used in transactions)
app/
  api/
    bookings/
      route.ts      Only place $transaction is currently used
```

---

## Related Components

- `POST /api/bookings` — the only Phase 1 code using `$transaction`
- `lib/prisma.ts` — the Prisma client singleton passed to all transactions

---

## Database Dependencies

- Neon PostgreSQL — supports Serializable isolation
- Neon's pooled endpoint (PgBouncer) supports transactions in session mode

---

## Edge Cases

| Case | Handling |
|---|---|
| Transaction exceeds timeout | Prisma throws; caught and returned as 500 |
| Serialization failure | Caught as `P2034`; returned as 409 |
| ApiError thrown inside transaction | Caught at API route level; returned with original status code |
| Network error inside transaction | Prisma rolls back; connection returned to pool |
| Neon connection pool exhausted | `P1001` error; returned as 500 |

---

## Error Handling

| Error | HTTP Response | Message |
|---|---|---|
| `ApiError(409, ...)` from inside tx | 409 | Custom message (e.g. "Only 2 spots remaining") |
| `ApiError(404, ...)` from inside tx | 404 | "Trip not found" |
| `P2034` (serialization failure) | 409 | "Trip is now full. Please try another date." |
| Timeout | 500 | "Internal server error" |
| Unknown error | 500 | "Internal server error" |

---

## Acceptance Criteria

- [ ] Booking creation uses `$transaction()` with `isolationLevel: 'Serializable'`
- [ ] `P2034` errors caught and returned as 409 (not 500)
- [ ] `ApiError` thrown inside transaction bubbles correctly to API handler
- [ ] WhatsApp send called AFTER transaction exits (not inside)
- [ ] 20 concurrent requests on 5-spot trip → exactly 5 succeed (integration test)

## Future Improvements

- Retry logic for serialization failures (auto-retry once before returning 409)
- Distributed transaction support for multi-service Phase 3 architecture
- Transaction timeout configuration per endpoint

## Related Documents

- [skills/booking-system.md](booking-system.md)
- [skills/overbooking-protection.md](overbooking-protection.md)
- [skills/prisma-orm.md](prisma-orm.md)
- [docs/12-booking-engine.md](../docs/12-booking-engine.md)
