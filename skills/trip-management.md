# Skill: Trip Management

## Purpose

Complete reference for the trip CRUD system — how trips are created, edited, published, cancelled, and queried.

## Business Goal

Enable the operator to manage the trip calendar entirely from the admin dashboard with no developer involvement.

## Scope

- Trip data model
- Create / edit / cancel API
- Status lifecycle
- Trip listing for public and admin views
- Spot count computation

---

## Architecture Notes

Trips are the central entity in the platform. Bookings reference trips, and the spot count on each trip determines availability. The `status` field drives what guests see and whether booking is allowed.

```
Trip States:
  DRAFT → PUBLISHED → FULL (auto)
                    ↘ CANCELLED (admin action)
```

---

## Implementation Details

### Trip Status Transitions

| From | To | Trigger |
|---|---|---|
| `DRAFT` | `PUBLISHED` | Admin sets status in edit form |
| `PUBLISHED` | `FULL` | Auto: `spots_booked >= capacity` (in booking transaction) |
| `PUBLISHED` | `CANCELLED` | Admin cancels |
| `FULL` | `CANCELLED` | Admin cancels |
| `DRAFT` | `CANCELLED` | Admin cancels (clean-up) |
| `CANCELLED` | any | Not allowed — terminal state |

### Create Trip

```ts
// app/api/trips/route.ts — POST
export async function POST(request: Request) {
  const { user } = await requireAdmin(request)
  const body = await request.json()
  const data = tripSchema.parse(body)

  const trip = await prisma.trip.create({
    data: {
      title: data.title,
      description: data.description,
      tripDate: new Date(data.tripDate),
      startTime: data.startTime,
      endTime: data.endTime,
      capacity: data.capacity,
      pricePerPerson: data.pricePerPerson,
      status: data.status,
      spotsBooked: 0,
    },
  })

  return NextResponse.json({ data: trip }, { status: 201 })
}
```

### Computed Fields on Trip Response

```ts
function computeTripFields(trip: Trip) {
  const spotsRemaining = trip.capacity - trip.spotsBooked
  return {
    ...trip,
    spotsRemaining,
    maxBookable: Math.min(10, spotsRemaining),
    pricePerPerson: Number(trip.pricePerPerson),
  }
}
```

Always apply this transform before returning trips from the API.

### Public Trip Listing (Guest View)

```ts
// GET /api/trips — no auth required for public view
const trips = await prisma.trip.findMany({
  where: {
    status: 'PUBLISHED',
    tripDate: { gte: new Date() },
  },
  orderBy: { tripDate: 'asc' },
  select: { /* specific fields only */ },
})
```

### Admin Trip Listing

```ts
// GET /api/trips?status=all — admin view returns all
if (user.role === 'ADMIN') {
  // Return all trips regardless of status/date
}
```

---

## Folder Structure

```
app/
  api/
    trips/
      route.ts              GET list, POST create
      [tripId]/
        route.ts            GET detail, PATCH update, DELETE cancel
components/
  trips/
    TripCard.tsx
    TripGrid.tsx
    TripStatusBadge.tsx
  admin/
    TripTable.tsx
    TripForm.tsx
lib/
  schemas/
    trip.schema.ts
```

---

## Related Components

- `TripCard` — guest-facing card with availability indicator
- `TripGrid` — responsive grid of TripCards
- `TripForm` — admin create/edit form
- `TripTable` — admin list with actions
- `TripStatusBadge` — colour-coded status pill

---

## Database Dependencies

- `trips` table (primary)
- `bookings` table (count via relation when computing booked count)

---

## API Dependencies

None external — all data from Neon via Prisma.

---

## Edge Cases

| Case | Handling |
|---|---|
| Edit capacity below spotsBooked | 422: "Capacity cannot be less than X booked spots" |
| Cancel trip with bookings | All bookings → CANCELLED status (no spot re-release in Phase 1) |
| Publish trip with past date | Allow (operator may be testing) — no restriction on publish |
| Trip date in past | Still shows in admin; excluded from public listing |
| Concurrent trip creation | No race condition (no capacity dependency on create) |

---

## Error Handling

| Scenario | Response |
|---|---|
| Missing required field | 422 with Zod error message |
| Trip not found (PATCH/DELETE) | 404 |
| Edit capacity below booked | 422 |
| Non-admin create/update | 403 |

---

## Acceptance Criteria

- [ ] `spotsRemaining` and `maxBookable` computed on every trip API response
- [ ] Public listing excludes DRAFT, CANCELLED, and past trips
- [ ] Admin listing includes all trips
- [ ] Capacity edit validated against spotsBooked
- [ ] Cancel sets all associated bookings to CANCELLED
- [ ] Trip auto-marked FULL in booking transaction (see booking-system.md)

## Future Improvements

- Trip slug (human-readable URL)
- Trip images (media upload)
- Recurring trip templates
- Trip duplication / clone
- Trip visibility schedule (publish at a specific time)

## Related Documents

- [docs/10-database-schema.md](../docs/10-database-schema.md)
- [skills/booking-system.md](booking-system.md)
- [docs/14-admin-dashboard.md](../docs/14-admin-dashboard.md)
