import { useId, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import type { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  leftAddon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftAddon, className, ...props }, ref) => {
    const id = useId()

    return (
      <div className="space-y-1">
        <label htmlFor={id} className="block text-sm font-medium text-navy">
          {label}
          {props.required && <span className="text-red-500 ml-1" aria-hidden>*</span>}
        </label>
        <div className="relative">
          {leftAddon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 text-sm pointer-events-none">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            aria-describedby={
              error ? `${id}-error` : hint ? `${id}-hint` : undefined
            }
            aria-invalid={!!error}
            className={cn(
              'w-full rounded-lg border px-4 py-3 text-base text-navy placeholder:text-gray-400',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              leftAddon && 'pl-10',
              error
                ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                : 'border-gray-200 focus:border-teal focus:ring-teal/20',
              'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
              className
            )}
            {...props}
          />
        </div>
        {hint && !error && (
          <p id={`${id}-hint`} className="text-xs text-gray-500">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
