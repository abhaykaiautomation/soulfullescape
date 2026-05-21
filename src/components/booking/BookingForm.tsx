'use client'

import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bookingSchema, type BookingInput } from '@/lib/schemas/booking.schema'
import { apiRequest, ApiError } from '@/lib/api'
import { normalisePhone, formatCurrency } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SpotSelector } from './SpotSelector'
import { ROUTES } from '@/constants/routes'
import type { TripWithComputed } from '@/types'

interface BookingFormProps {
  trip: TripWithComputed
}

export function BookingForm({ trip }: BookingFormProps) {
  const { firebaseUser, dbUser } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    mode: 'onBlur',
    defaultValues: {
      tripId: trip.id,
      customerName: dbUser?.name ?? '',
      customerEmail: dbUser?.email ?? '',
      whatsappPhone: '',
      spotsRequested: 1,
    },
  })

  const spots = watch('spotsRequested')
  const total = spots * Number(trip.pricePerPerson)

  const onSubmit = async (data: BookingInput) => {
    if (!firebaseUser) {
      router.push(`/login?returnUrl=${ROUTES.book(trip.id)}`)
      return
    }

    try {
      const token = await firebaseUser.getIdToken()
      // Always use trip.id from the prop — hidden inputs are unreliable in RHF
      const normalised = {
        ...data,
        tripId: trip.id,
        whatsappPhone: normalisePhone(data.whatsappPhone),
      }

      const result = await apiRequest<{ data: { id: string } }>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(normalised),
        token,
      })

      router.push(ROUTES.bookingConfirmation(result.data.id))
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          toast(err.message, 'error')
          router.push(ROUTES.trips)
        } else if (err.status === 401) {
          router.push(`/login?returnUrl=${ROUTES.book(trip.id)}`)
        } else {
          toast(err.message || 'Something went wrong. Please try again.', 'error')
        }
      } else {
        toast('Network error. Please check your connection.', 'error')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <Input
        label="Your Name"
        autoComplete="name"
        error={errors.customerName?.message}
        {...register('customerName')}
      />

      <Input
        label="Email Address"
        type="email"
        autoComplete="email"
        error={errors.customerEmail?.message}
        {...register('customerEmail')}
      />

      <Input
        label="WhatsApp Number"
        type="tel"
        autoComplete="tel"
        placeholder="+17875551234"
        hint="Include country code — your confirmation will be sent here."
        error={errors.whatsappPhone?.message}
        {...register('whatsappPhone')}
      />

      <Controller
        name="spotsRequested"
        control={control}
        render={({ field }) => (
          <SpotSelector
            value={field.value}
            onChange={field.onChange}
            max={trip.maxBookable}
            error={errors.spotsRequested?.message}
          />
        )}
      />

      {/* Price summary */}
      <div className="rounded-xl bg-cream p-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">
          {spots} × {formatCurrency(Number(trip.pricePerPerson))}
        </span>
        <span className="font-bold text-navy text-lg">{formatCurrency(total)}</span>
      </div>

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={isSubmitting}
        disabled={trip.maxBookable === 0}
      >
        {isSubmitting
          ? 'Reserving your spots...'
          : `Reserve ${spots} Spot${spots !== 1 ? 's' : ''}`}
      </Button>

      <p className="text-center text-xs text-gray-400">
        No credit card required today — spots held on confirmation.
      </p>
    </form>
  )
}
