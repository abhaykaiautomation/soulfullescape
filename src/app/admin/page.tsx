'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, Users, TrendingUp, DollarSign, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'

interface Stats {
  upcomingTrips: number
  totalBookings: number
  spotsFilledThisMonth: number
  revenueThisMonth: number
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof CalendarDays
  label: string
  value: string
  loading: boolean
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
          <Icon size={20} className="text-teal" aria-hidden />
        </div>
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      {loading ? (
        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-navy">{value}</p>
      )}
    </div>
  )
}

export default function AdminDashboardPage() {
  const { firebaseUser } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!firebaseUser) return
    firebaseUser.getIdToken().then((token) =>
      fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then(({ data }) => setStats(data))
        .catch(console.error)
        .finally(() => setLoading(false))
    )
  }, [firebaseUser])

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-bold text-navy text-2xl md:text-3xl">Dashboard</h1>
        <Link href={ROUTES.adminTripsNew}>
          <Button leftIcon={<Plus size={18} />}>New Trip</Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          icon={CalendarDays}
          label="Upcoming Trips"
          value={stats?.upcomingTrips.toString() ?? '—'}
          loading={loading}
        />
        <StatCard
          icon={Users}
          label="Total Bookings"
          value={stats?.totalBookings.toString() ?? '—'}
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          label="Spots This Month"
          value={stats?.spotsFilledThisMonth.toString() ?? '—'}
          loading={loading}
        />
        <StatCard
          icon={DollarSign}
          label="Revenue This Month"
          value={stats ? formatCurrency(stats.revenueThisMonth) : '—'}
          loading={loading}
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href={ROUTES.adminTrips}
          className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group"
        >
          <CalendarDays size={24} className="text-teal mb-3" aria-hidden />
          <h2 className="font-semibold text-navy mb-1">Manage Trips</h2>
          <p className="text-sm text-gray-500">Create, edit, and publish trip dates</p>
        </Link>
        <Link
          href={ROUTES.adminBookings}
          className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group"
        >
          <Users size={24} className="text-teal mb-3" aria-hidden />
          <h2 className="font-semibold text-navy mb-1">View Bookings</h2>
          <p className="text-sm text-gray-500">See guests, export guest lists</p>
        </Link>
      </div>
    </div>
  )
}
