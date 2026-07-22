import type { ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  headerAction?: ReactNode
  footer?: ReactNode
  bodyClassName?: string
}

export function Card({ children, className, title, subtitle, headerAction, footer, bodyClassName }: CardProps) {
  return (
    <div className={clsx('flex flex-col rounded-2xl border border-border bg-card p-6', className)}>
      {(title || subtitle || headerAction) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="text-base font-semibold text-gray-100">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {headerAction}
        </div>
      )}
      <div className={clsx('flex-1', bodyClassName)}>{children}</div>
      {footer && <div className="mt-4 border-t border-border pt-4">{footer}</div>}
    </div>
  )
}
