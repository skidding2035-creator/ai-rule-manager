import type { Announcement, AccentColor } from '@/types'
import { Card } from '@/components/ui/Card'
import { FooterLink } from '@/components/ui/FooterLink'
import { dotClasses } from '@/lib/colors'

interface AnnouncementsCardProps {
  announcements: Announcement[]
}

const severityColor: Record<Announcement['severity'], AccentColor> = {
  info: 'blue',
  success: 'green',
  warning: 'orange',
}

export function AnnouncementsCard({ announcements }: AnnouncementsCardProps) {
  return (
    <Card title="重要なお知らせ" footer={<FooterLink to="/reports" label="すべてのお知らせを見る" />}>
      <ul className="space-y-4">
        {announcements.map((item) => (
          <li key={item.id} className="flex gap-3">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotClasses[severityColor[item.severity]]}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-semibold text-gray-100">{item.title}</p>
                <span className="shrink-0 text-xs text-gray-600">{item.timestamp}</span>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
