# Skill: Customer Booking Flow

## Purpose

End-to-end guide for the guest-facing booking journey — from landing page to confirmation screen.

## Business Goal

Convert trip discovery into a completed booking in under 3 minutes on a mobile device.

## Scope

- Trip discovery
- Auth gate and redirect
- Booking form UX
- Booking submission
- Confirmation screen

---

## Architecture Notes

The booking flow spans three major phases:
1. **Discovery** — public, server-rendered, SEO-optimised
2. **Authentication gate** — client-side redirect with returnUrl
3. **Booking** — authenticated, client-side, transactional

```
/ (landing page — SSR)
  └── /trips/[tripId] (SSR)
        └── /login?returnUrl=/book/[tripId] (CSR, if not auth'd)
              └── /book/[tripId] (CSR, auth required)
                    └── POST /api/bookings
                          └── /booking/confirmation/[id] (SSR, auth required)
```

---

## Implementation Details

### Trip Detail Page

```tsx
// app/trips/[tripId]/page.tsx
export default async function TripDetailPage({ params }: { params: { tripId: string } }) {
  const trip = await prisma.trip.findUnique({ where: { id: params.tripId } })

  if (!trip || trip.status === 'CANCELLED') notFound()

  const spotsRemaining = trip.capacity - trip.spotsBooked
  const maxBookable = Math.min(10, spotsRemaining)

  return (
    <>
      <TripHeroSection trip={trip} />
      <TripDetailsSection trip={trip} />
      <BookingCTA
        trip={trip}
        spotsRemaining={spotsRemaining}
        maxBookable={maxBookable}
      />
    </>
  )
}
```

### Book Now CTA (Auth Gate)

```tsx
// components/trips/BookingCTA.tsx
'use client'

export function BookingCTA({ trip, spotsRemaining, maxBookable }) {
  const { user } = useAuth()
  const router = useRouter()

  const handleBookNow = () => {
    if (!user) {
      router.push(`/login?returnUrl=/book/${trip.id}`)
    } else {
      router.push(`/book/${trip.id}`)
    }
  }

  if (trip.status === 'FULL') {
    return <Badge variant="error">Sold Out</Badge>
  }

  return (
    <>
      <SpotCountIndicator remaining={spotsRemaining} />
      <Button onClick={handleBookNow} size="lg" fullWidth>
        Book Now — ${Number(trip.pricePerPerson)} per person
      </Button>
    </>
  )
}
```

### Spot Count Indicator

```tsx
// components/trips/SpotCountIndicator.tsx
export function SpotCountIndicator({ remaining }: { remaining: number }) {
  if (remaining <= 0) return <Badge variant="error">Sold Out</Badge>
  if (remaining === 1) return <Badge variant="error" dot>Last spot!</Badge>
  if (remaining <= 5) return <Badge variant="warning" dot>Only {remaining} spots left!</Badge>
  return <Badge variant="success" dot>{remaining} spots available</Badge>
}
```

### Booking Form (Client Component)

Pre-fills name and email from auth context. Guest provides WhatsApp number and spot count.

```tsx
// app/book/[tripId]/page.tsx
'use client'

export default function BookPage({ params }) {
  const { dbUser, firebaseUser } = useAuth()
  const router = useRouter()

  const handleSuccess = (booking: Booking) => {
    router.push(`/booking/confirmation/${booking.id}`)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <TripSummaryCard tripId={params.tripId} />
      <BookingForm
        tripId={params.tripId}
        defaultName={dbUser?.name ?? ''}
        defaultEmail={dbUser?.email ?? ''}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
```

### Confirmation Screen

```tsx
// app/booking/confirmation/[bookingId]/page.tsx
export default async function ConfirmationPage({ params }) {
  // Verify booking belongs to current user (server-side)
  const booking = await getBookingForCurrentUser(params.bookingId)

  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <CheckCircleIcon className="text-green-500 mx-auto mb-4" size={64} />
      <h1>You're in!</h1>
      <p>Get ready to escape, connect, and recharge.</p>
      <BookingDetailCard booking={booking} />
      <p className="text-sm text-gray-500 mt-4">
        We've sent your confirmation to {booking.whatsappPhone} on WhatsApp.
      </p>
      <Button href="/trips" variant="secondary">Browse More Trips</Button>
    </div>
  )
}
```

---

## Folder Structure

```
app/
  page.tsx                    Landing (hero + trip grid)
  trips/
    [tripId]/
      page.tsx                Trip detail
  book/
    [tripId]/
      page.tsx                Booking form (protected)
  booking/
    confirmation/
      [bookingId]/
        page.tsx              Confirmation screen
components/
  trips/
    TripCard.tsx
    BookingCTA.tsx
    SpotCountIndicator.tsx
  booking/
    BookingForm.tsx
    SpotSelector.tsx
    BookingConfirmation.tsx
```

---

## Related Components

- `TripCard` — entry point from trip grid
- `BookingCTA` — CTA button with auth gate
- `SpotCountIndicator` — availability UX
- `BookingForm` — form with validation
- `SpotSelector` — stepper for spot count
- `BookingConfirmation` — success view

---

## Database Dependencies

- `trips` — read for display and validation
- `bookings` — write on submission; read for confirmation
- `users` — read for pre-fill

---

## API Dependencies

- `GET /api/trips/[tripId]` — trip data for form
- `POST /api/bookings` — booking creation
- `GET /api/bookings/[bookingId]` — confirmation data

---

## Edge Cases

| Case | Handling |
|---|---|
| Trip full by the time form is submitted | 409 → error toast → redirect to `/trips` |
| User navigates to `/book/[id]` for cancelled trip | Redirect to `/trips/[id]` with toast |
| User not authenticated | Redirect to `/login?returnUrl=/book/[id]` |
| Confirmation page for another user's booking | Server returns 403 → error page |
| Form submitted twice | Second request may succeed (Phase 1 allows duplicate bookings) |

---

## Acceptance Criteria

- [ ] Full flow completable on mobile in < 3 minutes
- [ ] WhatsApp number pre-validation on blur (not on keystroke)
- [ ] Spot selector enforces 1–maxBookable range
- [ ] Error toast displayed with redirect on overbooking
- [ ] Confirmation screen verifies booking ownership server-side
- [ ] WhatsApp confirmation message visible in test within 10 seconds

## Future Improvements

- Saved WhatsApp number from previous booking
- Apple Pay / Google Pay integration (Phase 2)
- Group booking with multiple guests' names
- "Add to calendar" button on confirmation

## Related Documents

- [skills/booking-system.md](booking-system.md)
- [docs/05-user-flows.md](../docs/05-user-flows.md)
- [docs/12-booking-engine.md](../docs/12-booking-engine.md)
