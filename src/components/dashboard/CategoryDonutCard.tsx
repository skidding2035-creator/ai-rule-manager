import type { CategoryStat } from '@/types'
import { Card } from '@/components/ui/Card'
import { FooterLink } from '@/components/ui/FooterLink'
import { DonutChart } from '@/components/ui/charts/DonutChart'
import { dotClasses } from '@/lib/colors'

interface CategoryDonutCardProps {
  categories: CategoryStat[]
}

export function CategoryDonutCard({ categories }: CategoryDonutCardProps) {
  return (
    <Card title="カテゴリ別ルール数" footer={<FooterLink to="/categories" label="すべてのカテゴリを見る" />}>
      <div className="flex flex-col items-center gap-4">
        <DonutChart data={categories} size={100} strokeWidth={14} />
        <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2">
          {categories.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-1.5 text-gray-300">
                <span className={`h-2 w-2 shrink-0 rounded-full ${dotClasses[cat.color]}`} />
                <span className="truncate">{cat.name}</span>
              </span>
              <span className="shrink-0 text-gray-500">{cat.percentage}%</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
