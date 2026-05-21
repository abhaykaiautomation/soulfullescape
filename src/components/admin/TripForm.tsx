'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tripSchema, type TripInput } from '@/lib/schemas/trip.schema'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

interface TripFormProps {
  defaultValues?: Partial<TripInput>
  onSubmit: (data: TripInput) => Promise<void>
  mode?: 'create' | 'edit'
  spotsBooked?: number
}

export function TripForm({ defaultValues, onSubmit, mode = 'create', spotsBooked = 0 }: TripFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TripInput>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      status: 'DRAFT',
      capacity: 20,
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <Input
        label="Trip Title"
        placeholder="Lake Day — July 19"
        error={errors.title?.message}
        {...register('title')}
      />

      <Textarea
        label="Description"
        placeholder="Tell guests what to expect..."
        showCount
        maxLength={1000}
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Trip Date & Time"
          type="datetime-local"
          error={errors.tripDate?.message}
          {...register('tripDate')}
        />
        <Select
          label="Status"
          options={[
            { value: 'DRAFT', label: 'Draft' },
            { value: 'PUBLISHED', label: 'Published (visible to guests)' },
          ]}
          error={errors.status?.message}
          {...register('status')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Start Time"
          placeholder="8:00 AM"
          error={errors.startTime?.message}
          {...register('startTime')}
        />
        <Input
          label="End Time"
          placeholder="5:00 PM"
          error={errors.endTime?.message}
          {...register('endTime')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Capacity (max guests)"
          type="number"
          min={spotsBooked || 1}
          hint={mode === 'edit' && spotsBooked > 0 ? `Cannot go below ${spotsBooked} (already booked)` : undefined}
          error={errors.capacity?.message}
          {...register('capacity', { valueAsNumber: true })}
        />
        <Input
          label="Price Per Person (USD)"
          type="number"
          min={0}
          step={0.01}
          placeholder="74.99"
          error={errors.pricePerPerson?.message}
          {...register('pricePerPerson', { valueAsNumber: true })}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={isSubmitting}>
          {mode === 'create' ? 'Create Trip' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
