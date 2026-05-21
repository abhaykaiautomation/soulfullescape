# 20 — State Management

## Purpose

Define how application state is managed across the Soulfullescape platform — where data lives, how it flows, and what tools manage it.

## Business Goal

Keep state management simple and predictable. Avoid over-engineering for Phase 1 scale.

---

## State Categories

| Category | Tool | Location |
|---|---|---|
| Auth state (Firebase user + DB role) | React Context | `AuthContext` |
| Toast / notification state | React Context | `ToastContext` |
| Form state | React Hook Form | Component-local |
| Server data (trips, bookings) | Server Components + fetch | Server / API |
| Modal open/close state | `useState` | Component-local |
| Loading states | `useState` | Component-local |

**No global state library** (Redux, Zustand, Jotai) in Phase 1. Complexity is not justified.

---

## Auth Context

```tsx
// context/AuthContext.tsx
'use client'

interface AuthContextValue {
  firebaseUser: FirebaseUser | null   // Firebase SDK user
  dbUser: DbUser | null               // DB user (includes role)
  loading: boolean                    // true until Firebase resolves
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [dbUser, setDbUser] = useState<DbUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)
      if (fbUser) {
        // Get fresh token and sync user to DB
        const token = await fbUser.getIdToken()
        const res = await fetch('/api/auth/me', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        const { data } = await res.json()
        setDbUser(data)
      } else {
        setDbUser(null)
      }
      setLoading(false)
    })
  }, [])

  const signOut = async () => {
    await firebaseSignOut(auth)
    setDbUser(null)
  }

  return (
    <AuthContext.Provider value={{ firebaseUser, dbUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
```

---

## Toast Context

```tsx
// context/ToastContext.tsx
'use client'

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
```

Usage:
```tsx
const { toast } = useToast()

// In a component or hook:
toast('Booking confirmed!', 'success')
toast('Trip is now full', 'error')
```

---

## Server Data Pattern (Next.js App Router)

For Server Components, data is fetched directly:

```tsx
// app/trips/page.tsx (Server Component)
export default async function TripsPage() {
  const trips = await prisma.trip.findMany({
    where: { status: 'PUBLISHED', tripDate: { gte: new Date() } },
    orderBy: { tripDate: 'asc' },
  })

  return <TripGrid trips={trips} />
}
```

For Client Components that need fresh data, use a custom hook with `useEffect`:

```tsx
// hooks/useTrips.ts
export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/trips')
      .then(res => res.json())
      .then(({ data }) => setTrips(data))
      .catch(() => setError('Failed to load trips'))
      .finally(() => setLoading(false))
  }, [])

  return { trips, loading, error }
}
```

---

## Form State (React Hook Form)

```tsx
// Booking form example
const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
  setValue,
  watch,
} = useForm<BookingFormData>({
  resolver: zodResolver(bookingSchema),
  defaultValues: {
    customerName: dbUser?.name ?? '',
    customerEmail: dbUser?.email ?? '',
    spotsRequested: 1,
  },
})
```

- Form state stays inside the form component
- Validation errors are field-level, not global
- `isSubmitting` drives button disabled state

---

## Local Component State

For UI-only state (modal open, accordion expanded, tab selected):

```tsx
const [isModalOpen, setIsModalOpen] = useState(false)
const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
```

No need to lift this to context. Keep it collocated with the component.

---

## Data Fetching Hooks

| Hook | Purpose |
|---|---|
| `useAuth()` | Firebase user + DB user + role |
| `useTrips()` | Public trip listing |
| `useTrip(tripId)` | Single trip detail |
| `useBookings()` | Current user's bookings (guest) or all bookings (admin) |
| `useAdminStats()` | Dashboard summary stats |

All hooks follow the pattern:
```ts
{ data, loading, error }
```

---

## Cache Invalidation (Phase 1)

Phase 1 uses no client-side cache. Data is always fetched fresh on:
- Page load / navigation
- After form submission (redirect or refetch)

Phase 2 will introduce SWR or React Query for optimistic updates and background revalidation.

---

## Context Provider Hierarchy

```tsx
// app/layout.tsx
<AuthProvider>
  <ToastProvider>
    <Navbar />
    {children}
    <Footer />
    <ToastContainer />
  </ToastProvider>
</AuthProvider>
```

---

## Acceptance Criteria

- [ ] Auth state available in all client components via `useAuth()` hook
- [ ] Toast notifications work from any component via `useToast()`
- [ ] No prop drilling beyond 2 levels for auth or toast state
- [ ] Form state never leaves the form component (no lifted form state)
- [ ] Loading and error states handled in every data-fetching hook

## Related Documents

- [08-frontend-architecture.md](08-frontend-architecture.md)
- [11-authentication.md](11-authentication.md)
- [22-loading-states.md](22-loading-states.md)
- [21-error-handling.md](21-error-handling.md)
