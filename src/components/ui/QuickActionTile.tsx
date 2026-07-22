import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'

interface QuickActionTileProps {
  icon: LucideIcon
  label: string
  to: string
  colorClasses: string
}

export function QuickActionTile({ icon: Icon, label, to, colorClasses }: QuickActionTileProps) {
  return (
    <Link
      to={to}
      className={clsx(
        'flex flex-col items-center justify-center gap-2 rounded-xl border py-5 px-3 text-center text-sm font-medium transition-colors',
        colorClasses,
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  )
}
