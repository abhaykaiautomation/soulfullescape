import type { User, Trip, Booking, UserRole, TripStatus, BookingStatus } from '@prisma/client'

// Re-export Prisma types
export type { User, Trip, Booking, UserRole, TripStatus, BookingStatus }

// API response shapes — Decimal fields replaced with number for JSON serialisation
export interface TripWithComputed extends Omit<Trip, 'pricePerPerson'> {
  pricePerPerson: number
  spotsRemaining: number
  maxBookable: number
}

export interface BookingWithTrip extends Omit<Booking, 'pricePerPerson' | 'totalPrice'> {
  pricePerPerson: number
  totalPrice: number
  trip: Pick<Trip, 'id' | 'title' | 'tripDate' | 'startTime' | 'endTime'>
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
