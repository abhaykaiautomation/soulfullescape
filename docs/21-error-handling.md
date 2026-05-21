# 21 — Error Handling

## Purpose

Define how errors are caught, communicated, and recovered from at every layer of the application.

## Business Goal

Ensure the user always knows what happened and what to do next — errors should never silently fail or leave the user stranded.

---

## Error Handling Philosophy

1. **Surface errors early** — catch them at the source, not silently
2. **User-friendly messages** — no stack traces or `[object Object]` in the UI
3. **Actionable** — every error message implies a next step
4. **Non-destructive** — errors never cause data loss (booking either commits fully or doesn't)
5. **Log, don't expose** — detailed errors logged server-side; generic message to client on 500s

---

## Error Layers

### Layer 1: Form Validation (Client)

Errors caught by Zod + React Hook Form before any API call.

```tsx
// Inline under each field
{errors.whatsappPhone && (
  <p className="text-sm text-red-600 mt-1">
    {errors.whatsappPhone.message}
  </p>
)}
```

User experience: Immediate feedback on field blur and submit attempt.

---

### Layer 2: API Client Errors (Client)

```ts
// lib/api.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
  }
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(res.status, body.error ?? 'Something went wrong')
  }

  return res.json()
}
```

---

### Layer 3: Component Error Handling

```tsx
// In components that make API calls:
const { toast } = useToast()

const handleSubmit = async (data: FormData) => {
  try {
    const booking = await createBooking(data)
    router.push(`/booking/confirmation/${booking.id}`)
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 409) {
        toast(err.message, 'error')  // e.g. "Only 2 spots remaining"
        router.push('/trips')        // redirect back to listings
      } else if (err.status === 401) {
        toast('Please sign in to book', 'error')
        router.push(`/login?returnUrl=${pathname}`)
      } else {
        toast(err.message || 'Something went wrong. Please try again.', 'error')
      }
    } else {
      toast('Network error. Please check your connection.', 'error')
    }
  }
}
```

---

### Layer 4: API Route Error Handling

```ts
// app/api/bookings/route.ts
export async function POST(request: Request) {
  try {
    // ... business logic
    return NextResponse.json({ data: booking }, { status: 201 })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }

    // Prisma serialization failure
    if (isPrismaConflict(err)) {
      return NextResponse.json(
        { error: 'Trip is now full. Please try another date.' },
        { status: 409 }
      )
    }

    // Unexpected errors
    console.error('[POST /api/bookings]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function isPrismaConflict(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'P2034' // Prisma serialization failure
  )
}
```

---

### Layer 5: Next.js Error Boundaries

```tsx
// app/error.tsx — catches runtime errors in the render tree
'use client'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

```tsx
// app/not-found.tsx — custom 404 page
export default function NotFound() {
  return (
    <div>
      <h1>Page not found</h1>
      <Link href="/">Back to home</Link>
    </div>
  )
}
```

Segment-level error boundaries in `app/admin/error.tsx` and `app/book/error.tsx` provide granular recovery.

---

## Error Message Guidelines

| Scenario | User-Facing Message |
|---|---|
| Trip is full | "Those spots just filled up. Try a different date." |
| Trip cancelled | "This trip is no longer available." |
| Trip in the past | "This trip has already taken place." |
| Auth expired | "Your session expired. Please sign in again." |
| Network failure | "Connection error. Check your internet and try again." |
| Unknown server error | "Something went wrong on our end. Please try again." |
| Validation error | Field-specific message (e.g. "Enter a valid WhatsApp number with country code") |
| Admin: capacity below booked | "Capacity cannot be reduced below the number of spots already booked (X)." |

---

## WhatsApp Error Handling (Special Case)

WhatsApp send errors must **never** propagate to the HTTP response:

```ts
// In API route, after booking committed:
sendWhatsAppConfirmation(payload).catch((err) => {
  console.error('[WhatsApp][Booking %s] Failed:', booking.id, err.message)
  // Do NOT rethrow — booking is already committed
})
```

---

## Logging Standard

```ts
// Format for server error logs (Phase 1 — console):
console.error('[RouteIdentifier][Context]', {
  userId: user?.id,
  bookingId: booking?.id,
  error: err.message,
  // Never log: tokens, passwords, raw phone numbers in production
})
```

Phase 2: replace `console.error` with structured logger (Pino) + Sentry integration.

---

## Acceptance Criteria

- [ ] No unhandled promise rejections in the browser console
- [ ] All API errors display a user-friendly toast, not a technical message
- [ ] `error.tsx` boundary prevents full-page crash for any segment
- [ ] WhatsApp errors never cause booking endpoint to return error
- [ ] Prisma serialization failures return 409 (not 500)
- [ ] Form validation errors appear inline, not as toasts

## Related Documents

- [12-booking-engine.md](12-booking-engine.md)
- [20-state-management.md](20-state-management.md)
- [22-loading-states.md](22-loading-states.md)
- [09-backend-architecture.md](09-backend-architecture.md)
