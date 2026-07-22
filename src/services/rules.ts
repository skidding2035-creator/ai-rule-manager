import type { AIPlatformId, DashboardSummary, Rule, RulePriority, RuleVersionEntry, RuleStatus, StatusHistoryEntry } from '@/types'
import { mockDashboardSummary } from '@/mock/dashboardSummary'
import { rules, notifyRuleChanges } from '@/mock/rules'
import { ruleVersionHistory } from '@/mock/ruleVersions'
import { categories } from '@/mock/categories'
import { getActiveProjectId } from '@/mock/projects'
import { computeCategoryStats, computeRuleKpis, filterForActiveProject } from '@/lib/ruleStats'
import { getAllHistoryEntries } from '@/lib/history'
import { useSupabase } from '@/lib/supabaseClient'
import { supabaseRuleService } from './supabaseRules'

export interface NewRuleInput {
  code: string
  title: string
  content: string
  categoryId: string
  projectId: string | null
  priority: RulePriority
  tags: string[]
  aiPlatforms: AIPlatformId[]
}

export interface UpdateRuleContentInput {
  version: string
  content: string
  status: RuleStatus
  comment: string
}

export interface RuleService {
  getDashboardSummary(): Promise<DashboardSummary>
  getRules(): Promise<Rule[]>
  getRuleById(id: string): Promise<Rule | undefined>
  getRuleVersions(id: string): Promise<RuleVersionEntry[]>
  updateRuleStatus(id: string, status: RuleStatus): Promise<Rule | undefined>
  // Persists an edit or rollback as a new version-history entry, used by
  // RuleDetailPage's edit-confirm and rollback flows.
  updateRuleContent(id: string, input: UpdateRuleContentInput): Promise<Rule | undefined>
  deleteRule(id: string): Promise<void>
  createRule(input: NewRuleInput): Promise<Rule>
  getAllHistory(): Promise<StatusHistoryEntry[]>
}

export const mockRuleService: RuleService = {
  getDashboardSummary: () =>
    new Promise((resolve) =>
      setTimeout(() => {
        const projectRules = filterForActiveProject(rules, getActiveProjectId())
        resolve({
          ...mockDashboardSummary,
          kpis: {
            ...mockDashboardSummary.kpis,
            ...computeRuleKpis(projectRules),
            pendingApproval: projectRules.filter((r) => r.status === 'pending_approval').length,
            categoryCount: categories.length,
          },
          categories: computeCategoryStats(projectRules, categories),
          statusHistory: getAllHistoryEntries(projectRules, ruleVersionHistory, categories).slice(0, 5),
        })
      }, 200),
    ),
  getRules: () =>
    new Promise((resolve) => setTimeout(() => resolve(filterForActiveProject(rules, getActiveProjectId())), 200)),
  getRuleById: (id) =>
    new Promise((resolve) => setTimeout(() => resolve(rules.find((r) => r.id === id)), 200)),
  getRuleVersions: (id) =>
    new Promise((resolve) => setTimeout(() => resolve(ruleVersionHistory[id] ?? []), 200)),
  updateRuleStatus: (id, status) =>
    new Promise((resolve) =>
      setTimeout(() => {
        const rule = rules.find((r) => r.id === id)
        if (rule) {
          rule.status = status
          rule.updatedAt = 'たった今'
          const history = ruleVersionHistory[id]
          if (history?.[0]) history[0] = { ...history[0], status }
          notifyRuleChanges()
        }
        resolve(rule)
      }, 200),
    ),
  updateRuleContent: (id, input) =>
    new Promise((resolve) =>
      setTimeout(() => {
        const rule = rules.find((r) => r.id === id)
        if (rule) {
          rule.version = input.version
          rule.content = input.content
          rule.status = input.status
          rule.updatedAt = 'たった今'
          const history = ruleVersionHistory[id] ?? []
          history.unshift({
            version: input.version,
            content: input.content,
            status: input.status,
            changedBy: 'ユーザーA',
            comment: input.comment,
            timestamp: 'たった今',
          })
          ruleVersionHistory[id] = history
          notifyRuleChanges()
        }
        resolve(rule)
      }, 200),
    ),
  deleteRule: (id) =>
    new Promise((resolve) =>
      setTimeout(() => {
        const index = rules.findIndex((r) => r.id === id)
        if (index !== -1) rules.splice(index, 1)
        delete ruleVersionHistory[id]
        notifyRuleChanges()
        resolve()
      }, 200),
    ),
  createRule: (input) =>
    new Promise((resolve) =>
      setTimeout(() => {
        const rule: Rule = {
          id: crypto.randomUUID(),
          code: input.code,
          title: input.title,
          content: input.content,
          version: 'v1.0',
          status: 'active',
          categoryId: input.categoryId,
          projectId: input.projectId,
          updatedAt: 'たった今',
          priority: input.priority,
          tags: input.tags,
          aiPlatforms: input.aiPlatforms,
        }
        rules.unshift(rule)
        ruleVersionHistory[rule.id] = [
          {
            version: 'v1.0',
            content: input.content,
            status: 'active',
            changedBy: 'ユーザーA',
            comment: '初期登録',
            timestamp: 'たった今',
          },
        ]
        notifyRuleChanges()
        resolve(rule)
      }, 200),
    ),
  getAllHistory: () =>
    new Promise((resolve) =>
      setTimeout(() => {
        const projectRules = filterForActiveProject(rules, getActiveProjectId())
        resolve(getAllHistoryEntries(projectRules, ruleVersionHistory, categories))
      }, 200),
    ),
}

export function getRuleService(): RuleService {
  return useSupabase() ? supabaseRuleService : mockRuleService
}
