import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { AIPlatformId, Category, Project, Rule, RulePriority } from '@/types'
import { getRuleService } from '@/services/rules'
import { getCategoryService } from '@/services/categories'
import { getProjectService } from '@/services/projects'
import { SHARED_PROJECT_VALUE } from '@/mock/projects'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { ApprovalReviewModal } from '@/components/rules/ApprovalReviewModal'
import { aiPlatformLabels, priorityLabels } from '@/lib/colors'
import { getNextRuleCode } from '@/lib/ruleStats'

export { SHARED_PROJECT_VALUE }
export const ALL_PLATFORMS: AIPlatformId[] = ['chatgpt', 'claude', 'gemini', 'copilot', 'common']

interface DraftState {
  title: string
  content: string
  categoryId: string
  projectId: string
  priority: RulePriority
  tagsInput: string
  aiPlatforms: AIPlatformId[]
}

// Passed via navigate(..., { state: { duplicate } }) by RuleDetailPage's
// "複製" button — a full or partial draft to prefill instead of the blank
// defaults below.
export interface NewRuleLocationState {
  duplicate?: Partial<DraftState>
}

function buildInitialDraft(overrides?: Partial<DraftState>): DraftState {
  return {
    title: '',
    content: '',
    // Categories load asynchronously, so this can't default to the first
    // category synchronously — the load-categories effect below fills it in
    // once the list arrives.
    categoryId: '',
    // Read fresh at mount time, not once at module-load time — the active
    // project can change between when this module first loads and when the
    // user actually navigates to this page.
    projectId: getProjectService().getActiveProjectId(),
    priority: 'medium',
    tagsInput: '',
    aiPlatforms: [],
    ...overrides,
  }
}

export function NewRulePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const duplicateFrom = (location.state as NewRuleLocationState | null)?.duplicate
  const [draft, setDraft] = useState<DraftState>(() => buildInitialDraft(duplicateFrom))
  const [confirming, setConfirming] = useState(false)
  const [rules, setRules] = useState<Rule[] | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [projects, setProjects] = useState<Project[]>([])

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

  useEffect(() => {
    if (categories.length === 0) return
    setDraft((d) => (d.categoryId === '' ? { ...d, categoryId: categories[0].id } : d))
  }, [categories])

  // Same problem as categoryId above, but for the project field: the initial
  // draft reads the active project id synchronously (before this page's own
  // project list has loaded), so under the Supabase backend it can still be
  // the mock data's placeholder id rather than a real project UUID. Once the
  // real list arrives, fall back to "shared" if the current value isn't a
  // valid option.
  useEffect(() => {
    if (projects.length === 0) return
    const validValues = new Set([SHARED_PROJECT_VALUE, ...projects.map((p) => p.id)])
    setDraft((d) => (validValues.has(d.projectId) ? d : { ...d, projectId: SHARED_PROJECT_VALUE }))
  }, [projects])

  const update = <K extends keyof DraftState>(key: K, value: DraftState[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const togglePlatform = (id: AIPlatformId) =>
    setDraft((d) => ({
      ...d,
      aiPlatforms: d.aiPlatforms.includes(id) ? d.aiPlatforms.filter((p) => p !== id) : [...d.aiPlatforms, id],
    }))

  // Auto-numbered per category (e.g. 画像生成 -> IMG-007), so it stays correct
  // even as rules get created/deleted elsewhere in the same session.
  const nextCode = useMemo(
    () => (rules ? getNextRuleCode(draft.categoryId, categories, rules) : ''),
    [rules, draft.categoryId],
  )

  const isValid = rules !== null && draft.title.trim() !== '' && draft.content.trim() !== '' && draft.categoryId !== ''

  const resolvedProjectId = draft.projectId === SHARED_PROJECT_VALUE ? null : draft.projectId

  const previewRule: Rule | null = confirming
    ? {
        id: 'draft',
        code: nextCode,
        title: draft.title.trim(),
        content: draft.content.trim(),
        version: 'v1.0',
        status: 'draft',
        categoryId: draft.categoryId,
        projectId: resolvedProjectId,
        updatedAt: 'たった今',
        priority: draft.priority,
        tags: draft.tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        aiPlatforms: draft.aiPlatforms,
      }
    : null

  const previewCategory = categories.find((c) => c.id === draft.categoryId)
  const previewProject = projects.find((p) => p.id === resolvedProjectId) ?? null

  const handleApprove = () => {
    if (!previewRule) return
    getRuleService()
      .createRule({
        code: previewRule.code,
        title: previewRule.title,
        content: previewRule.content,
        categoryId: previewRule.categoryId,
        projectId: previewRule.projectId,
        priority: previewRule.priority,
        tags: previewRule.tags,
        aiPlatforms: previewRule.aiPlatforms,
      })
      .then((created) => navigate(`/rules/${created.id}`))
  }

  return (
    <div className="pb-8">
      <TopBar title="新規ルール登録" subtitle="ルールの内容を入力し、確認画面で登録してください" />

      <div className="px-8 pt-6">
        <Card title="ルール入力">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">コード(自動採番)</label>
              <div className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm text-gray-400">
                {nextCode || '...'}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">カテゴリ</label>
              <Select
                ariaLabel="カテゴリ"
                value={draft.categoryId}
                onChange={(v) => update('categoryId', v)}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">プロジェクト</label>
              <Select
                ariaLabel="プロジェクト"
                value={draft.projectId}
                onChange={(v) => update('projectId', v)}
                options={[
                  { value: SHARED_PROJECT_VALUE, label: '共通(全プロジェクトに適用)' },
                  ...projects.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">優先度</label>
              <Select
                ariaLabel="優先度"
                value={draft.priority}
                onChange={(v) => update('priority', v as RulePriority)}
                options={Object.entries(priorityLabels).map(([value, label]) => ({ value, label }))}
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">タイトル</label>
              <input
                value={draft.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="例: 確定表示優先"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-accent-blue"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">ルール内容</label>
              <textarea
                value={draft.content}
                onChange={(e) => update('content', e.target.value)}
                rows={5}
                placeholder="AIが従うべき指示を入力してください"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-accent-blue"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">タグ(カンマ区切り)</label>
              <input
                value={draft.tagsInput}
                onChange={(e) => update('tagsInput', e.target.value)}
                placeholder="例: トーン, 確認フロー"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-accent-blue"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">対応AI</label>
              <div className="flex flex-wrap gap-3">
                {ALL_PLATFORMS.map((id) => (
                  <label key={id} className="flex items-center gap-1.5 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={draft.aiPlatforms.includes(id)}
                      onChange={() => togglePlatform(id)}
                      className="h-4 w-4 rounded border-border accent-accent-blue"
                    />
                    {aiPlatformLabels[id]}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setConfirming(true)}
              disabled={!isValid}
              className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              確認する
            </button>
          </div>
        </Card>
      </div>

      <ApprovalReviewModal
        rule={previewRule}
        category={previewCategory}
        project={previewProject}
        onClose={() => setConfirming(false)}
        onApprove={handleApprove}
        onReviseMore={() => setConfirming(false)}
        onDiscard={() => navigate('/rules')}
      />
    </div>
  )
}
