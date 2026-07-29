import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Check } from 'lucide-react'
import type { AccentColor, Category, Rule } from '@/types'
import { getCategoryService } from '@/services/categories'
import { getRuleService } from '@/services/rules'
import { ALL_ACCENT_COLORS } from '@/mock/categories'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { dotClasses, iconBadgeClasses } from '@/lib/colors'
import { computeCategoryStats } from '@/lib/ruleStats'
import { useDataRefreshTick } from '@/hooks/useDataRefresh'

interface FormState {
  mode: 'create' | 'edit'
  id?: string
  name: string
  color: AccentColor
  codePrefix: string
}

export function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [rules, setRules] = useState<Rule[] | null>(null)
  const [formState, setFormState] = useState<FormState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const refreshTick = useDataRefreshTick()

  useEffect(() => {
    let cancelled = false
    Promise.all([getCategoryService().getCategories(), getRuleService().getRules()]).then(([cats, ruleList]) => {
      if (cancelled) return
      setCategories(cats)
      setRules(ruleList)
    })
    return () => {
      cancelled = true
    }
  }, [refreshTick])

  const stats = useMemo(() => {
    if (!categories || !rules) return null
    return computeCategoryStats(rules, categories)
  }, [categories, rules])

  const openCreateForm = () => setFormState({ mode: 'create', name: '', color: 'blue', codePrefix: '' })
  const openEditForm = (category: Category) =>
    setFormState({
      mode: 'edit',
      id: category.id,
      name: category.name,
      color: category.color,
      codePrefix: category.codePrefix,
    })
  const closeForm = () => setFormState(null)

  // The mock service mutates the same shared `categories` array this page's
  // local state was seeded from, so appending/mapping the service's return
  // value on top of local state would double up (see the identical bug fixed
  // in SettingsPage's connection toggle) — refetch instead, it's simplest.
  const refreshCategories = () => {
    getCategoryService()
      .getCategories()
      .then((cats) => setCategories([...cats]))
  }

  const submitForm = () => {
    if (!formState || !formState.name.trim() || !formState.codePrefix.trim()) return
    const input = {
      name: formState.name.trim(),
      color: formState.color,
      codePrefix: formState.codePrefix.trim().toUpperCase(),
    }
    if (formState.mode === 'create') {
      getCategoryService().createCategory(input).then(refreshCategories)
    } else if (formState.id) {
      getCategoryService().updateCategory(formState.id, input).then(refreshCategories)
    }
    closeForm()
  }

  const openDeleteConfirm = (category: Category) => {
    setDeleteTarget(category)
    setDeleteError(null)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const id = deleteTarget.id
    getCategoryService()
      .deleteCategory(id)
      .then((result) => {
        if (result.success) {
          refreshCategories()
          setDeleteTarget(null)
        } else {
          setDeleteError(result.reason ?? 'このカテゴリは削除できません。')
        }
      })
  }

  return (
    <div className="pb-8">
      <TopBar
        title="カテゴリ"
        subtitle="ルールを分類するカテゴリを管理できます"
        right={
          <button
            onClick={openCreateForm}
            className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            新規カテゴリ
          </button>
        }
      />

      <div className="px-8 pt-6">
        <Card>
          {!stats ? (
            <p className="py-12 text-center text-sm text-gray-500">読み込み中...</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.map((cat) => (
                <li key={cat.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 shrink-0 rounded-full ${dotClasses[cat.color]}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-200">
                        {cat.name} <span className="text-gray-500">({cat.codePrefix}-)</span>
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {cat.ruleCount}件 ({cat.percentage}%)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditForm(cat)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-gray-200"
                      aria-label={`${cat.name}を編集`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(cat)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-accent-red"
                      aria-label={`${cat.name}を削除`}
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
        open={formState !== null}
        onClose={closeForm}
        title={formState?.mode === 'create' ? '新規カテゴリ' : 'カテゴリを編集'}
        footer={
          <>
            <button onClick={closeForm} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200">
              キャンセル
            </button>
            <button
              onClick={submitForm}
              disabled={!formState?.name.trim() || !formState?.codePrefix.trim()}
              className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {formState?.mode === 'create' ? '作成する' : '保存する'}
            </button>
          </>
        }
      >
        {formState && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">カテゴリ名</label>
              <input
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                placeholder="例: 動画生成"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-accent-blue"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">
                コード接頭辞(ルールコードの自動採番に使用されます)
              </label>
              <input
                value={formState.codePrefix}
                onChange={(e) => setFormState({ ...formState, codePrefix: e.target.value })}
                placeholder="例: VID"
                maxLength={6}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm uppercase text-gray-200 placeholder:text-gray-600 outline-none focus:border-accent-blue"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">カラー</label>
              <div className="flex flex-wrap gap-2">
                {ALL_ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormState({ ...formState, color })}
                    aria-label={color}
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${iconBadgeClasses[color]}`}
                  >
                    {formState.color === color && <Check className="h-4 w-4" />}
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
        title="カテゴリを削除しますか？"
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
                onClick={confirmDelete}
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
