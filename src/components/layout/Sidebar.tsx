import { useEffect, useState, useSyncExternalStore } from 'react'
import { NavLink } from 'react-router-dom'
import { Hexagon, ChevronDown, Check, Plus } from 'lucide-react'
import clsx from 'clsx'
import { navConfig } from '@/routes/navConfig'
import { subscribeToConnectionChanges } from '@/mock/aiConnections'
import { syncStatus } from '@/mock/syncStatus'
import { subscribeToRuleChanges } from '@/mock/rules'
import { ALL_ACCENT_COLORS } from '@/mock/categories'
import { subscribeToProjectChanges } from '@/mock/projects'
import { getRuleService } from '@/services/rules'
import { getSettingsService } from '@/services/settings'
import { getProjectService } from '@/services/projects'
import { Modal } from '@/components/ui/Modal'
import { dotClasses, iconBadgeClasses } from '@/lib/colors'
import { signOut } from '@/lib/auth'
import { useSupabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import type { AccentColor, AIConnection, Project } from '@/types'

export function Sidebar() {
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<AccentColor>('blue')

  const [pendingApprovalCount, setPendingApprovalCount] = useState(0)
  const [connections, setConnections] = useState<AIConnection[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  // Each of these fetches through the service layer (rather than reading a
  // mutated-in-place mock array directly) so this keeps working once the
  // backend is Supabase — where data can't be read synchronously. The
  // existing pub/sub buses fire regardless of backend (the service mutation
  // methods call notify*Changes()), so this still updates live within a
  // session.
  useEffect(() => {
    let cancelled = false
    const refresh = () =>
      getRuleService()
        .getRules()
        .then((rs) => {
          if (!cancelled) setPendingApprovalCount(rs.filter((r) => r.status === 'pending_approval').length)
        })
    refresh()
    const unsubscribe = subscribeToRuleChanges(refresh)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const refresh = () =>
      getSettingsService()
        .getAIConnections()
        .then((conns) => {
          if (!cancelled) setConnections(conns)
        })
    refresh()
    const unsubscribe = subscribeToConnectionChanges(refresh)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const refresh = () =>
      getProjectService()
        .getProjects()
        .then((list) => {
          if (!cancelled) setProjects(list)
        })
    refresh()
    const unsubscribe = subscribeToProjectChanges(refresh)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const activeProjectId = useSyncExternalStore(
    getProjectService().subscribeToActiveProject,
    getProjectService().getActiveProjectId,
  )
  const activeProject = projects.find((p) => p.id === activeProjectId)

  const { session } = useAuth()
  const userLabel = useSupabase() && session?.user.email ? session.user.email : 'ユーザーA'
  const handleSignOut = () => {
    if (useSupabase()) signOut()
  }

  const selectProject = (id: string) => {
    getProjectService().setActiveProjectId(id)
    setSwitcherOpen(false)
  }

  const openCreateModal = () => {
    setSwitcherOpen(false)
    setNewName('')
    setNewColor('blue')
    setCreateOpen(true)
  }

  const submitCreate = () => {
    if (!newName.trim()) return
    getProjectService()
      .createProject({ name: newName.trim(), color: newColor })
      .then((created) => getProjectService().setActiveProjectId(created.id))
    setCreateOpen(false)
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple text-white">
          <Hexagon className="h-5 w-5" fill="currentColor" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">AI Rule Manager</p>
          <p className="text-[10px] tracking-wide text-gray-500">AI OPERATING SYSTEM</p>
        </div>
      </div>

      <div className="relative px-3 pb-3">
        <button
          onClick={() => setSwitcherOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:border-gray-600"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${dotClasses[activeProject?.color ?? 'gray']}`} />
            <span className="truncate text-gray-200">{activeProject?.name ?? 'プロジェクトを選択'}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
        </button>

        {switcherOpen && (
          <div className="absolute left-3 right-3 top-full z-10 mt-1 rounded-lg border border-border bg-card py-1 shadow-lg">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => selectProject(p.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${dotClasses[p.color]}`} />
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                {p.id === activeProjectId && <Check className="h-3.5 w-3.5 shrink-0 text-accent-blue" />}
              </button>
            ))}
            <div className="my-1 border-t border-border" />
            <button
              onClick={openCreateModal}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-accent-blue hover:bg-white/5"
            >
              <Plus className="h-3.5 w-3.5" />
              新規プロジェクト
            </button>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {navConfig.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent-blue/15 text-accent-blue'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200',
                  )
                }
              >
                <span className="flex items-center gap-3">
                  <item.icon className="h-4.5 w-4.5" />
                  {item.label}
                </span>
                {item.path === '/approvals'
                  ? pendingApprovalCount > 0 && (
                      <span className="rounded-full bg-accent-orange px-1.5 py-0.5 text-[10px] font-semibold text-background">
                        {pendingApprovalCount}
                      </span>
                    )
                  : item.badge !== undefined && (
                      <span className="rounded-full bg-accent-orange px-1.5 py-0.5 text-[10px] font-semibold text-background">
                        {item.badge}
                      </span>
                    )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-6 px-3">
          <p className="mb-2 text-[11px] font-semibold tracking-wide text-gray-500">AI プラットフォーム</p>
          <ul className="space-y-2">
            {connections.map((conn) => (
              <li key={conn.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{conn.name}</span>
                <span
                  className={clsx(
                    'flex items-center gap-1.5 text-xs font-medium',
                    conn.connected ? 'text-accent-green' : 'text-gray-600',
                  )}
                >
                  <span
                    className={clsx('h-1.5 w-1.5 rounded-full', conn.connected ? 'bg-accent-green' : 'bg-gray-600')}
                  />
                  {conn.connected ? 'Connected' : 'OFF'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 px-3">
          <p className="mb-2 text-[11px] font-semibold tracking-wide text-gray-500">同期ステータス</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-gray-300">最終同期</span>
              <span className="text-gray-500">{syncStatus.lastSyncedAt}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-gray-300">Supabase</span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-accent-green">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
                正常
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-gray-300">MCP Server</span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-accent-green">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
                正常
              </span>
            </li>
          </ul>
        </div>
      </nav>

      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 border-t border-border px-5 py-4 text-left hover:bg-white/5"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-purple/20 text-sm font-semibold text-accent-purple">
          A
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-200">{userLabel}</p>
          <p className="text-xs text-gray-500">{useSupabase() ? 'ログアウト' : 'Admin'}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="新規プロジェクト"
        footer={
          <>
            <button
              onClick={() => setCreateOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200"
            >
              キャンセル
            </button>
            <button
              onClick={submitCreate}
              disabled={!newName.trim()}
              className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              作成する
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">プロジェクト名</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
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
                  onClick={() => setNewColor(color)}
                  aria-label={color}
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${iconBadgeClasses[color]}`}
                >
                  {newColor === color && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </aside>
  )
}
