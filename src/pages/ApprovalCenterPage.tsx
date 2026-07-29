import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Category, PendingRevision, Project, Rule } from '@/types'
import { getRuleService } from '@/services/rules'
import { getCategoryService } from '@/services/categories'
import { getProjectService } from '@/services/projects'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { Table, type TableColumn } from '@/components/ui/Table'
import { PriorityPill } from '@/components/ui/PriorityPill'
import { ApprovalReviewModal } from '@/components/rules/ApprovalReviewModal'
import { dotClasses, aiPlatformLabels } from '@/lib/colors'
import { useDataRefreshTick } from '@/hooks/useDataRefresh'

// A "new" item is a brand-new rule proposal (rules.status === pending_approval);
// a "revision" item is an AI-proposed content fix for an already-active rule
// (e.g. from the MCP server's propose_rule_update / fact-check flow) — the
// rule keeps serving its current content until this is approved or rejected.
type ReviewItem = { key: string } & ({ kind: 'new'; rule: Rule } | { kind: 'revision'; rule: Rule; revision: PendingRevision['revision'] })

export function ApprovalCenterPage() {
  const navigate = useNavigate()
  const [rules, setRules] = useState<Rule[] | null>(null)
  const [pendingRevisions, setPendingRevisions] = useState<PendingRevision[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [reviewingKey, setReviewingKey] = useState<string | null>(null)
  const refreshTick = useDataRefreshTick()

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getRuleService().getRules(),
      getCategoryService().getCategories(),
      getProjectService().getProjects(),
      getRuleService().getPendingRevisions(),
    ]).then(([ruleData, categoryData, projectData, revisionData]) => {
      if (cancelled) return
      setRules(ruleData)
      setCategories(categoryData)
      setProjects(projectData)
      setPendingRevisions(revisionData)
    })
    return () => {
      cancelled = true
    }
  }, [refreshTick])

  const reviewItems: ReviewItem[] = useMemo(() => {
    const newItems: ReviewItem[] = (rules?.filter((r) => r.status === 'pending_approval') ?? []).map((rule) => ({
      key: `new:${rule.id}`,
      kind: 'new',
      rule,
    }))
    const revisionItems: ReviewItem[] = pendingRevisions.map(({ rule, revision }) => ({
      key: `revision:${revision.id}`,
      kind: 'revision',
      rule,
      revision,
    }))
    return [...newItems, ...revisionItems]
  }, [rules, pendingRevisions])

  const reviewingItem = reviewItems.find((item) => item.key === reviewingKey) ?? null
  const reviewingRule = reviewingItem?.rule ?? null
  const reviewingRevision = reviewingItem?.kind === 'revision' ? reviewingItem.revision : null
  const reviewingCategory = categories.find((c) => c.id === reviewingRule?.categoryId)
  const reviewingProject = reviewingRule ? (projects.find((p) => p.id === reviewingRule.projectId) ?? null) : null

  const applyStatusUpdate = (id: string, status: Rule['status']) => {
    getRuleService()
      .updateRuleStatus(id, status)
      .then(() => {
        setRules((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, status } : r)) : prev))
      })
    setReviewingKey(null)
  }

  const applyRevisionDecision = async (revisionId: string, decision: 'approve' | 'reject') => {
    setReviewingKey(null)
    if (decision === 'approve') {
      const updatedRule = await getRuleService().approveRevision(revisionId)
      if (updatedRule) {
        setRules((prev) => (prev ? prev.map((r) => (r.id === updatedRule.id ? updatedRule : r)) : prev))
      }
    } else {
      await getRuleService().rejectRevision(revisionId)
    }
    setPendingRevisions((prev) => prev.filter((pr) => pr.revision.id !== revisionId))
  }

  const handleApprove = () => {
    if (!reviewingItem) return
    if (reviewingItem.kind === 'new') applyStatusUpdate(reviewingItem.rule.id, 'active')
    else applyRevisionDecision(reviewingItem.revision.id, 'approve')
  }

  const handleDiscard = () => {
    if (!reviewingItem) return
    if (reviewingItem.kind === 'new') applyStatusUpdate(reviewingItem.rule.id, 'rejected')
    else applyRevisionDecision(reviewingItem.revision.id, 'reject')
  }

  const columns: TableColumn<ReviewItem>[] = [
    {
      key: 'type',
      header: '種別',
      render: (item) =>
        item.kind === 'new' ? (
          <span className="whitespace-nowrap rounded-md bg-accent-green/10 px-1.5 py-0.5 text-xs text-accent-green">新規</span>
        ) : (
          <span className="whitespace-nowrap rounded-md bg-accent-blue/10 px-1.5 py-0.5 text-xs text-accent-blue">修正</span>
        ),
    },
    {
      key: 'rule',
      header: 'ルール',
      render: (item) => (
        <p className="font-medium text-gray-200">
          {item.rule.code} <span className="font-normal text-gray-400">{item.rule.title}</span>
        </p>
      ),
    },
    {
      key: 'category',
      header: 'カテゴリ',
      render: (item) => {
        const cat = categories.find((c) => c.id === item.rule.categoryId)
        return (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className={`h-2 w-2 shrink-0 rounded-full ${dotClasses[cat?.color ?? 'gray']}`} />
            {cat?.name ?? item.rule.categoryId}
          </span>
        )
      },
    },
    { key: 'priority', header: '優先度', render: (item) => <PriorityPill priority={item.rule.priority} /> },
    {
      key: 'ai',
      header: 'AI',
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.rule.aiPlatforms.map((ai) => (
            <span key={ai} className="whitespace-nowrap rounded-md bg-white/5 px-1.5 py-0.5 text-xs text-gray-400">
              {aiPlatformLabels[ai]}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'updatedAt',
      header: '更新日時',
      render: (item) => (item.kind === 'new' ? item.rule.updatedAt : item.revision.timestamp),
      className: 'whitespace-nowrap text-gray-500',
    },
  ]

  return (
    <div className="pb-8">
      <TopBar title="承認センター" subtitle="登録・変更の承認待ちルールを確認できます" />

      <div className="px-8 pt-6">
        <Card>
          {!rules ? (
            <p className="py-12 text-center text-sm text-gray-500">読み込み中...</p>
          ) : reviewItems.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">承認待ちのルールはありません</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-gray-500">承認待ち {reviewItems.length}件</p>
              <Table columns={columns} rows={reviewItems} rowKey={(item) => item.key} onRowClick={(item) => setReviewingKey(item.key)} />
            </>
          )}
        </Card>
      </div>

      <ApprovalReviewModal
        rule={reviewingRule}
        category={reviewingCategory}
        project={reviewingProject}
        revision={reviewingRevision}
        onClose={() => setReviewingKey(null)}
        onApprove={handleApprove}
        onReviseMore={
          reviewingItem?.kind === 'new'
            ? () => {
                if (reviewingRule) navigate(`/rules/${reviewingRule.id}`)
              }
            : undefined
        }
        onDiscard={handleDiscard}
      />
    </div>
  )
}
