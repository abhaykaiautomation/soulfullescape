# Skill: Form Validation

## Purpose

Implementation guide for the shared Zod + React Hook Form validation system used across all Soulfullescape forms.

## Business Goal

Prevent invalid data from reaching the API while providing clear, immediate feedback to users.

## Scope

- Zod schema definitions
- React Hook Form integration
- Shared client/server schemas
- Error display
- Server-side validation

---

## Architecture Notes

Validation schemas defined once in `lib/schemas/` are used by both:
1. React Hook Form (via `zodResolver`) — client-side validation
2. API route handlers — server-side validation with `schema.parse(body)`

This guarantees identical rules on both layers.

---

## Implementation Details

### Full Booking Form Example

```tsx
// components/booking/BookingForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bookingSchema, type BookingInput } from '@/lib/schemas/booking.schema'

export function BookingForm({ trip, onSuccess }: BookingFormProps) {
  const { dbUser } = useAuth()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isValid, touchedFields },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    mode: 'onBlur',                 // validate on field blur
    reValidateMode: 'onChange',     // re-validate on change after first error
    defaultValues: {
      tripId: trip.id,
      customerName: dbUser?.name ?? '',
      customerEmail: dbUser?.email ?? '',
      whatsappPhone: '',
      spotsRequested: 1,
    },
  })

  const onSubmit = async (data: BookingInput) => {
    try {
      const token = await getCurrentUserToken()
      const result = await apiRequest<{ data: Booking }>('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      onSuccess(result.data)
    } catch (err) {
      if (err instanceof ApiError) {
        toast(err.message, 'error')
        if (err.status === 409) router.push('/trips')
      } else {
        toast('Network error. Please try again.', 'error')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <input type="hidden" {...register('tripId')} />

      <Input
        label="Your Name"
        autoComplete="name"
        {...register('customerName')}
        error={errors.customerName?.message}
      />

      <Input
        label="Email Address"
        type="email"
        autoComplete="email"
        {...register('customerEmail')}
        error={errors.customerEmail?.message}
      />

      <Input
        label="WhatsApp Number"
        type="tel"
        autoComplete="tel"
        placeholder="+17875551234"
        hint="Include country code. Your confirmation will be sent here."
        {...register('whatsappPhone')}
        error={errors.whatsappPhone?.message}
      />

      <Controller
        name="spotsRequested"
        control={control}
        render={({ field }) => (
          <SpotSelector
            label="Number of Spots"
            max={Math.min(10, trip.capacity - trip.spotsBooked)}
            value={field.value}
            onChange={field.onChange}
            error={errors.spotsRequested?.message}
          />
        )}
      />

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Reserving your spots...' : `Reserve ${watch('spotsRequested')} Spot(s)`}
      </Button>
    </form>
  )
}
```

### Server-Side Validation

```ts
// In API route:
const body = await request.json().catch(() => null)
if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

const result = bookingSchema.safeParse(body)
if (!result.success) {
  return NextResponse.json(
    { error: result.error.errors[0].message },
    { status: 422 }
  )
}

const validated = result.data
```

### Zod Refinements

```ts
// lib/schemas/auth.schema.ts — cross-field validation
export const registerSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],   // error appears on confirmPassword field
  })
```

---

## Folder Structure

```
lib/
  schemas/
    booking.schema.ts     Booking form + API validation
    trip.schema.ts        Trip form + API validation
    auth.schema.ts        Login / register validation
```

---

## Related Components

- `Input` — displays `error` prop below field
- `Select` — displays `error` prop below field
- `SpotSelector` — controlled via `Controller`, has `error` prop
- All form components — use `useForm` + `zodResolver`

---

## Database Dependencies

None — validation schemas are pure TypeScript/Zod with no DB dependencies.

---

## API Dependencies

- All POST/PATCH API routes consume validated data via `schema.parse(body)`

---

## Validation Mode Reference

| Mode | When Validation Triggers |
|---|---|
| `'onBlur'` | When field loses focus (default, recommended) |
| `'onChange'` | On every keystroke (too aggressive for most fields) |
| `'onSubmit'` | Only on form submission |
| `'onTouched'` | On first blur, then onChange |
| `'all'` | Always |

Use `'onBlur'` for the best UX — validate after user has finished with a field, not while typing.

---

## Edge Cases

| Case | Handling |
|---|---|
| Phone with spaces/dashes | Zod regex fails; user must format correctly OR normalise before validation |
| HTML5 `type="email"` native validation | Disabled by `noValidate` on form — Zod handles this |
| User pastes value into field | `onBlur` fires after paste+defocus; validation works correctly |
| Empty required field | Zod `.min(1)` or `.string()` catches it |
| Decimal precision in price | Zod `.multipleOf(0.01)` enforces 2 decimal places |

---

## Acceptance Criteria

- [ ] Same Zod schema imported by both form component and API route
- [ ] `mode: 'onBlur'` used on all forms
- [ ] `noValidate` on all form elements (prevent HTML5 native validation)
- [ ] Error messages from Zod are human-readable (not default Zod messages)
- [ ] Server returns 422 with first Zod error on invalid body
- [ ] All error messages display with `role="alert"` for screen readers

## Future Improvements

- Return all field errors from server (not just first)
- Phone number formatting as user types (libphonenumber-js)
- Auto-detect country code from browser locale

## Related Documents

- [docs/23-form-validation.md](../docs/23-form-validation.md)
- [skills/ui-components.md](ui-components.md)
- [docs/29-accessibility.md](../docs/29-accessibility.md)
