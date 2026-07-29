import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Check } from 'lucide-react'
import type { AccentColor, AIConnection, Project, Rule } from '@/types'
import { getSettingsService } from '@/services/settings'
import { getRuleService } from '@/services/rules'
import { getProjectService } from '@/services/projects'
import { ALL_ACCENT_COLORS } from '@/mock/categories'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { Toggle } from '@/components/ui/Toggle'
import { Modal } from '@/components/ui/Modal'
import { countByPlatform } from '@/lib/ruleStats'
import { dotClasses, iconBadgeClasses } from '@/lib/colors'
import { useDataRefreshTick } from '@/hooks/useDataRefresh'

interface ProjectFormState {
  mode: 'create' | 'edit'
  id?: string
  name: string
  color: AccentColor
}

export function SettingsPage() {
  const [connections, setConnections] = useState<AIConnection[] | null>(null)
  const [rules, setRules] = useState<Rule[] | null>(null)
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [projectForm, setProjectForm] = useState<ProjectFormState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const refreshTick = useDataRefreshTick()

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getSettingsService().getAIConnections(),
      getRuleService().getRules(),
      getProjectService().getProjects(),
    ]).then(([conns, ruleList, projectList]) => {
      if (cancelled) return
      setConnections(conns)
      setRules(ruleList)
      setProjects(projectList)
    })
    return () => {
      cancelled = true
    }
  }, [refreshTick])

  const toggleConnection = (id: string) => {
    // The mock service resolves the same shared array it just mutated, so use
    // that returned value directly rather than re-deriving locally — the local
    // `connections` state is aliased to those same objects, and toggling off of
    // an already-mutated value here would flip it right back.
    getSettingsService()
      .toggleAIConnection(id)
      .then((updated) => setConnections([...updated]))
  }

  const platformCounts = useMemo(() => {
    if (!rules) return null
    const counts = countByPlatform(rules)
    const max = Math.max(...counts.map((c) => c.count), 1)
    return { counts, max }
  }, [rules])

  const refreshProjects = () => {
    getProjectService()
      .getProjects()
      .then((list) => setProjects([...list]))
  }

  const openCreateProject = () => setProjectForm({ mode: 'create', name: '', color: 'blue' })
  const openEditProject = (project: Project) =>
    setProjectForm({ mode: 'edit', id: project.id, name: project.name, color: project.color })
  const closeProjectForm = () => setProjectForm(null)

  const submitProjectForm = () => {
    if (!projectForm || !projectForm.name.trim()) return
    const input = { name: projectForm.name.trim(), color: projectForm.color }
    if (projectForm.mode === 'create') {
      getProjectService().createProject(input).then(refreshProjects)
    } else if (projectForm.id) {
      getProjectService().updateProject(projectForm.id, input).then(refreshProjects)
    }
    closeProjectForm()
  }

  const openDeleteProject = (project: Project) => {
    setDeleteTarget(project)
    setDeleteError(null)
  }

  const confirmDeleteProject = () => {
    if (!deleteTarget) return
    getProjectService()
      .deleteProject(deleteTarget.id)
      .then((result) => {
        if (result.success) {
          refreshProjects()
          setDeleteTarget(null)
        } else {
          setDeleteError(result.reason ?? 'このプロジェクトは削除できません。')
        }
      })
  }

  return (
    <div className="pb-8">
      <TopBar title="設定" subtitle="AIプラットフォームの接続とルール適用状況を管理できます" />

      <div className="grid grid-cols-2 gap-6 px-8 pt-6">
        <Card title="AIプラットフォーム接続">
          {!connections ? (
            <p className="py-8 text-center text-sm text-gray-500">読み込み中...</p>
          ) : (
            <ul className="space-y-4">
              {connections.map((conn) => (
                <li key={conn.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{conn.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{conn.connected ? '接続中' : '未接続'}</p>
                  </div>
                  <Toggle
                    checked={conn.connected}
                    onChange={() => toggleConnection(conn.id)}
                    label={`${conn.name}の接続を切り替え`}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="AI別ルール適用状況">
          {!platformCounts ? (
            <p className="py-8 text-center text-sm text-gray-500">読み込み中...</p>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                「共通」ルールは接続中のすべてのAIプラットフォームに適用されます。
              </p>
              <ul className="space-y-3">
                {platformCounts.counts.map((p) => (
                  <li key={p.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-gray-300">{p.label}</span>
                      <span className="text-gray-500">{p.count}件</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-accent-blue"
                        style={{ width: `${(p.count / platformCounts.max) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card
          className="col-span-2"
          title="プロジェクト管理"
          headerAction={
            <button
              onClick={openCreateProject}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-gray-300 hover:border-gray-600"
            >
              <Plus className="h-3.5 w-3.5" />
              新規プロジェクト
            </button>
          }
        >
          {!projects ? (
            <p className="py-8 text-center text-sm text-gray-500">読み込み中...</p>
          ) : (
            <ul className="divide-y divide-border">
              {projects.map((project) => (
                <li key={project.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 shrink-0 rounded-full ${dotClasses[project.color]}`} />
                    <p className="text-sm font-medium text-gray-200">{project.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditProject(project)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-gray-200"
                      aria-label={`${project.name}を編集`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openDeleteProject(project)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-accent-red"
                      aria-label={`${project.name}を削除`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={projectForm !== null}
        onClose={closeProjectForm}
        title={projectForm?.mode === 'create' ? '新規プロジェクト' : 'プロジェクトを編集'}
        footer={
          <>
            <button
              onClick={closeProjectForm}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200"
            >
              キャンセル
            </button>
            <button
              onClick={submitProjectForm}
              disabled={!projectForm?.name.trim()}
              className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {projectForm?.mode === 'create' ? '作成する' : '保存する'}
            </button>
          </>
        }
      >
        {projectForm && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">プロジェクト名</label>
              <input
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                placeholder="例: RPG制作"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-accent-blue"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">カラー</label>
              <div className="flex flex-wrap gap-2">
                {ALL_ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setProjectForm({ ...projectForm, color })}
                    aria-label={color}
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${iconBadgeClasses[color]}`}
                  >
                    {projectForm.color === color && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="プロジェクトを削除しますか？"
        footer={
          deleteError ? (
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              閉じる
            </button>
          ) : (
            <>
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200"
              >
                キャンセル
              </button>
              <button
                onClick={confirmDeleteProject}
                className="rounded-lg bg-accent-red px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                削除する
              </button>
            </>
          )
        }
      >
        {deleteError ? (
          <p className="text-sm text-accent-red">{deleteError}</p>
        ) : (
          <p className="text-sm text-gray-400">
            <span className="font-medium text-gray-200">{deleteTarget?.name}</span> を削除します。この操作は取り消せません。
          </p>
        )}
      </Modal>
    </div>
  )
}
