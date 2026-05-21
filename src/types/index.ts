import type { User, Trip, Booking, UserRole, TripStatus, BookingStatus } from '@prisma/client'

// Re-export Prisma types
export type { User, Trip, Booking, UserRole, TripStatus, BookingStatus }

// API response shapes
export interface TripWithComputed extends Trip {
  spotsRemaining: number
  maxBookable: number
  pricePerPerson: number
}

export interface BookingWithTrip extends Booking {
  trip: Pick<Trip, 'id' | 'title' | 'tripDate' | 'startTime' | 'endTime'>
  totalPrice: number
  pricePerPerson: number
}

export interface AdminStats {
  upcomingTrips: number
  totalBookings: number
  spotsFilledThisMonth: number
  revenueThisMonth: number
}

export interface ApiResponse<T> {
  data: T
}

export interface ApiListResponse<T> {
  data: T[]
  count: number
}
