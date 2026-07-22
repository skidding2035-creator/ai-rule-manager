import type { ReactNode } from 'react'

interface TopBarProps {
  title: string
  subtitle?: string
  right?: ReactNode
}

export function TopBar({ title, subtitle, right }: TopBarProps) {
  return (
    <div className="flex items-start justify-between px-8 pt-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-4">{right}</div>}
    </div>
  )
}
