import { Search, RotateCcw } from 'lucide-react'
import type { Category, Project } from '@/types'
import { Select } from '@/components/ui/Select'
import { statusLabels, priorityLabels, aiPlatformLabels } from '@/lib/colors'
import { SHARED_PROJECT_VALUE } from '@/mock/projects'

interface FilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  categoryFilter: string
  onCategoryChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
  priorityFilter: string
  onPriorityChange: (value: string) => void
  aiFilter: string
  onAiChange: (value: string) => void
  projectFilter: string
  onProjectChange: (value: string) => void
  categories: Category[]
  projects: Project[]
  onReset: () => void
}

export function FilterBar({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  aiFilter,
  onAiChange,
  projectFilter,
  onProjectChange,
  categories,
  projects,
  onReset,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="コード・タイトル・タグで検索"
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-gray-200 placeholder:text-gray-600 outline-none hover:border-gray-600 focus:border-accent-blue"
        />
      </div>
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-gray-400 hover:border-gray-600 hover:text-gray-200"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        リセット
      </button>
      <Select
        ariaLabel="カテゴリ"
        value={categoryFilter}
        onChange={onCategoryChange}
        options={[{ value: 'all', label: 'すべてのカテゴリ' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
      />
      <Select
        ariaLabel="ステータス"
        value={statusFilter}
        onChange={onStatusChange}
        options={[
          { value: 'all', label: 'すべてのステータス' },
          ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
        ]}
      />
      <Select
        ariaLabel="優先度"
        value={priorityFilter}
        onChange={onPriorityChange}
        options={[
          { value: 'all', label: 'すべての優先度' },
          ...Object.entries(priorityLabels).map(([value, label]) => ({ value, label })),
        ]}
      />
      <Select
        ariaLabel="AI"
        value={aiFilter}
        onChange={onAiChange}
        options={[
          { value: 'all', label: 'すべてのAI' },
          ...Object.entries(aiPlatformLabels).map(([value, label]) => ({ value, label })),
        ]}
      />
      <Select
        ariaLabel="プロジェクト"
        value={projectFilter}
        onChange={onProjectChange}
        options={[
          { value: 'all', label: 'すべてのプロジェクト' },
          { value: SHARED_PROJECT_VALUE, label: '共通のみ' },
          ...projects.map((p) => ({ value: p.id, label: p.name })),
        ]}
      />
    </div>
  )
}
