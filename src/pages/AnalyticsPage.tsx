import { useEffect, useMemo, useState } from 'react'
import type { Category, Rule } from '@/types'
import { getRuleService } from '@/services/rules'
import { getCategoryService } from '@/services/categories'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { Table, type TableColumn } from '@/components/ui/Table'
import { DonutChart } from '@/components/ui/charts/DonutChart'
import { dotClasses, statusAccentColor, statusLabels } from '@/lib/colors'
import { countByStatus, countByPriority, countByPlatform, countByCategory, type CategoryBreakdown } from '@/lib/ruleStats'
import { useActiveProjectId } from '@/hooks/useActiveProjectId'

function BarList({ items, max }: { items: { key: string; label: string; count: number }[]; max: number }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-gray-300">{item.label}</span>
            <span className="text-gray-500">{item.count}件</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-accent-blue" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function AnalyticsPage() {
  const [rules, setRules] = useState<Rule[] | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const activeProjectId = useActiveProjectId()

  useEffect(() => {
    let cancelled = false
    Promise.all([getRuleService().getRules(), getCategoryService().getCategories()]).then(([ruleData, categoryData]) => {
      if (cancelled) return
      setRules(ruleData)
      setCategories(categoryData)
    })
    return () => {
      cancelled = true
    }
  }, [activeProjectId])

  const statusCounts = useMemo(() => (rules ? countByStatus(rules) : null), [rules])
  const priorityCounts = useMemo(() => (rules ? countByPriority(rules) : null), [rules])
  const platformCounts = useMemo(() => (rules ? countByPlatform(rules) : null), [rules])
  const categoryBreakdown = useMemo(() => (rules ? countByCategory(rules, categories) : null), [rules, categories])

  const statusSlices = useMemo(() => {
    if (!statusCounts || !rules || rules.length === 0) return []
    return statusCounts
      .filter((s) => s.count > 0)
      .map((s) => ({ id: s.status, color: statusAccentColor[s.status], percentage: (s.count / rules.length) * 100 }))
  }, [statusCounts, rules])

  const categoryColumns: TableColumn<CategoryBreakdown>[] = [
    {
      key: 'category',
      header: 'カテゴリ',
      render: (row) => (
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className={`h-2 w-2 shrink-0 rounded-full ${dotClasses[row.category.color]}`} />
          {row.category.name}
        </span>
      ),
    },
    { key: 'total', header: '合計', render: (row) => `${row.total}件`, className: 'whitespace-nowrap' },
    { key: 'active', header: statusLabels.active, render: (row) => row.byStatus.active, className: 'whitespace-nowrap' },
    { key: 'draft', header: statusLabels.draft, render: (row) => row.byStatus.draft, className: 'whitespace-nowrap' },
    {
      key: 'pending_approval',
      header: statusLabels.pending_approval,
      render: (row) => row.byStatus.pending_approval,
      className: 'whitespace-nowrap',
    },
    { key: 'stopped', header: statusLabels.stopped, render: (row) => row.byStatus.stopped, className: 'whitespace-nowrap' },
    { key: 'rejected', header: statusLabels.rejected, render: (row) => row.byStatus.rejected, className: 'whitespace-nowrap' },
  ]

  return (
    <div className="pb-8">
      <TopBar title="統計・分析" subtitle="登録済みルールの分布を確認できます" />

      <div className="space-y-6 px-8 pt-6">
        <div className="grid grid-cols-3 gap-6">
          <Card title="ステータス別内訳">
            {!statusCounts || !rules ? (
              <p className="py-8 text-center text-sm text-gray-500">読み込み中...</p>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <DonutChart data={statusSlices} size={100} strokeWidth={14} />
                <ul className="w-full space-y-2">
                  {statusCounts.map((s) => (
                    <li key={s.status} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-gray-300">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${dotClasses[statusAccentColor[s.status]]}`} />
                        {s.label}
                      </span>
                      <span className="text-gray-500">{s.count}件</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card title="優先度別内訳">
            {!priorityCounts ? (
              <p className="py-8 text-center text-sm text-gray-500">読み込み中...</p>
            ) : (
              <BarList
                items={priorityCounts.map((p) => ({ key: p.priority, label: p.label, count: p.count }))}
                max={Math.max(...priorityCounts.map((p) => p.count), 1)}
              />
            )}
          </Card>

          <Card title="AI別ルール適用状況">
            {!platformCounts ? (
              <p className="py-8 text-center text-sm text-gray-500">読み込み中...</p>
            ) : (
              <BarList
                items={platformCounts.map((p) => ({ key: p.id, label: p.label, count: p.count }))}
                max={Math.max(...platformCounts.map((p) => p.count), 1)}
              />
            )}
          </Card>
        </div>

        <Card title="カテゴリ別詳細">
          {!categoryBreakdown ? (
            <p className="py-8 text-center text-sm text-gray-500">読み込み中...</p>
          ) : (
            <Table columns={categoryColumns} rows={categoryBreakdown} rowKey={(row) => row.category.id} />
          )}
        </Card>
      </div>
    </div>
  )
}
