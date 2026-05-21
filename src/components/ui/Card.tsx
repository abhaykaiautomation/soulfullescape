import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className, hover = false, onClick }: CardProps) {
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl shadow-sm overflow-hidden',
        hover && 'transition-shadow duration-200 hover:shadow-md',
        onClick && 'cursor-pointer text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2',
        className
      )}
    >
      {children}
    </Tag>
  )
}
