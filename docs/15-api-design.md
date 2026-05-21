# 15 — API Design

## Purpose

Document every API endpoint: method, path, authentication requirements, request schema, response schema, and error cases.

## Business Goal

Provide a contract between the frontend and backend so both can be developed and tested independently.

## Architecture Notes

- Base URL (production): `https://soulfullescape.com/api`
- Base URL (local): `http://localhost:3000/api`
- All endpoints return `application/json`
- All authenticated endpoints require `Authorization: Bearer <firebase_id_token>` header

---

## Authentication Endpoints

### `POST /api/auth/me`

Upserts the current user in the database after Firebase sign-in.

**Auth:** Required (any authenticated user)

**Request body:** None (user info read from Firebase token)

**Response 200:**
```json
{
  "data": {
    "id": "clxxx...",
    "firebaseUid": "abc123",
    "name": "Camila Rodriguez",
    "email": "camila@email.com",
    "role": "GUEST",
    "createdAt": "2025-07-01T10:00:00Z"
  }
}
```

**Errors:** `401` — invalid token

---

## Trip Endpoints

### `GET /api/trips`

Returns trip list. Public access returns only PUBLISHED trips with future dates. Admin access returns all trips.

**Auth:** Optional (public returns published; authenticated admin returns all)

**Query params:**
- `status` — `PUBLISHED | DRAFT | FULL | CANCELLED | all` (admin only)
- `future` — `true` (default) | `false`

**Response 200:**
```json
{
  "data": [
    {
      "id": "clxxx...",
      "title": "Lake Day — July 19",
      "description": "...",
      "tripDate": "2025-07-19T08:00:00Z",
      "startTime": "8:00 AM",
      "endTime": "5:00 PM",
      "capacity": 20,
      "spotsBooked": 14,
      "spotsRemaining": 6,
      "maxBookable": 6,
      "pricePerPerson": "74.99",
      "status": "PUBLISHED"
    }
  ],
  "count": 1
}
```

Note: `spotsRemaining` and `maxBookable` are computed fields, not stored columns.

---

### `POST /api/trips`

Creates a new trip.

**Auth:** Required — ADMIN only

**Request body:**
```json
{
  "title": "Lake Day — August 2",
  "description": "...",
  "tripDate": "2025-08-02T08:00:00Z",
  "startTime": "8:00 AM",
  "endTime": "5:00 PM",
  "capacity": 20,
  "pricePerPerson": 74.99,
  "status": "DRAFT"
}
```

**Response 201:**
```json
{ "data": { ... trip object ... } }
```

**Errors:** `401` | `403` | `422` (validation)

---

### `GET /api/trips/[tripId]`

Returns single trip detail.

**Auth:** Optional (returns 404 for non-PUBLISHED trips if unauthenticated)

**Response 200:**
```json
{
  "data": {
    "id": "clxxx...",
    "title": "...",
    "spotsRemaining": 6,
    "maxBookable": 6,
    ...
  }
}
```

**Errors:** `404` — trip not found or not published

---

### `PATCH /api/trips/[tripId]`

Updates a trip (partial update).

**Auth:** Required — ADMIN only

**Request body:** Any subset of trip fields, e.g.:
```json
{ "status": "PUBLISHED" }
```
or
```json
{ "capacity": 25, "description": "Updated description" }
```

**Validation:**
- If `capacity` is provided and less than `spotsBooked` → 422

**Response 200:**
```json
{ "data": { ... updated trip ... } }
```

---

### `DELETE /api/trips/[tripId]`

Soft-deletes by setting status to CANCELLED. Also cancels all associated bookings.

**Auth:** Required — ADMIN only

**Response 200:**
```json
{ "data": { "cancelled": true, "bookingsCancelled": 14 } }
```

---

## Booking Endpoints

### `GET /api/bookings`

Returns bookings. Guests see only their own. Admins see all.

**Auth:** Required

**Query params (admin only):**
- `tripId` — filter by trip
- `status` — `CONFIRMED | CANCELLED`
- `from` — ISO date string
- `to` — ISO date string

**Response 200:**
```json
{
  "data": [
    {
      "id": "clyyy...",
      "customerName": "Camila Rodriguez",
      "customerEmail": "camila@email.com",
      "whatsappPhone": "+17875551234",
      "spotsReserved": 4,
      "pricePerPerson": "74.99",
      "totalPrice": "299.96",
      "status": "CONFIRMED",
      "createdAt": "2025-07-15T09:32:00Z",
      "trip": {
        "id": "clxxx...",
        "title": "Lake Day — July 19",
        "tripDate": "2025-07-19T08:00:00Z"
      }
    }
  ],
  "count": 1
}
```

---

### `POST /api/bookings`

Creates a booking (the atomic booking engine call).

**Auth:** Required — any authenticated user

**Request body:**
```json
{
  "tripId": "clxxx...",
  "customerName": "Camila Rodriguez",
  "customerEmail": "camila@email.com",
  "whatsappPhone": "+17875551234",
  "spotsRequested": 4
}
```

**Response 201:**
```json
{
  "data": {
    "id": "clyyy...",
    "tripId": "clxxx...",
    "spotsReserved": 4,
    "totalPrice": "299.96",
    "status": "CONFIRMED"
  }
}
```

**Errors:**
- `401` — not authenticated
- `404` — trip not found
- `409` — trip full, trip not published, trip in past
- `422` — validation error

---

### `GET /api/bookings/[bookingId]`

Returns booking detail.

**Auth:** Required — own booking (guest) or any booking (admin)

**Response 200:** Full booking object with trip and user relations.

**Errors:** `403` — guest accessing another user's booking

---

### `GET /api/bookings/export`

Downloads bookings as CSV file.

**Auth:** Required — ADMIN only

**Query params:**
- `tripId` — filter by trip (optional)

**Response:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="soulfullescape_bookings_2025-07-19.csv"
```

---

## Admin Stats Endpoint

### `GET /api/admin/stats`

Returns summary statistics for the admin dashboard.

**Auth:** Required — ADMIN only

**Response 200:**
```json
{
  "data": {
    "upcomingTrips": 3,
    "totalConfirmedBookings": 47,
    "spotsFilledThisMonth": 32,
    "revenueThisMonth": 2399.68
  }
}
```

---

## Error Response Format

All errors return:
```json
{ "error": "Human-readable error message" }
```

With appropriate HTTP status code (401, 403, 404, 409, 422, 500).

---

## Rate Limiting

| Endpoint | Limit |
|---|---|
| `POST /api/bookings` | 10 requests/minute per IP |
| All other endpoints | 100 requests/minute per IP |

---

## Computed Fields

These fields are calculated in the API response, not stored in the database:

| Field | Formula |
|---|---|
| `spotsRemaining` | `capacity - spotsBooked` |
| `maxBookable` | `Math.min(10, spotsRemaining)` |

---

## Acceptance Criteria

- [ ] All endpoints return correct HTTP status codes
- [ ] All endpoints validate auth before processing
- [ ] `GET /api/trips` without auth returns only PUBLISHED future trips
- [ ] `POST /api/bookings` uses serializable transaction
- [ ] `GET /api/bookings/export` returns valid CSV
- [ ] Computed fields present on all trip responses

## Related Documents

- [09-backend-architecture.md](09-backend-architecture.md)
- [12-booking-engine.md](12-booking-engine.md)
- [16-security-rules.md](16-security-rules.md)
- [17-role-based-access.md](17-role-based-access.md)
