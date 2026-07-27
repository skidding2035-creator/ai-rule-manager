import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Copy, Pencil } from 'lucide-react'
import type { AIPlatformId, Category, Project, Rule, RulePriority, RuleVersionEntry } from '@/types'
import { getRuleService } from '@/services/rules'
import { getCategoryService } from '@/services/categories'
import { getProjectService } from '@/services/projects'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { StatusPill } from '@/components/ui/StatusPill'
import { PriorityPill } from '@/components/ui/PriorityPill'
import { Modal } from '@/components/ui/Modal'
import { ConfirmRegistrationModal } from '@/components/rules/ConfirmRegistrationModal'
import { dotClasses, aiPlatformLabels, priorityLabels } from '@/lib/colors'
import { ALL_PLATFORMS, SHARED_PROJECT_VALUE } from './NewRulePage'

interface EditDraft {
  content: string
  categoryId: string
  projectId: string // real project id, or SHARED_PROJECT_VALUE for 共通
  priority: RulePriority
  tagsInput: string
  aiPlatforms: AIPlatformId[]
}

function bumpVersion(version: string): string {
  const match = version.match(/^v(\d+)\.(\d+)$/)
  if (!match) return version
  return `v${match[1]}.${Number(match[2]) + 1}`
}

export function RuleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [rule, setRule] = useState<Rule | null | undefined>(null)
  const [versions, setVersions] = useState<RuleVersionEntry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState<EditDraft>({
    content: '',
    categoryId: '',
    projectId: SHARED_PROJECT_VALUE,
    priority: 'medium',
    tagsInput: '',
    aiPlatforms: [],
  })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [rollbackTarget, setRollbackTarget] = useState<RuleVersionEntry | null>(null)
  const updateDraft = <K extends keyof EditDraft>(key: K, value: EditDraft[K]) =>
    setEditDraft((d) => ({ ...d, [key]: value }))
  const toggleDraftPlatform = (platform: AIPlatformId) =>
    setEditDraft((d) => ({
      ...d,
      aiPlatforms: d.aiPlatforms.includes(platform)
        ? d.aiPlatforms.filter((p) => p !== platform)
        : [...d.aiPlatforms, platform],
    }))

  useEffect(() => {
    if (!id) return
    let cancelled = false
    Promise.all([
      getRuleService().getRuleById(id),
      getRuleService().getRuleVersions(id),
      getCategoryService().getCategories(),
      getProjectService().getProjects(),
    ]).then(([foundRule, foundVersions, categoryData, projectData]) => {
      if (cancelled) return
      setRule(foundRule ?? undefined)
      setVersions(foundVersions)
      setCategories(categoryData)
      setProjects(projectData)
    })
    return () => {
      cancelled = true
    }
  }, [id])

  if (rule === null) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <p className="text-sm text-gray-500">読み込み中...</p>
      </div>
    )
  }

  if (!rule) {
    return (
      <div className="pb-8">
        <TopBar title="ルール詳細" />
        <div className="px-8 pt-6">
          <Card className="items-center justify-center py-20 text-center text-sm text-gray-500">
            指定されたルールが見つかりませんでした。
            <Link to="/rules" className="mt-3 inline-flex items-center gap-1.5 text-accent-blue hover:text-blue-400">
              <ArrowLeft className="h-3.5 w-3.5" />
              ルール一覧に戻る
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  const category = categories.find((c) => c.id === rule.categoryId)
  const project = projects.find((p) => p.id === rule.projectId)
  const nextVersion = bumpVersion(rule.version)

  const startEdit = () => {
    setEditDraft({
      content: rule.content,
      categoryId: rule.categoryId,
      projectId: rule.projectId ?? SHARED_PROJECT_VALUE,
      priority: rule.priority,
      tagsInput: rule.tags.join(', '),
      aiPlatforms: rule.aiPlatforms,
    })
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setConfirmOpen(false)
  }

  const handleDuplicate = () => {
    navigate('/rules/new', {
      state: {
        duplicate: {
          title: `${rule.title}(コピー)`,
          content: rule.content,
          categoryId: rule.categoryId,
          projectId: rule.projectId ?? SHARED_PROJECT_VALUE,
          priority: rule.priority,
          tagsInput: rule.tags.join(', '),
          aiPlatforms: rule.aiPlatforms,
        },
      },
    })
  }

  const draftResolvedProjectId = editDraft.projectId === SHARED_PROJECT_VALUE ? null : editDraft.projectId
  const draftTags = editDraft.tagsInput
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  const hasChanges =
    editDraft.content !== rule.content ||
    editDraft.categoryId !== rule.categoryId ||
    draftResolvedProjectId !== rule.projectId ||
    editDraft.priority !== rule.priority ||
    draftTags.join(',') !== rule.tags.join(',') ||
    [...editDraft.aiPlatforms].sort().join(',') !== [...rule.aiPlatforms].sort().join(',')

  const handleApprove = () => {
    getRuleService()
      .updateRuleContent(rule.id, {
        version: nextVersion,
        content: editDraft.content,
        status: 'active',
        comment: '内容を編集',
        categoryId: editDraft.categoryId,
        projectId: draftResolvedProjectId,
        priority: editDraft.priority,
        tags: draftTags,
        aiPlatforms: editDraft.aiPlatforms,
      })
      .then((updated) => {
        if (updated) setRule(updated)
        return getRuleService().getRuleVersions(rule.id)
      })
      .then(setVersions)
    setIsEditing(false)
    setConfirmOpen(false)
  }

  const handleReviseMore = () => setConfirmOpen(false)

  const handleDiscard = () => {
    setConfirmOpen(false)
    setIsEditing(false)
  }

  const confirmRollback = () => {
    if (!rollbackTarget) return
    getRuleService()
      .updateRuleContent(rule.id, {
        version: rollbackTarget.version,
        content: rollbackTarget.content,
        status: rollbackTarget.status,
        comment: 'ロールバック実行',
      })
      .then((updated) => {
        if (updated) setRule(updated)
        return getRuleService().getRuleVersions(rule.id)
      })
      .then(setVersions)
    setRollbackTarget(null)
  }

  return (
    <div className="pb-8">
      <TopBar
        title={`${rule.code} ${rule.title}`}
        subtitle={category?.name}
        right={
          !isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDuplicate}
                className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-gray-300 hover:border-gray-600"
              >
                <Copy className="h-4 w-4" />
                複製
              </button>
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
              >
                <Pencil className="h-4 w-4" />
                編集
              </button>
            </div>
          )
        }
      />

      <div className="px-8 pt-2">
        <Link to="/rules" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300">
          <ArrowLeft className="h-3.5 w-3.5" />
          ルール一覧に戻る
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6 px-8 pt-6">
        <div className="col-span-2 flex flex-col gap-6">
          <Card title="概要">
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">ステータス</p>
                <div className="mt-1">
                  <StatusPill status={rule.status} />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">優先度</p>
                {isEditing ? (
                  <div className="mt-1.5">
                    <Select
                      ariaLabel="優先度"
                      value={editDraft.priority}
                      onChange={(v) => updateDraft('priority', v as RulePriority)}
                      options={Object.entries(priorityLabels).map(([value, label]) => ({ value, label }))}
                    />
                  </div>
                ) : (
                  <div className="mt-1">
                    <PriorityPill priority={rule.priority} />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">カテゴリ</p>
                {isEditing ? (
                  <div className="mt-1.5">
                    <Select
                      ariaLabel="カテゴリ"
                      value={editDraft.categoryId}
                      onChange={(v) => updateDraft('categoryId', v)}
                      options={categories.map((c) => ({ value: c.id, label: c.name }))}
                    />
                  </div>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1.5 text-gray-200">
                    <span className={`h-2 w-2 rounded-full ${dotClasses[category?.color ?? 'gray']}`} />
                    {category?.name ?? rule.categoryId}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">バージョン / 更新日時</p>
                <p className="mt-1.5 text-gray-200">
                  {rule.version} ・ {rule.updatedAt}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">プロジェクト</p>
                {isEditing ? (
                  <div className="mt-1.5">
                    <Select
                      ariaLabel="プロジェクト"
                      value={editDraft.projectId}
                      onChange={(v) => updateDraft('projectId', v)}
                      options={[
                        { value: SHARED_PROJECT_VALUE, label: '共通(全プロジェクトに適用)' },
                        ...projects.map((p) => ({ value: p.id, label: p.name })),
                      ]}
                    />
                  </div>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1.5 text-gray-200">
                    {project ? (
                      <>
                        <span className={`h-2 w-2 rounded-full ${dotClasses[project.color]}`} />
                        {project.name}
                      </>
                    ) : (
                      '共通'
                    )}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">対応AI</p>
                {isEditing ? (
                  <div className="mt-1.5 flex flex-wrap gap-3">
                    {ALL_PLATFORMS.map((platform) => (
                      <label key={platform} className="flex items-center gap-1.5 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={editDraft.aiPlatforms.includes(platform)}
                          onChange={() => toggleDraftPlatform(platform)}
                          className="h-4 w-4 rounded border-border accent-accent-blue"
                        />
                        {aiPlatformLabels[platform]}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {rule.aiPlatforms.map((ai) => (
                      <span key={ai} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-gray-300">
                        {aiPlatformLabels[ai]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">タグ</p>
                {isEditing ? (
                  <input
                    value={editDraft.tagsInput}
                    onChange={(e) => updateDraft('tagsInput', e.target.value)}
                    placeholder="例: トーン, 確認フロー"
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-accent-blue"
                  />
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {rule.tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card title="ルール内容">
            {isEditing ? (
              <div>
                <textarea
                  value={editDraft.content}
                  onChange={(e) => updateDraft('content', e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm text-gray-200 outline-none focus:border-accent-blue"
                />
                <div className="mt-3 flex justify-end gap-3">
                  <button onClick={cancelEdit} className="text-sm text-gray-400 hover:text-gray-200">
                    キャンセル
                  </button>
                  <button
                    onClick={() => setConfirmOpen(true)}
                    disabled={editDraft.content.trim() === '' || !hasChanges}
                    className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    変更を確認
                  </button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm text-gray-300">{rule.content}</p>
            )}
          </Card>
        </div>

        <Card title="バージョン履歴">
          <ul>
            {versions.map((v, i) => (
              <li key={`${v.version}-${v.timestamp}-${i}`} className="border-b border-border py-4 first:pt-0 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-200">{v.version}</span>
                  <StatusPill status={v.status} />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {v.timestamp} ・ {v.changedBy}
                </p>
                <p className="mt-1 text-sm text-gray-400">{v.comment}</p>
                {i !== 0 && (
                  <button
                    onClick={() => setRollbackTarget(v)}
                    className="mt-2 text-xs font-medium text-accent-orange hover:text-orange-400"
                  >
                    このバージョンにロールバック
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <ConfirmRegistrationModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        currentVersion={rule.version}
        nextVersion={nextVersion}
        oldContent={rule.content}
        newContent={editDraft.content}
        onApprove={handleApprove}
        onReviseMore={handleReviseMore}
        onDiscard={handleDiscard}
      />

      <Modal
        open={rollbackTarget !== null}
        onClose={() => setRollbackTarget(null)}
        title="バージョンのロールバック"
        footer={
          <>
            <button
              onClick={() => setRollbackTarget(null)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200"
            >
              キャンセル
            </button>
            <button
              onClick={confirmRollback}
              className="rounded-lg bg-accent-orange px-4 py-2 text-sm font-medium text-background hover:opacity-90"
            >
              ロールバックを実行
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-400">
          現在のバージョンを <span className="font-medium text-gray-200">{rollbackTarget?.version}</span>{' '}
          の内容に戻します。この操作は新しい履歴として記録されます。
        </p>
      </Modal>
    </div>
  )
}
