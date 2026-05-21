import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type SpinnerSize = 'sm' | 'md' | 'lg'

interface SpinnerProps {
  size?: SpinnerSize
  className?: string
  label?: string
}

const sizes: Record<SpinnerSize, number> = {
  sm: 16,
  md: 24,
  lg: 40,
}

export function Spinner({ size = 'md', className, label = 'Loading...' }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn('inline-flex', className)}>
      <Loader2
        size={sizes[size]}
        className="animate-spin text-teal"
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size="lg" label={label} />
    </div>
  )
}
