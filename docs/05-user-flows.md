# 05 — User Flows

## Purpose

Map the end-to-end journeys each persona takes through the platform so that every screen, redirect, and error state is intentionally designed.

## Business Goal

Eliminate dead-ends and confusion in the booking and admin flows, maximising conversion and operator efficiency.

---

## Flow 1 — Guest: Discovery to Booking Confirmation

```
[Landing Page]
      │
      ▼
[Browse Trips Section]
      │
      ├── Trip is FULL → CTA disabled, "Sold Out" badge shown
      │
      └── Trip is AVAILABLE
                │
                ▼
         [Trip Detail Page]
                │
                ▼
         [Click "Book Now"]
                │
                ├── NOT authenticated
                │       │
                │       └── [Login / Register Page]
                │               │
                │               ├── Google OAuth → success → redirect back to booking
                │               └── Email/Password → success → redirect back to booking
                │
                └── IS authenticated
                        │
                        ▼
                 [Booking Form Page]
                        │
                        ├── Select spots (1 to max_bookable)
                        ├── Enter/confirm name, WhatsApp number
                        │
                        ▼
                 [Submit Booking]
                        │
                        ├── Validation error → highlight fields, stay on form
                        ├── Trip now full (race condition) → error toast, redirect to listings
                        │
                        └── Success
                                │
                                ├── Booking record created in DB
                                ├── spots_booked incremented (transaction)
                                ├── WhatsApp message dispatched (async)
                                │
                                ▼
                        [Booking Confirmation Screen]
                                │
                                └── CTA: "View more trips" or "Share"
```

---

## Flow 2 — Guest: Authentication

```
[Unauthenticated User hits /book or clicks "Book Now"]
      │
      ▼
[Redirect to /login?returnUrl=/book/[tripId]]
      │
      ├── Option A: "Sign in with Google"
      │       │
      │       └── Firebase Google OAuth popup
      │               │
      │               ├── Success → upsert user in DB → redirect to returnUrl
      │               └── Failure → error message, stay on /login
      │
      ├── Option B: "Sign in with Email"
      │       │
      │       ├── Enter email + password
      │       ├── Success → verify Firebase token → redirect to returnUrl
      │       └── Wrong credentials → "Incorrect email or password" inline error
      │
      └── Option C: "Create Account"
              │
              ├── Enter name, email, password, confirm password
              ├── Firebase creates user
              ├── API call creates user record in DB
              └── Redirect to returnUrl
```

---

## Flow 3 — Admin: Trip Management

```
[Admin navigates to /admin]
      │
      ├── NOT admin role → redirect to / with error toast
      │
      └── IS admin
              │
              ▼
       [Admin Dashboard Home]
              │
              ├── [Create Trip]
              │       │
              │       ├── Fill form: title, description, date, time, capacity, price
              │       ├── Validation → inline errors
              │       └── Success → trip created, redirect to trips list
              │
              ├── [View Trips List]
              │       │
              │       ├── Each row: title, date, capacity, booked, status
              │       ├── [Edit] → pre-filled form, update trip
              │       └── [Cancel] → confirm modal → trip status = CANCELLED
              │
              └── [View Bookings]
                      │
                      ├── Filter by trip (dropdown)
                      ├── Table: guest name, email, WhatsApp, spots, date booked
                      └── [Export CSV] → download file
```

---

## Flow 4 — Admin: Booking Detail View

```
[Admin Dashboard → Trip Row → "View Bookings"]
      │
      ▼
[Bookings Table for Trip]
      │
      ├── Columns: # | Customer Name | Email | WhatsApp | Spots | Status | Booked At
      ├── Sortable by date, spots
      ├── Badge: CONFIRMED / PENDING / CANCELLED
      └── [Export CSV] → triggers API → downloads booking_[tripId]_[date].csv
```

---

## Flow 5 — Error & Edge Cases

| Scenario | UX Response |
|---|---|
| Trip full between page load and submission | Error toast: "Sorry, those spots just filled. Try another date." |
| WhatsApp send failure | Booking still succeeds. Silent retry logged. User sees confirmation screen. |
| Firebase token expired during booking | Redirect to login. Return URL preserved. |
| Admin tries to edit cancelled trip | Fields disabled. Read-only view. |
| Network error on booking submit | Toast: "Something went wrong. Your card was not charged." Retry button shown. |
| User tries to book 0 spots | Selector minimum enforced at 1. Submit button disabled. |
| User tries to book more than max_bookable | Selector capped at max_bookable value. |

---

## Redirect Logic Summary

| Trigger | Destination |
|---|---|
| Unauthenticated → protected route | `/login?returnUrl=[original]` |
| Successful login | `returnUrl` param or `/` |
| Successful booking | `/booking/confirmation/[bookingId]` |
| Non-admin → `/admin` | `/` with error toast |
| Trip cancelled / full on load | Trip detail still renders, CTA disabled |

---

## Related Documents

- [04-user-personas.md](04-user-personas.md)
- [06-site-map.md](06-site-map.md)
- [12-booking-engine.md](12-booking-engine.md)
- [11-authentication.md](11-authentication.md)
