# 23 — Form Validation

## Purpose

Define the validation strategy for every user-facing form, including schemas, error display, and shared validation logic between client and server.

## Business Goal

Prevent invalid data from reaching the database while keeping the user experience frictionless — validation should help, not obstruct.

---

## Validation Stack

| Layer | Tool | Purpose |
|---|---|---|
| Client-side | React Hook Form + Zod resolver | Real-time field validation + form state |
| Server-side | Zod | API input validation before DB write |
| Shared | Zod schema (imported by both) | Single source of validation truth |

Zod schemas defined in `lib/schemas/` are imported by:
1. API route handlers (server validation)
2. React Hook Form `zodResolver` (client validation)

This guarantees **identical validation rules** on both sides.

---

## Shared Zod Schemas

### Booking Schema

```ts
// lib/schemas/booking.schema.ts
import { z } from 'zod'

export const bookingSchema = z.object({
  tripId: z.string().cuid('Invalid trip ID'),
  customerName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  customerEmail: z.string().email('Enter a valid email address'),
  whatsappPhone: z
    .string()
    .regex(
      /^\+?[1-9]\d{7,14}$/,
      'Enter a valid phone number with country code (e.g. +17875551234)'
    ),
  spotsRequested: z
    .number({ invalid_type_error: 'Select number of spots' })
    .int()
    .min(1, 'Must request at least 1 spot')
    .max(10, 'Maximum 10 spots per booking'),
})

export type BookingInput = z.infer<typeof bookingSchema>
```

### Trip Schema (Admin)

```ts
// lib/schemas/trip.schema.ts
import { z } from 'zod'

export const tripSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  tripDate: z.string().datetime({ message: 'Enter a valid date and time' }),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(200),
  pricePerPerson: z
    .number()
    .positive('Price must be greater than 0')
    .multipleOf(0.01, 'Price can have at most 2 decimal places'),
  status: z.enum(['DRAFT', 'PUBLISHED']),
})

export type TripInput = z.infer<typeof tripSchema>
```

### Registration Schema

```ts
// lib/schemas/auth.schema.ts
export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(80),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
```

---

## Form Implementation Pattern

```tsx
// components/booking/BookingForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bookingSchema, BookingInput } from '@/lib/schemas/booking.schema'

export function BookingForm({ trip, onSuccess }: BookingFormProps) {
  const { dbUser } = useAuth()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isValid },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    mode: 'onBlur',           // validate on blur, not on every keystroke
    defaultValues: {
      tripId: trip.id,
      customerName: dbUser?.name ?? '',
      customerEmail: dbUser?.email ?? '',
      spotsRequested: 1,
    },
  })

  const onSubmit = async (data: BookingInput) => {
    try {
      const token = await getCurrentUserToken()
      const booking = await apiRequest('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      onSuccess(booking)
    } catch (err) {
      // error handling per 21-error-handling.md
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input
        label="Your Name"
        {...register('customerName')}
        error={errors.customerName?.message}
      />
      <Input
        label="Email Address"
        type="email"
        {...register('customerEmail')}
        error={errors.customerEmail?.message}
      />
      <Input
        label="WhatsApp Number"
        type="tel"
        placeholder="+17875551234"
        hint="Include country code. We'll send your confirmation here."
        {...register('whatsappPhone')}
        error={errors.whatsappPhone?.message}
      />
      {/* SpotSelector uses Controller for custom input */}
      <Button type="submit" loading={isSubmitting} fullWidth>
        {isSubmitting ? 'Reserving...' : 'Reserve Spots'}
      </Button>
    </form>
  )
}
```

---

## Validation Mode

| Setting | Value | Reason |
|---|---|---|
| `mode` | `'onBlur'` | Validate when user leaves field — not on every keystroke |
| `reValidateMode` | `'onChange'` (default) | Re-validate on change after first submit attempt |
| `criteriaMode` | `'firstError'` (default) | Show only the first error per field |

---

## Error Display Pattern

```tsx
// components/ui/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, ...props }: InputProps) {
  const id = useId()
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-navy">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-invalid={!!error}
        className={cn(
          'w-full rounded-lg border px-4 py-3 text-base transition-colors',
          error
            ? 'border-red-400 ring-1 ring-red-400'
            : 'border-gray-200 focus:border-teal focus:ring-1 focus:ring-teal'
        )}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
```

---

## Server-Side Validation Pattern

```ts
// In API route handler:
const body = await request.json()
const result = bookingSchema.safeParse(body)

if (!result.success) {
  return NextResponse.json(
    {
      error: result.error.errors[0]?.message ?? 'Validation failed',
      fields: result.error.flatten().fieldErrors,
    },
    { status: 422 }
  )
}

const validated = result.data
```

---

## Form Field Formatting

| Field | Format | Stored As |
|---|---|---|
| WhatsApp phone | Displayed: `(787) 555-1234` | Stored: `+17875551234` |
| Price | Displayed: `$74.99` | Stored: `74.99` (Decimal) |
| Trip date | Displayed: `Saturday, July 19, 2025` | Stored: ISO 8601 UTC |
| Start/End time | Displayed: `8:00 AM` | Stored: `"8:00 AM"` string |

---

## Acceptance Criteria

- [ ] All Zod schemas in `lib/schemas/` imported by both client and API route
- [ ] Form validation uses `mode: 'onBlur'` to avoid premature errors
- [ ] Every field with an error shows `aria-invalid` and `aria-describedby` pointing to error
- [ ] Server returns 422 with field-level errors when Zod fails
- [ ] Phone number validation accepts `+1...` and bare formats

## Related Documents

- [12-booking-engine.md](12-booking-engine.md)
- [21-error-handling.md](21-error-handling.md)
- [19-component-library.md](19-component-library.md)
