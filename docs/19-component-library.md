# 19 — Component Library

## Purpose

Catalogue every reusable UI component, its props interface, variants, and usage examples.

## Business Goal

Enable consistent, composable UI development — any screen can be built by assembling documented components.

---

## Base UI Components (`components/ui/`)

### `Button`

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}
```

Variants:
- `primary`: teal background, white text
- `secondary`: white background, teal border + text
- `ghost`: transparent, teal text, hover bg
- `danger`: red background, white text (cancel actions)

---

### `Card`

```tsx
interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean   // adds hover:shadow-lg transition
  onClick?: () => void
}
```

Base: `bg-white rounded-2xl shadow-sm p-6`

---

### `Badge`

```tsx
interface BadgeProps {
  variant: 'success' | 'error' | 'warning' | 'info' | 'neutral'
  size?: 'sm' | 'md'
  dot?: boolean      // shows coloured dot before text
  children: React.ReactNode
}
```

---

### `Input`

```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  leftAddon?: React.ReactNode
  rightAddon?: React.ReactNode
}
```

---

### `Select`

```tsx
interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label: string
  options: SelectOption[]
  error?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}
```

---

### `Textarea`

```tsx
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
  maxLength?: number
  showCount?: boolean   // character count display
}
```

---

### `Modal`

```tsx
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}
```

Uses `dialog` element with focus trap. Closes on Escape key and backdrop click.

---

### `Toast`

```tsx
type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number  // ms, default 4000
}
```

Rendered in `ToastContainer` at `fixed bottom-4 right-4 z-50`.

---

### `Spinner`

```tsx
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'teal' | 'white' | 'navy'
  label?: string   // accessible screen reader text
}
```

---

### `Avatar`

```tsx
interface AvatarProps {
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
}
```

Falls back to initials on coloured background if no `src`.

---

### `ConfirmDialog`

```tsx
interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  loading?: boolean
}
```

---

## Layout Components (`components/layout/`)

### `Navbar`

- Logo + links + auth state (sign in / user menu)
- Mobile: hamburger → slide-out drawer
- Sticky on scroll with backdrop blur

### `Footer`

- Links: About, Contact, Instagram, Privacy
- Brand tagline
- Copyright

### `AdminSidebar`

- Navigation links: Dashboard, Trips, Bookings
- Active state: teal highlight
- Collapsible on mobile

---

## Domain Components (`components/trips/`)

### `TripCard`

```tsx
interface TripCardProps {
  trip: {
    id: string
    title: string
    tripDate: Date
    startTime: string
    endTime: string
    spotsRemaining: number
    maxBookable: number
    pricePerPerson: number
    status: 'PUBLISHED' | 'FULL' | 'CANCELLED'
  }
}
```

Displays: image, title, date, time, spots indicator, price, CTA button.
Conditionally shows: "Sold Out" overlay, "Only X spots left!" warning.

### `TripGrid`

```tsx
interface TripGridProps {
  trips: TripCardProps['trip'][]
  loading?: boolean
  emptyMessage?: string
}
```

Responsive grid: 1col mobile → 2col tablet → 3col desktop.
Skeleton loader when `loading`.

### `TripStatusBadge`

```tsx
interface TripStatusBadgeProps {
  status: 'PUBLISHED' | 'DRAFT' | 'FULL' | 'CANCELLED'
}
```

---

## Domain Components (`components/booking/`)

### `BookingForm`

```tsx
interface BookingFormProps {
  trip: Trip
  onSuccess: (booking: Booking) => void
}
```

Fields: customerName (pre-filled), customerEmail (pre-filled), whatsappPhone, spotsRequested (SpotSelector).
Uses React Hook Form + Zod.

### `SpotSelector`

```tsx
interface SpotSelectorProps {
  max: number          // maxBookable from API
  value: number
  onChange: (value: number) => void
}
```

Stepper UI: decrement button | count | increment button.
Enforces min 1, max `max`.
Shows "Max X spots per booking" label.

### `BookingConfirmation`

```tsx
interface BookingConfirmationProps {
  booking: {
    id: string
    customerName: string
    spotsReserved: number
    totalPrice: number
    trip: { title: string; tripDate: Date; startTime: string; endTime: string }
  }
}
```

---

## Domain Components (`components/admin/`)

### `TripForm`

```tsx
interface TripFormProps {
  defaultValues?: Partial<TripFormData>
  onSubmit: (data: TripFormData) => Promise<void>
  loading?: boolean
  mode: 'create' | 'edit'
}
```

### `TripTable`

```tsx
interface TripTableProps {
  trips: AdminTrip[]
  onEdit: (trip: AdminTrip) => void
  onCancel: (trip: AdminTrip) => void
  loading?: boolean
}
```

### `BookingTable`

```tsx
interface BookingTableProps {
  bookings: AdminBooking[]
  loading?: boolean
  onExport?: () => void
}
```

### `DashboardStats`

```tsx
interface DashboardStatsProps {
  stats: {
    upcomingTrips: number
    totalBookings: number
    spotsFilledThisMonth: number
    revenueThisMonth: number
  }
  loading?: boolean
}
```

Renders 4 stat cards in a responsive grid.

---

## Skeleton Components

For every data-driven component, a corresponding skeleton variant:
- `TripCardSkeleton` — animated pulse placeholder
- `TripTableRowSkeleton` — row-width animated bars
- `StatCardSkeleton` — stat card with pulsing numbers

---

## Component Conventions

1. All components export as **named exports** (not default)
2. All components define TypeScript interfaces above the function
3. No business logic in components — call hooks or receive via props
4. No direct API calls in components — use hooks
5. `className` prop for all leaf components to allow style override
6. Accessible labels on all interactive elements

---

## Acceptance Criteria

- [ ] All base UI components have TypeScript interfaces
- [ ] All interactive components have keyboard and focus support
- [ ] Loading/skeleton states exist for all data-driven components
- [ ] No inline style attributes — only Tailwind classes
- [ ] All icons have accessible `aria-label` when standalone

## Related Documents

- [18-ui-design-system.md](18-ui-design-system.md)
- [08-frontend-architecture.md](08-frontend-architecture.md)
- [22-loading-states.md](22-loading-states.md)
