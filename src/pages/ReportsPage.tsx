import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import type { Category, Rule } from '@/types'
import { getRuleService } from '@/services/rules'
import { getCategoryService } from '@/services/categories'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { statusLabels, priorityLabels, aiPlatformLabels } from '@/lib/colors'
import { countByStatus, countByPriority, countByPlatform, countByCategory } from '@/lib/ruleStats'
import { rowsToCsv, downloadCsv } from '@/lib/csv'
import { useActiveProjectId } from '@/hooks/useActiveProjectId'

export function ReportsPage() {
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

  const exportRuleList = () => {
    if (!rules) return
    const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id
    const csv = rowsToCsv(
      ['コード', 'タイトル', 'ステータス', 'カテゴリ', '優先度', 'AI', 'バージョン', '更新日時'],
      rules.map((r) => [
        r.code,
        r.title,
        statusLabels[r.status],
        categoryName(r.categoryId),
        priorityLabels[r.priority],
        r.aiPlatforms.map((ai) => aiPlatformLabels[ai]).join('/'),
        r.version,
        r.updatedAt,
      ]),
    )
    downloadCsv('rules.csv', csv)
  }

  const exportStatsSummary = () => {
    if (!rules) return
    const rows: (string | number)[][] = []
    for (const s of countByStatus(rules)) rows.push(['ステータス', s.label, s.count])
    for (const p of countByPriority(rules)) rows.push(['優先度', p.label, p.count])
    for (const p of countByPlatform(rules)) rows.push(['AI', p.label, p.count])
    for (const c of countByCategory(rules, categories)) rows.push(['カテゴリ', c.category.name, c.total])
    const csv = rowsToCsv(['種別', '項目', '件数'], rows)
    downloadCsv('stats-summary.csv', csv)
  }

  return (
    <div className="pb-8">
      <TopBar title="レポート" subtitle="現在のルールデータをCSV形式でエクスポートできます" />

      <div className="grid grid-cols-2 gap-6 px-8 pt-6">
        <Card title="ルール一覧をエクスポート">
          <p className="text-sm text-gray-400">
            {rules ? `${rules.length}件` : '...'}
            のルールをコード・タイトル・ステータス・カテゴリ・優先度・AI・バージョン・更新日時付きでCSV出力します。
          </p>
          <button
            onClick={exportRuleList}
            disabled={!rules}
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            ルール一覧をCSVでエクスポート
          </button>
        </Card>

        <Card title="統計サマリーをエクスポート">
          <p className="text-sm text-gray-400">
            ステータス別・優先度別・AI別・カテゴリ別の件数集計(統計・分析画面と同じ内訳)をCSV出力します。
          </p>
          <button
            onClick={exportStatsSummary}
            disabled={!rules}
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            統計サマリーをCSVでエクスポート
          </button>
        </Card>
      </div>
    </div>
  )
}
