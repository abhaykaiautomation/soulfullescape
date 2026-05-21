# Skill: Prisma ORM

## Purpose

Reference guide for using Prisma ORM in the Soulfullescape platform — schema design, query patterns, transactions, and migrations.

## Business Goal

Enable type-safe, maintainable database access with zero raw SQL (except documented exceptions) and reliable migrations.

## Scope

- Prisma schema conventions
- Common query patterns
- Transaction usage
- Migration workflow
- Type generation

---

## Architecture Notes

Prisma ORM sits between the API routes and Neon PostgreSQL. It provides:
1. **Type safety** — all queries return typed objects matching the schema
2. **Migration management** — schema changes tracked as versioned migration files
3. **Query builder** — no SQL strings to inject into

The Prisma client must be a singleton in serverless environments (see `lib/prisma.ts`).

---

## Implementation Details

### Schema Conventions

- Table names: lowercase, plural, snake_case (`@@map("bookings")`)
- Column names: camelCase in schema, snake_case in DB (`@map("spots_booked")`)
- IDs: CUID (`@default(cuid())`) — globally unique, URL-safe, time-sortable
- Timestamps: `@default(now())` and `@updatedAt`
- Enums: PascalCase in Prisma (`TripStatus`), stored as string in DB

### Common Query Patterns

```ts
// Find many with filters
const trips = await prisma.trip.findMany({
  where: {
    status: 'PUBLISHED',
    tripDate: { gte: new Date() },
  },
  orderBy: { tripDate: 'asc' },
  select: {
    id: true,
    title: true,
    spotsBooked: true,
    capacity: true,
    pricePerPerson: true,
    status: true,
    tripDate: true,
    startTime: true,
    endTime: true,
  },
})

// Find unique or throw 404
const trip = await prisma.trip.findUnique({
  where: { id: tripId },
})
if (!trip) throw new ApiError(404, 'Trip not found')

// Create
const booking = await prisma.booking.create({
  data: {
    userId: user.id,
    tripId: trip.id,
    customerName: 'Camila',
    customerEmail: 'camila@email.com',
    whatsappPhone: '+17875551234',
    spotsReserved: 4,
    pricePerPerson: trip.pricePerPerson,
    totalPrice: trip.pricePerPerson.mul(4),
    status: 'CONFIRMED',
  },
  include: { trip: true },
})

// Update (partial — Prisma handles the spread)
await prisma.trip.update({
  where: { id: tripId },
  data: { status: 'FULL', spotsBooked: { increment: 4 } },
})

// Upsert (create or update)
const user = await prisma.user.upsert({
  where: { firebaseUid: decoded.uid },
  update: { name: decoded.name, email: decoded.email },
  create: {
    firebaseUid: decoded.uid,
    name: decoded.name ?? 'Unknown',
    email: decoded.email ?? '',
    role: 'GUEST',
  },
})
```

### Transaction Pattern (Booking Engine)

```ts
const result = await prisma.$transaction(
  async (tx) => {
    const trip = await tx.trip.findUniqueOrThrow({
      where: { id: tripId },
    })

    // Business logic validation inside transaction
    if (trip.status !== 'PUBLISHED') throw new ApiError(409, 'Not available')

    const spotsRemaining = trip.capacity - trip.spotsBooked
    if (requested > spotsRemaining) throw new ApiError(409, 'Not enough spots')

    const booking = await tx.booking.create({ data: { ... } })

    await tx.trip.update({
      where: { id: tripId },
      data: {
        spotsBooked: { increment: requested },
        status: spotsRemaining - requested <= 0 ? 'FULL' : trip.status,
      },
    })

    return booking
  },
  { isolationLevel: 'Serializable' }
)
```

### Decimal Handling

Prisma returns `Decimal` objects for `Decimal(10,2)` columns. Convert for JSON serialisation:

```ts
// Prisma Decimal → number
Number(booking.totalPrice)      // 299.96
booking.totalPrice.toFixed(2)   // "299.96"
booking.totalPrice.mul(4)       // Decimal multiplication

// When serialising for API response, convert in a transform:
const serialized = {
  ...booking,
  pricePerPerson: Number(booking.pricePerPerson),
  totalPrice: Number(booking.totalPrice),
}
```

---

## Folder Structure

```
prisma/
  schema.prisma         Schema definitions, enums, datasource
  seed.ts               Seed script
  migrations/
    YYYYMMDDHHMMSS_name/
      migration.sql     Auto-generated SQL
lib/
  prisma.ts             Singleton client
```

---

## Related Components

- All API route handlers (`app/api/**/*.ts`)
- `lib/api-auth.ts` — user lookup
- `lib/whatsapp.ts` — reads trip data after booking

---

## Database Dependencies

Prisma manages all tables. Any raw SQL access must be documented.

The only permitted raw SQL usage:
```ts
// Table truncation in tests only
await prisma.$executeRaw`TRUNCATE users, trips, bookings CASCADE`
```

---

## Migration Workflow

```bash
# 1. Modify prisma/schema.prisma

# 2. Generate + apply migration (dev)
npx prisma migrate dev --name descriptive_name_here

# 3. Generate Prisma client
npx prisma generate   # (auto-runs after migrate dev)

# 4. In CI/Production:
npx prisma migrate deploy
```

**Never run `migrate dev` in production.** Use `migrate deploy` which applies pending migrations non-destructively.

---

## Edge Cases

| Case | Handling |
|---|---|
| `findUnique` returns null | Always check and throw `ApiError(404, ...)` |
| Decimal arithmetic | Use Prisma's `Decimal` methods (`.mul()`, `.add()`) before converting |
| Transaction rollback | Prisma auto-rolls back on any thrown error inside `$transaction` |
| Prisma P2034 (serialization failure) | Catch at API route level, return 409 |
| Missing `directUrl` in schema | `prisma migrate` fails against pooled connection |

---

## Error Handling

| Prisma Error Code | Meaning | API Response |
|---|---|---|
| `P2002` | Unique constraint violation | 409 (e.g. duplicate email) |
| `P2025` | Record not found | 404 |
| `P2034` | Serialization failure (concurrent conflict) | 409 |
| `P2003` | Foreign key constraint | 400 |
| `P1001` | Can't reach DB | 503 (log and return 500 to client) |

---

## Acceptance Criteria

- [ ] No raw SQL outside of seed/test utilities
- [ ] All writes that span multiple tables use `$transaction()`
- [ ] Prisma client uses singleton pattern (no new PrismaClient per request)
- [ ] Decimal fields handled with `.toFixed(2)` or `Number()` in API responses
- [ ] `directUrl` set in `schema.prisma` for migrations

## Future Improvements

- Soft delete middleware (automatically filter deleted records)
- Query logging to structured log (Phase 2)
- Read-only Prisma client for SSR queries (performance)

## Related Documents

- [docs/10-database-schema.md](../docs/10-database-schema.md)
- [skills/neon-postgres.md](neon-postgres.md)
- [skills/transaction-handling.md](transaction-handling.md)
