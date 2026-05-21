# Skill: UI Components

## Purpose

Practical reference for building, composing, and maintaining UI components in the Soulfullescape design system.

## Business Goal

Enable fast, consistent UI development by establishing clear patterns every developer can follow.

## Scope

- Component structure conventions
- Base UI primitives
- Composition patterns
- Tailwind class conventions
- Accessibility requirements

---

## Architecture Notes

All components live in `src/components/`. Three categories:
- `ui/` — design system primitives (no domain knowledge)
- `layout/` — page structure components
- `[domain]/` — domain-specific components (trips, booking, admin)

No component imports Prisma or Firebase Admin SDK. Data flows in via props or hooks.

---

## Implementation Details

### Component Template

```tsx
// components/ui/Button.tsx
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
}

const variants = {
  primary: 'bg-teal text-white hover:bg-teal-dark focus-visible:ring-teal',
  secondary: 'bg-white text-teal border border-teal hover:bg-teal/5 focus-visible:ring-teal',
  ghost: 'bg-transparent text-teal hover:bg-teal/10 focus-visible:ring-teal',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
}

const sizes = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-base',
  lg: 'h-14 px-8 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : leftIcon}
      {children}
    </button>
  )
}
```

### `cn()` Utility

```ts
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Use `cn()` for all conditional Tailwind class logic — it merges correctly and removes conflicting classes.

### Card Component

```tsx
// components/ui/Card.tsx
interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className, hover, onClick }: CardProps) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl shadow-sm overflow-hidden',
        hover && 'transition-shadow hover:shadow-md cursor-pointer',
        onClick && 'text-left w-full',
        className
      )}
    >
      {children}
    </Tag>
  )
}
```

### Badge Component

```tsx
// components/ui/Badge.tsx
const variantClasses = {
  success: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
}

const dotColors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
  neutral: 'bg-gray-400',
}

export function Badge({ variant, dot, children }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium', variantClasses[variant])}>
      {dot && <span className={cn('h-2 w-2 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  )
}
```

---

## Folder Structure

```
src/components/
  ui/
    Button.tsx
    Card.tsx
    Badge.tsx
    Input.tsx
    Select.tsx
    Textarea.tsx
    Modal.tsx
    Toast.tsx
    Spinner.tsx
    Avatar.tsx
    ConfirmDialog.tsx
  layout/
    Navbar.tsx
    Footer.tsx
    AdminSidebar.tsx
  trips/
    TripCard.tsx
    TripGrid.tsx
    TripStatusBadge.tsx
    SpotCountIndicator.tsx
  booking/
    BookingForm.tsx
    SpotSelector.tsx
    BookingConfirmation.tsx
  admin/
    TripTable.tsx
    TripForm.tsx
    BookingTable.tsx
    DashboardStats.tsx
  auth/
    AuthGuard.tsx
    AdminGuard.tsx
lib/
  utils.ts           cn(), formatDate(), formatCurrency()
```

---

## Related Components

All components are related — the design system is a connected graph, not isolated atoms.

Key relationships:
- Every form uses `Input`, `Button`, `Select` from `ui/`
- `TripCard` uses `Badge`, `Button`, `Card` from `ui/`
- `BookingForm` uses `Input`, `Select`, `Button`, `SpotSelector`
- `AdminGuard` used in `app/admin/layout.tsx`

---

## Database Dependencies

No components query the database directly. Data flows through:
1. Server Components → props
2. Client hooks (`useTrips`, `useAuth`) → state → props

---

## Acceptance Criteria

- [ ] All `ui/` components have TypeScript interfaces
- [ ] All interactive elements include `focus-visible` ring styles
- [ ] No `any` types in component props
- [ ] All icon-only buttons have `aria-label`
- [ ] `cn()` used for all conditional class logic (no string concatenation)
- [ ] No domain logic (Prisma, Firebase) imported in any component

## Future Improvements

- Storybook for component documentation and visual testing
- Component snapshot tests
- Dark mode variants
- Animation variants (Framer Motion)

## Related Documents

- [docs/18-ui-design-system.md](../docs/18-ui-design-system.md)
- [docs/19-component-library.md](../docs/19-component-library.md)
- [docs/29-accessibility.md](../docs/29-accessibility.md)
