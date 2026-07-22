import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import type { Category, Rule } from '@/types'
import { getRuleService } from '@/services/rules'
import { getCategoryService } from '@/services/categories'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { Table, type TableColumn } from '@/components/ui/Table'
import { StatusPill } from '@/components/ui/StatusPill'
import { PriorityPill } from '@/components/ui/PriorityPill'
import { Modal } from '@/components/ui/Modal'
import { FilterBar } from '@/components/rules/FilterBar'
import { dotClasses, aiPlatformLabels } from '@/lib/colors'
import { STATUS_ORDER, PRIORITY_ORDER } from '@/lib/ruleStats'

interface RuleListFilters {
  search: string
  categoryFilter: string
  statusFilter: string
  priorityFilter: string
  aiFilter: string
}

const defaultFilters: RuleListFilters = {
  search: '',
  categoryFilter: 'all',
  statusFilter: 'all',
  priorityFilter: 'all',
  aiFilter: 'all',
}

// Module-level so filter/search selections survive leaving this page (e.g. to
// view a rule's detail) and coming back — only resets on a full page reload.
let persistedFilters: RuleListFilters = { ...defaultFilters }

export function RuleListPage() {
  const navigate = useNavigate()
  const [rules, setRules] = useState<Rule[] | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<RuleListFilters>(persistedFilters)
  const [deleteTarget, setDeleteTarget] = useState<Rule | null>(null)
  const { search, categoryFilter, statusFilter, priorityFilter, aiFilter } = filters

  useEffect(() => {
    persistedFilters = filters
  }, [filters])

  const updateFilter = <K extends keyof RuleListFilters>(key: K, value: RuleListFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }))

  const resetFilters = () => setFilters({ ...defaultFilters })

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
  }, [])

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id
  const categoryColor = (id: string) => categories.find((c) => c.id === id)?.color ?? 'gray'

  const versionValue = (version: string) => {
    const match = version.match(/^v(\d+)\.(\d+)$/)
    return match ? Number(match[1]) * 1000 + Number(match[2]) : 0
  }
  // `rules` is already newest-first (see mock/rules.ts), so its index is a
  // reasonable recency proxy — the relative-time strings ("20分前") aren't
  // real Dates, so they can't be sorted chronologically as plain text.
  const recencyValue = (rule: Rule) => (rules ? rules.findIndex((r) => r.id === rule.id) : 0)

  const filteredRules = useMemo(() => {
    if (!rules) return []
    const q = search.trim().toLowerCase()
    return rules.filter((rule) => {
      if (categoryFilter !== 'all' && rule.categoryId !== categoryFilter) return false
      if (statusFilter !== 'all' && rule.status !== statusFilter) return false
      if (priorityFilter !== 'all' && rule.priority !== priorityFilter) return false
      if (aiFilter !== 'all' && !rule.aiPlatforms.includes(aiFilter as Rule['aiPlatforms'][number])) return false
      if (q) {
        const haystack = `${rule.code} ${rule.title} ${rule.tags.join(' ')}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [rules, search, categoryFilter, statusFilter, priorityFilter, aiFilter])

  const restoreRule = (id: string) => {
    getRuleService()
      .updateRuleStatus(id, 'pending_approval')
      .then(() => {
        setRules((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, status: 'pending_approval' } : r)) : prev))
      })
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const id = deleteTarget.id
    getRuleService()
      .deleteRule(id)
      .then(() => {
        setRules((prev) => (prev ? prev.filter((r) => r.id !== id) : prev))
      })
    setDeleteTarget(null)
  }

  const columns: TableColumn<Rule>[] = [
    {
      key: 'status',
      header: 'ステータス',
      render: (r) => <StatusPill status={r.status} />,
      sortValue: (r) => STATUS_ORDER.indexOf(r.status),
    },
    {
      key: 'rule',
      header: 'ルール',
      render: (r) => (
        <p className="font-medium text-gray-200">
          {r.code} <span className="font-normal text-gray-400">{r.title}</span>
        </p>
      ),
      sortValue: (r) => r.title,
    },
    {
      key: 'category',
      header: 'カテゴリ',
      render: (r) => (
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className={`h-2 w-2 shrink-0 rounded-full ${dotClasses[categoryColor(r.categoryId)]}`} />
          {categoryName(r.categoryId)}
        </span>
      ),
      sortValue: (r) => categoryName(r.categoryId),
    },
    {
      key: 'priority',
      header: '優先度',
      render: (r) => <PriorityPill priority={r.priority} />,
      sortValue: (r) => PRIORITY_ORDER.indexOf(r.priority),
    },
    {
      key: 'ai',
      header: 'AI',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.aiPlatforms.map((ai) => (
            <span key={ai} className="whitespace-nowrap rounded-md bg-white/5 px-1.5 py-0.5 text-xs text-gray-400">
              {aiPlatformLabels[ai]}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'version',
      header: 'バージョン',
      render: (r) => r.version,
      className: 'whitespace-nowrap',
      sortValue: (r) => versionValue(r.version),
    },
    {
      key: 'updatedAt',
      header: '更新日時',
      render: (r) => r.updatedAt,
      className: 'whitespace-nowrap text-gray-500',
      sortValue: recencyValue,
    },
    ...(statusFilter === 'rejected'
      ? [
          {
            key: 'trashActions',
            header: '操作',
            className: 'whitespace-nowrap',
            render: (r: Rule) => (
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    restoreRule(r.id)
                  }}
                  className="text-xs font-medium text-accent-blue hover:text-blue-400"
                >
                  復元
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteTarget(r)
                  }}
                  className="text-xs font-medium text-accent-red hover:text-red-400"
                >
                  完全に削除
                </button>
              </div>
            ),
          } satisfies TableColumn<Rule>,
        ]
      : []),
  ]

  return (
    <div className="pb-8">
      <TopBar
        title="ルール一覧"
        subtitle="登録されているすべてのルールを検索・管理できます"
        right={
          <Link
            to="/rules/new"
            className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            新規登録
          </Link>
        }
      />

      <div className="space-y-6 px-8 pt-6">
        <FilterBar
          search={search}
          onSearchChange={(v) => updateFilter('search', v)}
          categoryFilter={categoryFilter}
          onCategoryChange={(v) => updateFilter('categoryFilter', v)}
          statusFilter={statusFilter}
          onStatusChange={(v) => updateFilter('statusFilter', v)}
          priorityFilter={priorityFilter}
          onPriorityChange={(v) => updateFilter('priorityFilter', v)}
          aiFilter={aiFilter}
          onAiChange={(v) => updateFilter('aiFilter', v)}
          categories={categories}
          onReset={resetFilters}
        />

        <Card>
          {!rules ? (
            <p className="py-12 text-center text-sm text-gray-500">読み込み中...</p>
          ) : filteredRules.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">該当するルールがありません</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-gray-500">
                {rules.length}件中{filteredRules.length}件を表示
              </p>
              <Table
                columns={columns}
                rows={filteredRules}
                rowKey={(r) => r.id}
                onRowClick={(r) => navigate(`/rules/${r.id}`)}
              />
            </>
          )}
        </Card>
      </div>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="完全に削除しますか？"
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200"
            >
              キャンセル
            </button>
            <button
              onClick={confirmDelete}
              className="rounded-lg bg-accent-red px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              完全に削除する
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-400">
          <span className="font-medium text-gray-200">
            {deleteTarget?.code} {deleteTarget?.title}
          </span>{' '}
          を完全に削除します。この操作は取り消せません。
        </p>
      </Modal>
    </div>
  )
}
