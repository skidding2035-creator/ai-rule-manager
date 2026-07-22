import { Plus, Pencil, PauseCircle, Trash2, type LucideIcon } from 'lucide-react'
import type { ActivityMetric } from '@/types'
import { Card } from '@/components/ui/Card'
import { IconBadge } from '@/components/ui/IconBadge'

const icons: Record<ActivityMetric['key'], LucideIcon> = {
  added: Plus,
  modified: Pencil,
  stopped: PauseCircle,
  deleted: Trash2,
}

interface TodayActivityCardProps {
  metrics: ActivityMetric[]
}

export function TodayActivityCard({ metrics }: TodayActivityCardProps) {
  return (
    <Card title="今日の活動" bodyClassName="flex items-center">
      <div className="grid w-full grid-cols-4 gap-2">
        {metrics.map((metric) => (
          <div key={metric.key} className="flex flex-col items-center gap-2 text-center">
            <IconBadge icon={icons[metric.key]} color={metric.color} size="lg" />
            <p className="text-xs text-gray-400">{metric.label}</p>
            <p className="text-2xl font-semibold text-white">{metric.value}</p>
            <p className="text-xs text-gray-500">+{metric.delta}件</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
