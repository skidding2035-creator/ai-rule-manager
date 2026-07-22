import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import type { Category, StatusHistoryEntry } from '@/types'
import { getRuleService } from '@/services/rules'
import { getCategoryService } from '@/services/categories'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { Table, type TableColumn } from '@/components/ui/Table'
import { StatusPill } from '@/components/ui/StatusPill'
import { Select } from '@/components/ui/Select'
import { statusLabels } from '@/lib/colors'

export function HistoryPage() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<StatusHistoryEntry[] | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    let cancelled = false
    Promise.all([getRuleService().getAllHistory(), getCategoryService().getCategories()]).then(([data, categoryData]) => {
      if (cancelled) return
      setEntries(data)
      setCategories(categoryData)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const filteredEntries = useMemo(() => {
    if (!entries) return []
    const q = search.trim().toLowerCase()
    return entries.filter((entry) => {
      if (categoryFilter !== 'all' && entry.category !== categoryFilter) return false
      if (statusFilter !== 'all' && entry.status !== statusFilter) return false
      if (q) {
        const haystack = `${entry.ruleName} ${entry.comment}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [entries, search, categoryFilter, statusFilter])

  const columns: TableColumn<StatusHistoryEntry>[] = [
    { key: 'timestamp', header: '日時', render: (row) => row.timestamp, className: 'whitespace-nowrap text-gray-500' },
    { key: 'status', header: 'ステータス', render: (row) => <StatusPill status={row.status} /> },
    { key: 'ruleName', header: 'ルール名', render: (row) => row.ruleName },
    { key: 'category', header: 'カテゴリ', render: (row) => row.category, className: 'whitespace-nowrap' },
    { key: 'changedBy', header: '変更者', render: (row) => row.changedBy, className: 'whitespace-nowrap' },
    { key: 'comment', header: '理由・コメント', render: (row) => row.comment },
  ]

  return (
    <div className="pb-8">
      <TopBar title="履歴" subtitle="すべてのルールのステータス変更履歴を確認できます" />

      <div className="space-y-6 px-8 pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ルール名・コメントで検索"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-gray-200 placeholder:text-gray-600 outline-none hover:border-gray-600 focus:border-accent-blue"
            />
          </div>
          <Select
            ariaLabel="カテゴリ"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: 'all', label: 'すべてのカテゴリ' },
              ...categories.map((c) => ({ value: c.name, label: c.name })),
            ]}
          />
          <Select
            ariaLabel="ステータス"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'すべてのステータス' },
              ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>

        <Card>
          {!entries ? (
            <p className="py-12 text-center text-sm text-gray-500">読み込み中...</p>
          ) : filteredEntries.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">該当する履歴がありません</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-gray-500">
                {entries.length}件中{filteredEntries.length}件を表示
              </p>
              <Table
                columns={columns}
                rows={filteredEntries}
                rowKey={(row) => row.id}
                onRowClick={(row) => navigate(`/rules/${row.ruleId}`)}
              />
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
