# 14 — Admin Dashboard

## Purpose

Define the admin dashboard interface: every screen, action, data display, and guard that the operator (Sofia) uses to manage Soulfullescape's trip operations.

## Business Goal

Give the operator complete visibility and control over trips and bookings with zero developer dependency for routine operations.

---

## Access Control

- Route prefix: `/admin/*`
- Protected by: `requireAdmin()` middleware on all API routes + `AdminGuard` component on all pages
- Role check: `user.role === 'ADMIN'` from database (not from Firebase claims)
- Non-admin users redirected to `/` with error toast

---

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Soulfullescape Admin          [Sofia V.]  [Sign Out]           │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                   │
│  Navigation  │   Main Content Area                              │
│              │                                                   │
│  Dashboard   │                                                   │
│  Trips       │                                                   │
│  Bookings    │                                                   │
│              │                                                   │
│              │                                                   │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## Screen 1: Dashboard Home `/admin`

### Summary Stats Cards

| Card | Value | Source |
|---|---|---|
| Upcoming Trips | Count of PUBLISHED trips with future date | `trips` table |
| Total Bookings | Count of all CONFIRMED bookings | `bookings` table |
| Spots Filled (This Month) | Sum of `spots_reserved` for current month | `bookings` table |
| Revenue (This Month) | Sum of `total_price` for current month | `bookings` table |

### Recent Activity Table

Last 10 bookings across all trips:
- Guest Name | Trip | Spots | Total | Booked At

### Quick Actions

- [+ Create New Trip] → `/admin/trips/new`
- [View All Bookings] → `/admin/bookings`

---

## Screen 2: Trip List `/admin/trips`

### Table Columns

| Column | Type | Notes |
|---|---|---|
| Title | Text link → edit page | |
| Date | Formatted date | Sorted descending |
| Capacity | Integer | e.g. "20" |
| Booked | Integer | `spots_booked` |
| Available | Integer | `capacity - spots_booked` |
| Status | Badge | DRAFT / PUBLISHED / FULL / CANCELLED |
| Actions | Buttons | [Edit] [Cancel] |

### Filters

- Status filter (All / Published / Draft / Full / Cancelled)
- Date filter (Upcoming / Past / All)

### Empty State

"No trips yet. [Create your first trip →]"

---

## Screen 3: Create Trip `/admin/trips/new`

### Form Fields

| Field | Type | Validation |
|---|---|---|
| Title | Text input | Required, 3–100 chars |
| Description | Textarea | Required, 10–1000 chars |
| Trip Date | Date picker | Required, must be future |
| Start Time | Time input | Required |
| End Time | Time input | Required, must be after start |
| Capacity | Number input | Required, 1–100 |
| Price Per Person | Number input | Required, > 0, 2 decimal places |
| Status | Select | DRAFT (default) or PUBLISHED |

### Behaviour

- On submit: `POST /api/trips`
- Success: redirect to `/admin/trips` with "Trip created" toast
- Error: inline field validation + error toast for API errors

---

## Screen 4: Edit Trip `/admin/trips/[tripId]`

### Form Fields

Same as Create Trip, pre-filled with current values.

### Additional Controls

- **Status toggle**: Admin can change DRAFT → PUBLISHED → (auto-FULL) or manually CANCELLED
- **Spots booked**: Read-only display (cannot be edited manually)
- **[Cancel Trip]** button: opens confirmation modal → sets status to CANCELLED

### Behaviour on Cancel

- Modal: "Are you sure? This will cancel all [N] existing bookings and cannot be undone."
- On confirm: `PATCH /api/trips/[tripId]` with `{ status: 'CANCELLED' }`
- All associated bookings set to `CANCELLED`
- Redirect to `/admin/trips` with "Trip cancelled" toast

---

## Screen 5: All Bookings `/admin/bookings`

### Filters

- Trip filter (dropdown: All Trips or specific trip title)
- Status filter (All / Confirmed / Cancelled)
- Date range (from/to)

### Table Columns

| Column | Notes |
|---|---|
| # | Row number |
| Customer Name | |
| Email | |
| WhatsApp | Formatted with country code |
| Trip | Trip title |
| Trip Date | |
| Spots | |
| Total | Formatted as USD |
| Status | Badge |
| Booked At | Relative time (e.g. "2 days ago") |

### Export

- [Export CSV] button → `GET /api/bookings/export?tripId=[optional]`
- Downloads: `soulfullescape_bookings_YYYY-MM-DD.csv`
- Columns: Name, Email, WhatsApp, Trip, Date, Spots, Total, Status, Booked At

---

## Screen 6: Booking Detail `/admin/bookings/[bookingId]`

- All booking fields
- Associated trip info
- Associated user info (name, email, member since)
- Action: [Cancel Booking] (Phase 1 admin-only)

---

## API Endpoints Used by Admin

| Action | Endpoint | Method |
|---|---|---|
| Dashboard stats | `/api/admin/stats` | GET |
| List trips | `/api/trips` | GET |
| Create trip | `/api/trips` | POST |
| Update trip | `/api/trips/[tripId]` | PATCH |
| Cancel trip | `/api/trips/[tripId]` | PATCH `{status: 'CANCELLED'}` |
| List bookings | `/api/bookings` | GET |
| Booking detail | `/api/bookings/[id]` | GET |
| Export CSV | `/api/bookings/export` | GET |

All requests include `Authorization: Bearer <firebase_id_token>`.

---

## CSV Export Format

```csv
Name,Email,WhatsApp,Trip,Trip Date,Spots,Total (USD),Status,Booked At
Camila Rodriguez,camila@email.com,+17875551234,Lake Day July 19,2025-07-19,4,299.96,CONFIRMED,2025-07-15 09:32
```

---

## Edge Cases

| Scenario | Handling |
|---|---|
| Admin cancels trip with 0 bookings | Allowed, no side effects |
| Admin cancels trip with bookings | All bookings set to CANCELLED; spots_booked stays (no refunds in Phase 1) |
| Admin edits capacity below spots_booked | Validation error: "Capacity cannot be less than spots already booked" |
| Export with 0 matching bookings | Returns CSV with header row only |
| Admin session expires mid-action | API returns 401 → toast "Session expired, please sign in" → redirect to /login |

---

## Acceptance Criteria

- [ ] All admin routes reject non-admin users with redirect + toast
- [ ] Create trip validates all fields before submit
- [ ] Cancel trip requires confirmation modal before proceeding
- [ ] CSV export downloads correctly in browser (Chrome, Safari, Firefox)
- [ ] Dashboard stats update on page refresh (no stale data)
- [ ] Bookings table filters work correctly in combination

## Related Documents

- [17-role-based-access.md](17-role-based-access.md)
- [15-api-design.md](15-api-design.md)
- [skills/admin-dashboard.md](../skills/admin-dashboard.md)
- [skills/csv-export-system.md](../skills/csv-export-system.md)
