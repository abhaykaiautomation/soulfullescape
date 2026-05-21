# 22 — Loading States

## Purpose

Define how the application communicates loading progress to users at every stage of data fetching, form submission, and navigation.

## Business Goal

Eliminate uncertainty — users should always know whether the system is working, especially during the booking submission which involves a financial commitment.

---

## Loading State Types

| Type | When | Component |
|---|---|---|
| Page load | Initial data fetch | Skeleton screens |
| Navigation | Next.js page transition | Top progress bar |
| Form submission | API call in progress | Button spinner + disabled state |
| Auth check | Firebase resolving | Full-page spinner |
| Inline action | Small async action | Inline spinner |
| Background refetch | Stale data updating | Subtle indicator |

---

## Skeleton Screens

Used for data-heavy components during initial load. Skeleton replaces the component with an animated placeholder that matches the layout.

### `TripCardSkeleton`

```tsx
export function TripCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-6 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-10 bg-gray-200 rounded-full mt-4" />
      </div>
    </div>
  )
}
```

### Usage with `TripGrid`

```tsx
export function TripGrid({ trips, loading }: TripGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <TripCardSkeleton key={i} />
        ))}
      </div>
    )
  }
  // render real cards
}
```

---

## Page-Level Skeleton (Next.js Suspense)

```tsx
// app/trips/loading.tsx
import { TripCardSkeleton } from '@/components/trips/TripCard'

export default function TripsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="h-8 bg-gray-200 rounded w-48 mb-8 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => <TripCardSkeleton key={i} />)}
      </div>
    </div>
  )
}
```

---

## Form Submission Loading

### Button States

```tsx
<Button
  type="submit"
  loading={isSubmitting}
  disabled={isSubmitting || !isValid}
>
  {isSubmitting ? 'Reserving your spots...' : 'Reserve Spots'}
</Button>
```

### Full Form Lock

During submission, the entire form is visually locked to prevent duplicate submissions:

```tsx
<fieldset disabled={isSubmitting} className="space-y-4">
  {/* all inputs here */}
</fieldset>
```

The `disabled` attribute on `fieldset` propagates to all child inputs.

---

## Auth Loading State

```tsx
// components/auth/AuthGuard.tsx
const { loading } = useAuth()

if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size="lg" label="Checking your session..." />
    </div>
  )
}
```

This prevents the admin dashboard from flashing to non-admin users before the auth check resolves.

---

## Navigation Progress Bar

Install `nprogress` (or use Next.js App Router's built-in transition support):

```tsx
// components/layout/NavigationProgress.tsx
'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import NProgress from 'nprogress'

export function NavigationProgress() {
  const pathname = usePathname()

  useEffect(() => {
    NProgress.done()
    return () => { NProgress.start() }
  }, [pathname])

  return null
}
```

Styled to use teal colour matching the brand.

---

## Inline Action Loading

For table row actions (e.g. cancel trip button in admin):

```tsx
const [cancellingId, setCancellingId] = useState<string | null>(null)

const handleCancel = async (tripId: string) => {
  setCancellingId(tripId)
  try {
    await cancelTrip(tripId)
    toast('Trip cancelled', 'success')
  } finally {
    setCancellingId(null)
  }
}

// In table row:
<Button
  variant="danger"
  size="sm"
  loading={cancellingId === trip.id}
  onClick={() => handleCancel(trip.id)}
>
  Cancel
</Button>
```

---

## Stat Card Skeleton

```tsx
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-16" />
    </div>
  )
}
```

---

## Loading State Rules

1. **Always show loading state** — never leave the UI blank while fetching
2. **Disable submit on submit** — prevent double-click bookings
3. **Skeleton matches layout** — skeleton dimensions mirror the real component
4. **Auth loading blocks rendering** — never render protected content before auth resolves
5. **Loading labels are descriptive** — `"Reserving your spots..."` not just a spinner

---

## Acceptance Criteria

- [ ] Trip listing shows skeleton grid during initial fetch
- [ ] Booking form button shows spinner and "Reserving..." text during submission
- [ ] All form inputs disabled during submission
- [ ] Admin dashboard stats show skeleton until data loads
- [ ] No content flash before auth check resolves on protected pages
- [ ] `loading.tsx` files present for all major route segments

## Related Documents

- [19-component-library.md](19-component-library.md)
- [21-error-handling.md](21-error-handling.md)
- [08-frontend-architecture.md](08-frontend-architecture.md)
