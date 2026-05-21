import { Badge } from '@/components/ui/Badge'
import type { TripStatus } from '@prisma/client'

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const map: Record<TripStatus, { label: string; variant: 'success' | 'error' | 'neutral' | 'warning' }> = {
    PUBLISHED: { label: 'Available', variant: 'success' },
    DRAFT: { label: 'Draft', variant: 'neutral' },
    FULL: { label: 'Sold Out', variant: 'error' },
    CANCELLED: { label: 'Cancelled', variant: 'neutral' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant} dot>{label}</Badge>
}
