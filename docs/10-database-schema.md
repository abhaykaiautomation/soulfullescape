# 10 — Database Schema

## Purpose

Define every table, column, constraint, index, and relationship in the Neon PostgreSQL database.

## Business Goal

Ensure data integrity, query performance, and zero ambiguity about what the database stores.

## Architecture Notes

- Database: Neon PostgreSQL (serverless)
- ORM: Prisma ORM
- Connection: Pooled endpoint for runtime (PgBouncer), direct endpoint for migrations
- Migrations: Managed via `prisma migrate dev` / `prisma migrate deploy`

---

## Entity Relationship Diagram

```
users ─────────────────────── bookings
  │ id (PK)                      │ id (PK)
  │ firebase_uid (UNIQUE)         │ user_id (FK → users.id)
  │ name                          │ trip_id (FK → trips.id)
  │ email (UNIQUE)                │ customer_name
  │ phone                         │ customer_email
  │ role                          │ whatsapp_phone
  │ created_at                    │ spots_reserved
  │ updated_at                    │ price_per_person
                                  │ total_price
trips ─────────────────────────   │ status
  │ id (PK)                  │    │ created_at
  │ title                    │    │ updated_at
  │ description              │
  │ trip_date                └────┘
  │ start_time
  │ end_time
  │ capacity
  │ spots_booked
  │ price_per_person
  │ status
  │ created_at
  │ updated_at
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  GUEST
  ADMIN
}

enum TripStatus {
  DRAFT
  PUBLISHED
  FULL
  CANCELLED
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
}

model User {
  id          String    @id @default(cuid())
  firebaseUid String    @unique @map("firebase_uid")
  name        String
  email       String    @unique
  phone       String?
  role        UserRole  @default(GUEST)
  bookings    Booking[]
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@map("users")
}

model Trip {
  id             String      @id @default(cuid())
  title          String
  description    String
  tripDate       DateTime    @map("trip_date")
  startTime      String      @map("start_time")
  endTime        String      @map("end_time")
  capacity       Int
  spotsBooked    Int         @default(0) @map("spots_booked")
  pricePerPerson Decimal     @map("price_per_person") @db.Decimal(10, 2)
  status         TripStatus  @default(DRAFT)
  bookings       Booking[]
  createdAt      DateTime    @default(now()) @map("created_at")
  updatedAt      DateTime    @updatedAt @map("updated_at")

  @@index([tripDate])
  @@index([status])
  @@map("trips")
}

model Booking {
  id             String        @id @default(cuid())
  userId         String        @map("user_id")
  tripId         String        @map("trip_id")
  customerName   String        @map("customer_name")
  customerEmail  String        @map("customer_email")
  whatsappPhone  String        @map("whatsapp_phone")
  spotsReserved  Int           @map("spots_reserved")
  pricePerPerson Decimal       @map("price_per_person") @db.Decimal(10, 2)
  totalPrice     Decimal       @map("total_price") @db.Decimal(10, 2)
  status         BookingStatus @default(CONFIRMED)
  user           User          @relation(fields: [userId], references: [id])
  trip           Trip          @relation(fields: [tripId], references: [id])
  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")

  @@index([userId])
  @@index([tripId])
  @@index([createdAt])
  @@map("bookings")
}
```

---

## Table Definitions

### `users`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `TEXT` | PK, CUID | Internal identifier |
| `firebase_uid` | `TEXT` | UNIQUE, NOT NULL | Firebase UID for auth mapping |
| `name` | `TEXT` | NOT NULL | Display name from Firebase profile |
| `email` | `TEXT` | UNIQUE, NOT NULL | Synced from Firebase |
| `phone` | `TEXT` | NULLABLE | Optional, may be updated by user |
| `role` | `ENUM` | NOT NULL, DEFAULT `GUEST` | `GUEST` or `ADMIN` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, auto-updated | |

