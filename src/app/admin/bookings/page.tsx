'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { formatDateShort, formatCurrency, formatDateTime } from '@/lib/utils'
import type { BookingWithTrip } from '@/types'

export default function AdminBookingsPage() {
  const { firebaseUser } = useAuth()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<BookingWithTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!firebaseUser) return
    firebaseUser.getIdToken().then((token) =>
      fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then(({ data }) => setBookings(data ?? []))
        .catch(console.error)
        .finally(() => setLoading(false))
    )
  }, [firebaseUser])

  const handleExport = async () => {
    if (!firebaseUser) return
    setExporting(true)
    try {
      const token = await firebaseUser.getIdToken()
      const res = await fetch('/api/bookings/export', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        toast('Export failed', 'error')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `soulfullescape_bookings_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast('Export downloaded', 'success')
    } catch {
      toast('Export failed', 'error')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-navy text-2xl">Bookings</h1>
        <Button
          variant="secondary"
          leftIcon={<Download size={16} />}
          loading={exporting}
          onClick={handleExport}
        >
          Export CSV
        </Button>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No bookings yet.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Guest', 'WhatsApp', 'Trip', 'Date', 'Spots', 'Total', 'Status', 'Booked'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-navy">{b.customerName}</div>
                      <div className="text-xs text-gray-400">{b.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{b.whatsappPhone}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{b.trip.title}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDateShort(b.trip.tripDate)}</td>
                    <td className="px-4 py-3 text-gray-600">{b.spotsReserved}</td>
                    <td className="px-4 py-3 text-gray-600 font-medium">{formatCurrency(Number(b.totalPrice))}</td>
                    <td className="px-4 py-3">
                      <Badge variant={b.status === 'CONFIRMED' ? 'success' : 'neutral'} size="sm">
                        {b.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatDateTime(b.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
