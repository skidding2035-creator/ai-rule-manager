import type { AIPlatformId, Category, CategoryStat, Rule, RulePriority, RuleStatus } from '@/types'
import { statusLabels, priorityLabels, aiPlatformLabels } from './colors'

// Exported so other places that need this same fixed rank (e.g. table column
// sorting) stay in sync with the counts/donuts built from it here.
export const STATUS_ORDER: RuleStatus[] = ['active', 'draft', 'pending_approval', 'stopped', 'rejected']
export const PRIORITY_ORDER: RulePriority[] = ['high', 'medium', 'low']
const PLATFORM_ORDER: AIPlatformId[] = ['chatgpt', 'claude', 'gemini', 'copilot', 'common']

export interface StatusCount {
  status: RuleStatus
  label: string
  count: number
}

export interface PriorityCount {
  priority: RulePriority
  label: string
  count: number
}

export interface PlatformCount {
  id: AIPlatformId
  label: string
  count: number
}

export interface CategoryBreakdown {
  category: Category
  total: number
  byStatus: Record<RuleStatus, number>
}

export function countByStatus(rules: Rule[]): StatusCount[] {
  return STATUS_ORDER.map((status) => ({
    status,
    label: statusLabels[status],
    count: rules.filter((r) => r.status === status).length,
  }))
}

export function countByPriority(rules: Rule[]): PriorityCount[] {
  return PRIORITY_ORDER.map((priority) => ({
    priority,
    label: priorityLabels[priority],
    count: rules.filter((r) => r.priority === priority).length,
  }))
}

export function countByPlatform(rules: Rule[]): PlatformCount[] {
  return PLATFORM_ORDER.map((id) => ({
    id,
    label: aiPlatformLabels[id],
    count: rules.filter((r) => r.aiPlatforms.includes(id)).length,
  }))
}

export function computeCategoryStats(rules: Rule[], categories: Category[]): CategoryStat[] {
  const total = rules.length
  return categories.map((category) => {
    const ruleCount = rules.filter((r) => r.categoryId === category.id).length
    return { ...category, ruleCount, percentage: total ? Math.round((ruleCount / total) * 100) : 0 }
  })
}

// Auto-numbers a new rule's code from its category's prefix, e.g. 画像生成 (IMG)
// with existing IMG-001..IMG-006 -> "IMG-007". Scans existing codes rather than
// counting rules, so a code survives gaps left by deleted rules.
export function getNextRuleCode(categoryId: string, categories: Category[], rules: Rule[]): string {
  const category = categories.find((c) => c.id === categoryId)
  const prefix = category?.codePrefix ?? 'GEN'
  const existingNumbers = rules
    .filter((r) => r.categoryId === categoryId)
    .map((r) => {
      const match = r.code.match(/-(\d+)$/)
      return match ? Number(match[1]) : 0
    })
  const next = (existingNumbers.length ? Math.max(...existingNumbers) : 0) + 1
  return `${prefix}-${String(next).padStart(3, '0')}`
}

// Rules with projectId === null are shared across every project; everything
// else only shows up while its own project is active.
export function filterForActiveProject(rules: Rule[], activeProjectId: string): Rule[] {
  return rules.filter((r) => r.projectId === null || r.projectId === activeProjectId)
}

export interface RuleKpis {
  totalRules: number
  activeRules: number
  activeRate: number
}

// Replaces the dashboard's old hardcoded 312/256/80.3% placeholders with
// numbers derived from the rules actually visible in the active project scope.
export function computeRuleKpis(rules: Rule[]): RuleKpis {
  const totalRules = rules.length
  const activeRules = rules.filter((r) => r.status === 'active').length
  const activeRate = totalRules ? Math.round((activeRules / totalRules) * 1000) / 10 : 0
  return { totalRules, activeRules, activeRate }
}

export function countByCategory(rules: Rule[], categories: Category[]): CategoryBreakdown[] {
  return categories.map((category) => {
    const categoryRules = rules.filter((r) => r.categoryId === category.id)
    const byStatus = STATUS_ORDER.reduce(
      (acc, status) => {
        acc[status] = categoryRules.filter((r) => r.status === status).length
        return acc
      },
      {} as Record<RuleStatus, number>,
    )
    return { category, total: categoryRules.length, byStatus }
  })
}