### `trips`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `TEXT` | PK, CUID | |
| `title` | `TEXT` | NOT NULL | |
| `description` | `TEXT` | NOT NULL | |
| `trip_date` | `TIMESTAMPTZ` | NOT NULL | Full datetime for timezone handling |
| `start_time` | `TEXT` | NOT NULL | Display string e.g. "8:00 AM" |
| `end_time` | `TEXT` | NOT NULL | Display string e.g. "5:00 PM" |
| `capacity` | `INTEGER` | NOT NULL, > 0 | Total available spots |
| `spots_booked` | `INTEGER` | NOT NULL, DEFAULT 0 | Atomically incremented |
| `price_per_person` | `DECIMAL(10,2)` | NOT NULL | USD amount |
| `status` | `ENUM` | NOT NULL, DEFAULT `DRAFT` | `DRAFT`, `PUBLISHED`, `FULL`, `CANCELLED` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, auto-updated | |

### `bookings`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `TEXT` | PK, CUID | |
| `user_id` | `TEXT` | FK → `users.id`, NOT NULL | |
| `trip_id` | `TEXT` | FK → `trips.id`, NOT NULL | |
| `customer_name` | `TEXT` | NOT NULL | May differ from user.name (group lead) |
| `customer_email` | `TEXT` | NOT NULL | Snapshot at booking time |
| `whatsapp_phone` | `TEXT` | NOT NULL | For WhatsApp notification |
| `spots_reserved` | `INTEGER` | NOT NULL, 1–10 | |
| `price_per_person` | `DECIMAL(10,2)` | NOT NULL | Snapshot at booking time |
| `total_price` | `DECIMAL(10,2)` | NOT NULL | `spots_reserved × price_per_person` |
| `status` | `ENUM` | NOT NULL, DEFAULT `CONFIRMED` | `PENDING`, `CONFIRMED`, `CANCELLED` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, auto-updated | |

---

## Indexes

| Table | Index | Type | Reason |
|---|---|---|---|
| `users` | `firebase_uid` | UNIQUE | Auth lookup on every request |
| `users` | `email` | UNIQUE | Login lookup |
| `trips` | `trip_date` | BTREE | Sort/filter upcoming trips |
| `trips` | `status` | BTREE | Filter by status |
| `bookings` | `user_id` | BTREE | Guest booking history |
| `bookings` | `trip_id` | BTREE | Admin view per trip |
| `bookings` | `created_at` | BTREE | Sort by booking date |

---

## Atomicity: The Booking Transaction

The critical write path uses a serializable transaction:

```sql
BEGIN;
  -- 1. Lock the trip row
  SELECT id, capacity, spots_booked, status
  FROM trips
  WHERE id = $tripId
  FOR UPDATE;

  -- 2. Guard: check availability
  -- Application layer throws if spots_booked + requested > capacity
  -- Application layer throws if status != 'PUBLISHED'

  -- 3. Insert booking
  INSERT INTO bookings (...) VALUES (...);

  -- 4. Increment spots_booked
  UPDATE trips
  SET spots_booked = spots_booked + $requested,
      status = CASE
        WHEN spots_booked + $requested >= capacity THEN 'FULL'
        ELSE status
      END
  WHERE id = $tripId;

COMMIT;
```

Prisma implementation uses `prisma.$transaction()` with `isolationLevel: Serializable`.

---

## Seed Data (Development)

```ts
// prisma/seed.ts
// Creates: 2 admin users, 3 upcoming trips, 5 bookings
```

Run with: `npx prisma db seed`

---

## Migration Strategy

| Command | When |
|---|---|
| `npx prisma migrate dev --name <name>` | Local development |
| `npx prisma migrate deploy` | CI/CD on merge to main |
| `npx prisma studio` | Visual inspection during dev |
| `npx prisma generate` | After schema changes (generates client) |

---

## Edge Cases

- `spots_booked` can never exceed `capacity` (enforced by transaction logic)
- Price columns snapshot the price at booking time — trip price changes do not affect existing bookings
- `firebase_uid` is never null; it is the key linking Firebase Auth to the DB user
- Deleting a user cascades: bookings are soft-deleted (status = CANCELLED), not hard-deleted

## Related Documents

- [09-backend-architecture.md](09-backend-architecture.md)
- [12-booking-engine.md](12-booking-engine.md)
- [skills/neon-postgres.md](../skills/neon-postgres.md)
- [skills/prisma-orm.md](../skills/prisma-orm.md)
