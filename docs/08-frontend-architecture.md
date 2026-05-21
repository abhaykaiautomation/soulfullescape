# 08 — Frontend Architecture

## Purpose

Define the frontend structure, conventions, and patterns used in the Next.js App Router codebase.

## Business Goal

Enable any developer to contribute to the frontend without needing to reverse-engineer conventions from existing code.

---

## Framework: Next.js 14+ (App Router)

All pages use the App Router (`app/` directory). The Pages Router (`pages/`) is not used for UI routes; `pages/api/` may be used for API routes if App Router API routes have limitations.

---

## Folder Structure

```
src/
├── app/                          Next.js App Router
│   ├── layout.tsx                Root layout (providers, font, nav)
│   ├── page.tsx                  Landing page
│   ├── globals.css               Tailwind base + custom properties
│   ├── api/                      API route handlers
│   ├── login/
│   ├── register/
│   ├── trips/
│   ├── book/
│   ├── booking/
│   ├── account/
│   └── admin/
│
├── components/                   Shared UI components
│   ├── ui/                       Base design system components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── Spinner.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── AdminSidebar.tsx
│   ├── trips/
│   │   ├── TripCard.tsx
│   │   ├── TripGrid.tsx
│   │   └── TripStatusBadge.tsx
│   ├── booking/
│   │   ├── BookingForm.tsx
│   │   ├── SpotSelector.tsx
│   │   └── BookingConfirmation.tsx
│   └── admin/
│       ├── TripTable.tsx
│       ├── BookingTable.tsx
│       ├── TripForm.tsx
│       └── DashboardStats.tsx
│
├── hooks/                        Custom React hooks
│   ├── useAuth.ts                Firebase auth state
│   ├── useTrips.ts               Trip data fetching
│   ├── useBooking.ts             Booking submission
│   └── useAdmin.ts               Admin data operations
│
├── lib/                          Utilities and configurations
│   ├── firebase.ts               Firebase client SDK init
│   ├── firebase-admin.ts         Firebase Admin SDK init
│   ├── prisma.ts                 Prisma client singleton
│   ├── api.ts                    API client (fetch wrapper)
│   └── utils.ts                  General utilities (cn, formatDate, etc.)
│
├── context/                      React context providers
│   ├── AuthContext.tsx           Firebase auth state provider
│   └── ToastContext.tsx          Toast notification provider
│
├── types/                        TypeScript type definitions
│   ├── api.ts                    API request/response types
│   ├── database.ts               Database model types
│   └── auth.ts                   Auth types
│
└── constants/                    Application constants
    ├── routes.ts                 Route path constants
    └── config.ts                 App-wide config values
```

---

## Rendering Strategy

| Route | Strategy | Reason |
|---|---|---|
| `/` (Landing) | SSR or ISR (60s) | SEO + fresh trip data |
| `/trips` | SSR | Fresh availability data |
| `/trips/[tripId]` | SSR | Fresh spot count |
| `/book/[tripId]` | CSR (client component) | Auth-gated, dynamic form |
| `/booking/confirmation/[id]` | SSR | Server-verified booking ownership |
| `/account/bookings` | CSR | User-specific, auth-gated |
| `/admin/*` | CSR | Auth-gated, real-time admin ops |
| `/login`, `/register` | CSR | Auth state dependent |

---

## Component Conventions

### Naming
- Components: PascalCase (`TripCard.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`)
- Utilities: camelCase (`formatCurrency.ts`)

### Component Structure (single file)
```tsx
// 1. Imports
// 2. Types / interfaces
// 3. Component function
// 4. Export
```

### Server vs Client Components
- Default to **Server Components** for data display
- Add `'use client'` only when needed: `useState`, `useEffect`, event handlers, browser APIs
- Never import server-only code (Prisma, Firebase Admin) into client components

### Props Pattern
```tsx
interface TripCardProps {
  trip: Trip
  onBook?: () => void
}

export function TripCard({ trip, onBook }: TripCardProps) { ... }
```

---

## State Management

See [20-state-management.md](20-state-management.md) for full details.

Summary:
- **Auth state**: React Context (`AuthContext`) wrapping Firebase `onAuthStateChanged`
- **Server data**: Fetched in Server Components or via `useEffect` in Client Components
- **Form state**: React Hook Form
- **Toast/notifications**: React Context (`ToastContext`)
- **No global state library** (Redux/Zustand) in Phase 1 — complexity not justified

---

## API Communication Pattern

All client-to-API communication uses a typed fetch wrapper:

```ts
// lib/api.ts
export async function apiRequest<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T>
```

- Attaches `Authorization: Bearer <token>` automatically when token provided
- Throws typed `ApiError` on non-2xx responses
- Centralises base URL configuration

---

## Authentication Integration

```tsx
// context/AuthContext.tsx
const { user, loading, role } = useAuth()

// Protected page pattern
if (loading) return <Spinner />
if (!user) redirect('/login')
if (role !== 'ADMIN') redirect('/')
```

The `role` property is fetched from the API after Firebase auth resolves, then cached in context for the session duration.

---

## Styling Conventions

- **Tailwind CSS** exclusively — no CSS modules or styled-components
- Custom design tokens in `tailwind.config.ts`
- `cn()` utility (clsx + tailwind-merge) for conditional classes
- Responsive: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)
- Dark mode: not in Phase 1 (brand is light-first)

---

## Form Handling

- **React Hook Form** for all forms
- **Zod** for validation schemas (shared between client and server)
- Inline error messages below each field
- Submit button disabled during loading
- See [23-form-validation.md](23-form-validation.md)

---

## Error Handling in UI

- API errors: caught in `try/catch`, displayed via toast
- Network errors: generic toast with retry option
- Form validation errors: inline below each field
- 404/403 pages: custom `not-found.tsx` and `error.tsx` per segment
- See [21-error-handling.md](21-error-handling.md)

---

## Acceptance Criteria

- [ ] All components in `components/` have TypeScript props interfaces
- [ ] No `any` types in components or hooks
- [ ] All client components marked with `'use client'`
- [ ] `cn()` used for all conditional class logic
- [ ] Responsive breakpoints tested at sm/md/lg/xl

## Related Documents

- [07-system-architecture.md](07-system-architecture.md)
- [19-component-library.md](19-component-library.md)
- [20-state-management.md](20-state-management.md)
- [23-form-validation.md](23-form-validation.md)
