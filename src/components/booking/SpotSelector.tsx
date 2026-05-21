'use client'

import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpotSelectorProps {
  value: number
  onChange: (value: number) => void
  max: number
  error?: string
}

export function SpotSelector({ value, onChange, max, error }: SpotSelectorProps) {
  const decrement = () => onChange(Math.max(1, value - 1))
  const increment = () => onChange(Math.min(max, value + 1))

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-navy">Number of Spots</label>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= 1}
          aria-label="Decrease spots"
          className={cn(
            'w-11 h-11 rounded-full border-2 flex items-center justify-center',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2',
            value <= 1
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-teal text-teal hover:bg-teal/5'
          )}
        >
          <Minus size={18} aria-hidden />
        </button>

        <span className="text-2xl font-bold text-navy w-8 text-center tabular-nums" aria-live="polite">
          {value}
        </span>

        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          aria-label="Increase spots"
          className={cn(
            'w-11 h-11 rounded-full border-2 flex items-center justify-center',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2',
            value >= max
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-teal text-teal hover:bg-teal/5'
          )}
        >
          <Plus size={18} aria-hidden />
        </button>

        <span className="text-sm text-gray-500">
          Max {max} per booking
        </span>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
