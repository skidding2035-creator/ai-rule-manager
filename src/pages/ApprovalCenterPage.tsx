import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Category, Project, Rule } from '@/types'
import { getRuleService } from '@/services/rules'
import { getCategoryService } from '@/services/categories'
import { getProjectService } from '@/services/projects'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { Table, type TableColumn } from '@/components/ui/Table'
import { PriorityPill } from '@/components/ui/PriorityPill'
import { ApprovalReviewModal } from '@/components/rules/ApprovalReviewModal'
import { dotClasses, aiPlatformLabels } from '@/lib/colors'

export function ApprovalCenterPage() {
  const navigate = useNavigate()
  const [rules, setRules] = useState<Rule[] | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getRuleService().getRules(), getCategoryService().getCategories(), getProjectService().getProjects()]).then(
      ([ruleData, categoryData, projectData]) => {
        if (cancelled) return
        setRules(ruleData)
        setCategories(categoryData)
        setProjects(projectData)
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  const pendingRules = useMemo(() => rules?.filter((r) => r.status === 'pending_approval') ?? [], [rules])
  const reviewingRule = pendingRules.find((r) => r.id === reviewingId) ?? null
  const reviewingCategory = categories.find((c) => c.id === reviewingRule?.categoryId)
  const reviewingProject = reviewingRule ? (projects.find((p) => p.id === reviewingRule.projectId) ?? null) : null

  const applyStatusUpdate = (id: string, status: Rule['status']) => {
    getRuleService()
      .updateRuleStatus(id, status)
      .then(() => {
        setRules((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, status } : r)) : prev))
      })
    setReviewingId(null)
  }

  const columns: TableColumn<Rule>[] = [
    {
      key: 'rule',
      header: 'ルール',
      render: (r) => (
        <p className="font-medium text-gray-200">
          {r.code} <span className="font-normal text-gray-400">{r.title}</span>
        </p>
      ),
    },
    {
      key: 'category',
      header: 'カテゴリ',
      render: (r) => {
        const cat = categories.find((c) => c.id === r.categoryId)
        return (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className={`h-2 w-2 shrink-0 rounded-full ${dotClasses[cat?.color ?? 'gray']}`} />
            {cat?.name ?? r.categoryId}
          </span>
        )
      },
    },
    { key: 'priority', header: '優先度', render: (r) => <PriorityPill priority={r.priority} /> },
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
    { key: 'updatedAt', header: '更新日時', render: (r) => r.updatedAt, className: 'whitespace-nowrap text-gray-500' },
  ]

  return (
    <div className="pb-8">
      <TopBar title="承認センター" subtitle="登録・変更の承認待ちルールを確認できます" />

      <div className="px-8 pt-6">
        <Card>
          {!rules ? (
            <p className="py-12 text-center text-sm text-gray-500">読み込み中...</p>
          ) : pendingRules.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">承認待ちのルールはありません</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-gray-500">承認待ち {pendingRules.length}件</p>
              <Table
                columns={columns}
                rows={pendingRules}
                rowKey={(r) => r.id}
                onRowClick={(r) => setReviewingId(r.id)}
              />
            </>
          )}
        </Card>
      </div>

      <ApprovalReviewModal
        rule={reviewingRule}
        category={reviewingCategory}
        project={reviewingProject}
        onClose={() => setReviewingId(null)}
        onApprove={() => reviewingRule && applyStatusUpdate(reviewingRule.id, 'active')}
        onReviseMore={() => {
          if (reviewingRule) navigate(`/rules/${reviewingRule.id}`)
        }}
        onDiscard={() => reviewingRule && applyStatusUpdate(reviewingRule.id, 'rejected')}
      />
    </div>
  )
}
