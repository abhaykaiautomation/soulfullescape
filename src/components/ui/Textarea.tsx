import { useId, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
  showCount?: boolean
  maxLength?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, showCount, maxLength, className, value, ...props }, ref) => {
    const id = useId()
    const length = typeof value === 'string' ? value.length : 0

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-sm font-medium text-navy">
            {label}
            {props.required && <span className="text-red-500 ml-1" aria-hidden>*</span>}
          </label>
          {showCount && maxLength && (
            <span className="text-xs text-gray-400">
              {length}/{maxLength}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={id}
          maxLength={maxLength}
          value={value}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-invalid={!!error}
          className={cn(
            'w-full rounded-lg border px-4 py-3 text-base text-navy placeholder:text-gray-400',
            'transition-colors duration-150 resize-y min-h-[120px]',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
              : 'border-gray-200 focus:border-teal focus:ring-teal/20',
            'disabled:bg-gray-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p id={`${id}-hint`} className="text-xs text-gray-500">{hint}</p>
        )}
        {error && (
          <p id={`${id}-error`} role="alert" className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
