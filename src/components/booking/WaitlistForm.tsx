'use client'

import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { waitlistSchema, type WaitlistInput } from '@/lib/schemas/waitlist.schema'
import { apiRequest, ApiError } from '@/lib/api'
import { normalisePhone } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SpotSelector } from './SpotSelector'
import { ROUTES } from '@/constants/routes'
import type { TripWithComputed } from '@/types'

interface WaitlistFormProps {
  trip: TripWithComputed
}

export function WaitlistForm({ trip }: WaitlistFormProps) {
  const { firebaseUser, dbUser } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistInput>({
    resolver: zodResolver(waitlistSchema),
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

  const onSubmit = async (data: WaitlistInput) => {
    if (!firebaseUser) {
      router.push(`/login?returnUrl=${ROUTES.waitlist(trip.id)}`)
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

      const result = await apiRequest<{ data: { id: string } }>('/api/waitlist', {
        method: 'POST',
        body: JSON.stringify(normalised),
        token,
      })

      router.push(ROUTES.waitlistConfirmation(result.data.id))
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          toast(err.message, 'error')
        } else if (err.status === 401) {
          router.push(`/login?returnUrl=${ROUTES.waitlist(trip.id)}`)
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
        hint="We'll message you here if a spot opens up."
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
            max={10}
            error={errors.spotsRequested?.message}
          />
        )}
      />

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={isSubmitting}
        className="bg-gold text-navy hover:bg-gold-dark focus-visible:ring-gold"
      >
        {isSubmitting
          ? 'Joining waitlist...'
          : `Join Waitlist for ${spots} Spot${spots !== 1 ? 's' : ''}`}
      </Button>

      <p className="text-center text-xs text-gray-400">
        Free to join — no payment until a spot is confirmed.
      </p>
    </form>
  )
}
