import type {
  AIPlatformId,
  DashboardSummary,
  PendingRevision,
  Rule,
  RulePriority,
  RuleVersionEntry,
  RuleStatus,
  StatusHistoryEntry,
} from '@/types'
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
  // Rules with an unresolved AI-proposed content revision (e.g. from the MCP
  // server's propose_rule_update / fact-check flow) — the rule itself keeps
  // serving its current content until one of these is approved or rejected.
  getPendingRevisions(): Promise<PendingRevision[]>
  approveRevision(revisionId: string): Promise<Rule | undefined>
  rejectRevision(revisionId: string): Promise<void>
}

// A rule's latest version entry being "pending_approval" while the rule
// itself is still "active" is exactly what propose_rule_update (MCP fact-check
// flow) and its Supabase counterpart produce — see supabaseRules.ts's
// getPendingRevisions for the live-data equivalent of this scan.
function pendingRevisionsFor(projectRules: Rule[]): PendingRevision[] {
  const result: PendingRevision[] = []
  for (const rule of projectRules) {
    if (rule.status !== 'active') continue
    const latest = (ruleVersionHistory[rule.id] ?? [])[0]
    if (latest && latest.status === 'pending_approval') result.push({ rule, revision: latest })
  }
  return result
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
            pendingApproval:
              projectRules.filter((r) => r.status === 'pending_approval').length + pendingRevisionsFor(projectRules).length,
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
            id: crypto.randomUUID(),
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
            id: crypto.randomUUID(),
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
  getPendingRevisions: () =>
    new Promise((resolve) =>
      setTimeout(() => resolve(pendingRevisionsFor(filterForActiveProject(rules, getActiveProjectId()))), 200),
    ),
  approveRevision: (revisionId) =>
    new Promise((resolve) =>
      setTimeout(() => {
        for (const rule of rules) {
          const revision = (ruleVersionHistory[rule.id] ?? []).find((v) => v.id === revisionId)
          if (revision) {
            rule.version = revision.version
            rule.content = revision.content
            rule.updatedAt = 'たった今'
            revision.status = 'active'
            notifyRuleChanges()
            resolve(rule)
            return
          }
        }
        resolve(undefined)
      }, 200),
    ),
  rejectRevision: (revisionId) =>
    new Promise((resolve) =>
      setTimeout(() => {
        for (const history of Object.values(ruleVersionHistory)) {
          const revision = history.find((v) => v.id === revisionId)
          if (revision) {
            revision.status = 'rejected'
            break
          }
        }
        notifyRuleChanges()
        resolve()
      }, 200),
    ),
}

export function getRuleService(): RuleService {
  return useSupabase() ? supabaseRuleService : mockRuleService
}
