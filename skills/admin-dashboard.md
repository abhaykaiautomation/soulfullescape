# Skill: Admin Dashboard

## Purpose

Knowledge required to implement and maintain the Soulfullescape admin dashboard — the operator's interface for managing trips, viewing bookings, and exporting data.

## Business Goal

Give the operator complete, intuitive control of the platform without requiring developer intervention for routine operations.

## Scope

- Admin route protection
- Trip CRUD operations
- Booking list and detail views
- Dashboard summary stats
- CSV export

---

## Architecture Notes

The admin dashboard is a protected area under `/admin/*`. All pages are Client Components (auth-gated) that fetch data from admin API endpoints. All API endpoints call `requireAdmin()` — a server-side role check against the database.

Client → `AdminGuard` (checks role) → Admin page → Admin API (`requireAdmin()`) → Prisma → Neon

---

## Implementation Details

### Admin Layout Guard

```tsx
// app/admin/layout.tsx
import { AdminGuard } from '@/components/auth/AdminGuard'
import { AdminSidebar } from '@/components/layout/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </AdminGuard>
  )
}
```

### Trip Create/Edit Form

Key validations:
- `tripDate` must be a future date
- `capacity` must be ≥ `spotsBooked` (edit only)
- `pricePerPerson` must be > 0 with max 2 decimal places

```tsx
// components/admin/TripForm.tsx
const tripForm = useForm<TripInput>({
  resolver: zodResolver(tripSchema),
  defaultValues: mode === 'edit' ? existingTrip : { status: 'DRAFT', capacity: 20 },
})
```

### Confirm Before Cancel

```tsx
// In TripTable row actions:
const [cancelTarget, setCancelTarget] = useState<Trip | null>(null)

<ConfirmDialog
  open={!!cancelTarget}
  onClose={() => setCancelTarget(null)}
  onConfirm={() => handleCancelTrip(cancelTarget!.id)}
  title="Cancel this trip?"
  description={`This will cancel ${cancelTarget?.spotsBooked} existing booking(s). This cannot be undone.`}
  variant="danger"
/>
```

### Dashboard Stats Fetch

```ts
// app/api/admin/stats/route.ts
export async function GET(request: Request) {
  await requireAdmin(request)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [upcomingTrips, totalBookings, monthlyBookings] = await Promise.all([
    prisma.trip.count({
      where: { status: 'PUBLISHED', tripDate: { gte: now } },
    }),
    prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    prisma.booking.aggregate({
      where: { status: 'CONFIRMED', createdAt: { gte: startOfMonth } },
      _sum: { totalPrice: true, spotsReserved: true },
    }),
  ])

  return NextResponse.json({
    data: {
      upcomingTrips,
      totalBookings,
      spotsFilledThisMonth: monthlyBookings._sum.spotsReserved ?? 0,
      revenueThisMonth: Number(monthlyBookings._sum.totalPrice ?? 0),
    },
  })
}
```

---

## Folder Structure

```
app/
  admin/
    layout.tsx              AdminGuard + sidebar layout
    page.tsx                Dashboard stats
    trips/
      page.tsx              Trip list table
      new/
        page.tsx            Create trip form
      [tripId]/
        page.tsx            Edit trip form
    bookings/
      page.tsx              All bookings table
      [bookingId]/
        page.tsx            Booking detail
components/
  admin/
    TripTable.tsx
    TripForm.tsx
    BookingTable.tsx
    DashboardStats.tsx
    BookingDetail.tsx
  auth/
    AdminGuard.tsx
```

---

## Related Components

- `AdminGuard` — redirects non-admins
- `TripForm` — shared between create and edit
- `TripTable` — sortable, filterable trip list
- `BookingTable` — filterable booking list with export
- `DashboardStats` — 4-card summary grid
- `ConfirmDialog` — used for trip cancellation confirmation

---

## Database Dependencies

All read/write through Prisma:
- `trips` — CRUD
- `bookings` — read, filter, cancel
- `users` — read for booking detail

---

## API Dependencies

| Action | Endpoint |
|---|---|
| Dashboard stats | `GET /api/admin/stats` |
| Trip list | `GET /api/trips?status=all` |
| Create trip | `POST /api/trips` |
| Edit trip | `PATCH /api/trips/[tripId]` |
| Cancel trip | `PATCH /api/trips/[tripId]` `{status: CANCELLED}` |
| Booking list | `GET /api/bookings?tripId=...` |
| Export CSV | `GET /api/bookings/export?tripId=...` |

---

## Edge Cases

| Case | Handling |
|---|---|
| Reduce capacity below spots_booked | Validation error in API and form |
| Cancel trip with 0 bookings | Allowed — no side effects |
| Edit cancelled trip | Fields disabled, read-only display |
| Session expires mid-action | 401 → toast + redirect to login |

---

## Error Handling

| Scenario | UI Response |
|---|---|
| Trip creation fails (validation) | Inline field errors |
| Trip creation fails (API) | Error toast |
| Cancel trip confirm → success | Success toast + remove from list |
| Stats load fails | Skeleton remains + subtle error indicator |

---

## Acceptance Criteria

- [ ] All admin routes inaccessible to non-admin users
- [ ] Trip form validates all fields before submit
- [ ] Cancel requires confirmation modal
- [ ] Dashboard stats cards load independently (no full-page blocking)
- [ ] CSV export works in Chrome and Safari
- [ ] Editing a trip does not allow capacity < spots_booked

## Future Improvements

- Bulk cancel trips
- Trip duplication (clone upcoming trip)
- Admin activity audit log
- Booking count badge on trip list rows

## Related Documents

- [docs/14-admin-dashboard.md](../docs/14-admin-dashboard.md)
- [skills/csv-export-system.md](csv-export-system.md)
- [skills/protected-routes.md](protected-routes.md)
- [docs/17-role-based-access.md](../docs/17-role-based-access.md)
