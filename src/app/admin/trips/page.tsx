'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TripStatusBadge } from '@/components/trips/TripStatusBadge'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { formatDateShort, formatCurrency } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import type { TripWithComputed } from '@/types'

export default function AdminTripsPage() {
  const { firebaseUser } = useAuth()
  const { toast } = useToast()
  const [trips, setTrips] = useState<TripWithComputed[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelTarget, setCancelTarget] = useState<TripWithComputed | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const load = async () => {
    if (!firebaseUser) return
    const token = await firebaseUser.getIdToken()
    const res = await fetch('/api/trips?admin=true', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const { data } = await res.json()
    setTrips(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [firebaseUser])

  const handleCancel = async () => {
    if (!cancelTarget || !firebaseUser) return
    setCancelling(true)
    try {
      const token = await firebaseUser.getIdToken()
      const res = await fetch(`/api/trips/${cancelTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      toast('Trip cancelled', 'success')
      setCancelTarget(null)
      load()
    } catch {
      toast('Failed to cancel trip', 'error')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-navy text-2xl">Trips</h1>
        <Link href={ROUTES.adminTripsNew}>
          <Button leftIcon={<Plus size={18} />}>New Trip</Button>
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-4">No trips yet.</p>
          <Link href={ROUTES.adminTripsNew}>
            <Button>Create your first trip →</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Title', 'Date', 'Capacity', 'Booked', 'Price', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {trips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 font-medium text-navy max-w-[200px] truncate">
                      {trip.title}
                    </td>
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                      {formatDateShort(trip.tripDate)}
                    </td>
                    <td className="px-4 py-4 text-gray-600">{trip.capacity}</td>
                    <td className="px-4 py-4 text-gray-600">
                      <span className={trip.spotsBooked === trip.capacity ? 'text-red-600 font-semibold' : ''}>
                        {trip.spotsBooked}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {formatCurrency(trip.pricePerPerson)}
                    </td>
                    <td className="px-4 py-4">
                      <TripStatusBadge status={trip.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {trip.status !== 'CANCELLED' && (
                          <>
                            <Link href={ROUTES.adminTrip(trip.id)}>
                              <button
                                className="p-2 text-gray-400 hover:text-teal rounded-lg hover:bg-teal/5 transition-colors"
                                aria-label={`Edit ${trip.title}`}
                              >
                                <Pencil size={16} />
                              </button>
                            </Link>
                            <button
                              onClick={() => setCancelTarget(trip)}
                              className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                              aria-label={`Cancel ${trip.title}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel this trip?"
        description={`This will cancel "${cancelTarget?.title}" and all ${cancelTarget?.spotsBooked ?? 0} existing booking(s). This cannot be undone.`}
        confirmLabel="Yes, cancel trip"
        variant="danger"
        loading={cancelling}
      />
    </div>
  )
}
