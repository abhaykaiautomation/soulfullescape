import { z } from 'zod'

export const tripSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  tripDate: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  capacity: z
    .number({ invalid_type_error: 'Capacity must be a number' })
    .int()
    .min(1, 'Capacity must be at least 1')
    .max(200),
  pricePerPerson: z
    .number({ invalid_type_error: 'Price must be a number' })
    .positive('Price must be greater than 0'),
  status: z.enum(['DRAFT', 'PUBLISHED']),
})

export type TripInput = z.infer<typeof tripSchema>
