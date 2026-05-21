import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type Variant = 'success' | 'error' | 'warning' | 'info' | 'neutral'
type Size = 'sm' | 'md'

interface BadgeProps {
  variant?: Variant
  size?: Size
  dot?: boolean
  className?: string
  children: ReactNode
}

const variants: Record<Variant, string> = {
  success: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
}

const dotColors: Record<Variant, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
  neutral: 'bg-gray-400',
}

const sizes: Record<Size, string> = {
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColors[variant])}
          aria-hidden
        />
      )}
      {children}
    </span>
  )
}
