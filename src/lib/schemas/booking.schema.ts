import { z } from 'zod'

export const bookingSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  customerName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  customerEmail: z.string().email('Enter a valid email address'),
  whatsappPhone: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid phone number with country code (e.g. +17875551234)'),
  spotsRequested: z
    .number({ invalid_type_error: 'Select number of spots' })
    .int()
    .min(1, 'Must request at least 1 spot')
    .max(10, 'Maximum 10 spots per booking'),
})

export type BookingInput = z.infer<typeof bookingSchema>
