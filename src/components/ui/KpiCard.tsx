import type { LucideIcon } from 'lucide-react'
import type { AccentColor } from '@/types'
import { Card } from './Card'
import { IconBadge } from './IconBadge'

interface KpiCardProps {
  icon: LucideIcon
  color: AccentColor
  label: string
  value: string
  caption: string
}

export function KpiCard({ icon, color, label, value, caption }: KpiCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-4">
          <IconBadge icon={icon} color={color} />
          <p className="text-sm text-gray-400">{label}</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-semibold text-white">{value}</p>
          <p className="mt-1.5 text-xs text-gray-500">{caption}</p>
        </div>
      </div>
    </Card>
  )
}
