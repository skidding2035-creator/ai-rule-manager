import type { Category, Rule } from '@/types'
import { Card } from '@/components/ui/Card'
import { FooterLink } from '@/components/ui/FooterLink'
import { dotClasses, iconBadgeClasses } from '@/lib/colors'

interface RecentUpdatesCardProps {
  rules: Rule[]
  categories: Category[]
}

export function RecentUpdatesCard({ rules, categories }: RecentUpdatesCardProps) {
  const colorFor = (categoryId: string) => categories.find((c) => c.id === categoryId)?.color ?? 'gray'

  return (
    <Card title="最近の更新" footer={<FooterLink to="/history" label="すべての更新を見る" />}>
      <ul className="space-y-2.5">
        {rules.map((rule) => {
          const color = colorFor(rule.categoryId)
          return (
            <li key={rule.id} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold ${iconBadgeClasses[color]}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[color]}`} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-200">
                  {rule.code} <span className="font-normal text-gray-400">{rule.title}</span>
                </p>
              </div>
              <span className="shrink-0 text-xs text-gray-500">{rule.version}</span>
              <span className="shrink-0 text-xs text-gray-600">{rule.updatedAt}</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
