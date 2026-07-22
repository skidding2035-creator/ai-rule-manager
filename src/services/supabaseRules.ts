import type {
  AIPlatformId,
  Category,
  PendingRevision,
  Rule,
  RulePriority,
  RuleVersionEntry,
  RuleStatus,
  StatusHistoryEntry,
} from '@/types'
import { supabase } from '@/lib/supabaseClient'
import { formatRelativeTime } from '@/lib/relativeTime'
import { mockDashboardSummary } from '@/mock/dashboardSummary'
import { notifyRuleChanges } from '@/mock/rules'
import { getActiveProjectId } from '@/mock/projects'
import { computeCategoryStats, computeRuleKpis, filterForActiveProject } from '@/lib/ruleStats'
import { supabaseCategoryService } from './supabaseCategories'
import { supabaseSettingsService } from './supabaseSettings'
import type { RuleService } from './rules'

// These service functions only ever run once VITE_USE_SUPABASE=true, which is
// only meaningful once VITE_SUPABASE_URL/ANON_KEY are set too (see
// src/lib/supabaseClient.ts) — `supabase` is guaranteed non-null at that point.

interface RuleRow {
  id: string
  code: string
  title: string
  content: string
  version: string
  status: RuleStatus
  category_id: string
  project_id: string | null
  priority: RulePriority
  tags: string[]
  ai_platforms: AIPlatformId[]
  updated_at: string
}

function rowToRule(row: RuleRow): Rule {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    content: row.content,
    version: row.version,
    status: row.status,
    categoryId: row.category_id,
    projectId: row.project_id,
    updatedAt: formatRelativeTime(row.updated_at),
    priority: row.priority,
    tags: row.tags,
    aiPlatforms: row.ai_platforms,
  }
}

interface VersionRow {
  id: string
  rule_id: string
  version: string
  content: string
  status: RuleStatus
  changed_by: string
  comment: string
  created_at: string
}

function rowToVersion(row: VersionRow): RuleVersionEntry {
  return {
    id: row.id,
    version: row.version,
    content: row.content,
    status: row.status,
    changedBy: row.changed_by,
    comment: row.comment,
    timestamp: formatRelativeTime(row.created_at),
  }
}

async function fetchProjectRules(): Promise<Rule[]> {
  const { data, error } = await supabase!.from('rules').select('*').order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return filterForActiveProject(data.map(rowToRule), getActiveProjectId())
}

async function fetchCategories(): Promise<Category[]> {
  return supabaseCategoryService.getCategories()
}

async function fetchAllHistory(): Promise<StatusHistoryEntry[]> {
  const [projectRules, categories] = await Promise.all([fetchProjectRules(), fetchCategories()])
  const ruleIds = projectRules.map((r) => r.id)
  if (ruleIds.length === 0) return []

  const { data, error } = await supabase!
    .from('rule_versions')
    .select('id, rule_id, version, content, status, changed_by, comment, created_at')
    .in('rule_id', ruleIds)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  const ruleById = new Map(projectRules.map((r) => [r.id, r]))
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]))
  return data.map((row) => {
    const rule = ruleById.get(row.rule_id)
    return {
      id: row.id,
      ruleId: row.rule_id,
      timestamp: formatRelativeTime(row.created_at),
      status: row.status,
      ruleName: rule?.title ?? row.rule_id,
      category: rule ? (categoryNameById.get(rule.categoryId) ?? rule.categoryId) : '',
      changedBy: row.changed_by,
      comment: row.comment,
    }
  })
}

// A rule's most recent rule_versions row being "pending_approval" while the
// rule itself is still "active" is exactly what propose_rule_update (the MCP
// server's fact-check flow) produces: it inserts a new version row without
// touching the rule's own content/status, so the rule keeps serving its
// current content to every AI platform until a human approves or rejects it.
async function fetchPendingRevisions(): Promise<PendingRevision[]> {
  const projectRules = await fetchProjectRules()
  const activeRules = projectRules.filter((r) => r.status === 'active')
  if (activeRules.length === 0) return []

  const { data, error } = await supabase!
    .from('rule_versions')
    .select('*')
    .in(
      'rule_id',
      activeRules.map((r) => r.id),
    )
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  const ruleById = new Map(activeRules.map((r) => [r.id, r]))
  const seenRuleIds = new Set<string>()
  const result: PendingRevision[] = []
  for (const row of data as VersionRow[]) {
    if (seenRuleIds.has(row.rule_id)) continue // only the latest version per rule matters
    seenRuleIds.add(row.rule_id)
    if (row.status !== 'pending_approval') continue
    const rule = ruleById.get(row.rule_id)
    if (rule) result.push({ rule, revision: rowToVersion(row) })
  }
  return result
}

export const supabaseRuleService: RuleService = {
  getDashboardSummary: async () => {
    const [projectRules, categories, allHistory, pendingRevisions, aiConnections] = await Promise.all([
      fetchProjectRules(),
      fetchCategories(),
      fetchAllHistory(),
      fetchPendingRevisions(),
      supabaseSettingsService.getAIConnections(),
    ])
    return {
      ...mockDashboardSummary,
      kpis: {
        ...mockDashboardSummary.kpis,
        ...computeRuleKpis(projectRules),
        pendingApproval: projectRules.filter((r) => r.status === 'pending_approval').length + pendingRevisions.length,
        categoryCount: categories.length,
      },
      categories: computeCategoryStats(projectRules, categories),
      recentUpdates: projectRules.slice(0, 5),
      statusHistory: allHistory.slice(0, 5),
      aiConnections,
    }
  },
  getRules: () => fetchProjectRules(),
  getRuleById: async (id) => {
    const { data, error } = await supabase!.from('rules').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? rowToRule(data) : undefined
  },
  getRuleVersions: async (id) => {
    const { data, error } = await supabase!
      .from('rule_versions')
      .select('*')
      .eq('rule_id', id)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map(rowToVersion)
  },
  updateRuleStatus: async (id, status) => {
    const { data, error } = await supabase!
      .from('rules')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return undefined

    const { data: latestVersion } = await supabase!
      .from('rule_versions')
      .select('id')
      .eq('rule_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (latestVersion) {
      await supabase!.from('rule_versions').update({ status }).eq('id', latestVersion.id)
    }

    notifyRuleChanges()
    return rowToRule(data)
  },
  updateRuleContent: async (id, input) => {
    const nowIso = new Date().toISOString()
    const { data, error } = await supabase!
      .from('rules')
      .update({ version: input.version, content: input.content, status: input.status, updated_at: nowIso })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return undefined

    const { error: versionError } = await supabase!.from('rule_versions').insert({
      rule_id: id,
      version: input.version,
      content: input.content,
      status: input.status,
      changed_by: 'ユーザーA',
      comment: input.comment,
      created_at: nowIso,
    })
    if (versionError) throw new Error(versionError.message)

    notifyRuleChanges()
    return rowToRule(data)
  },
  deleteRule: async (id) => {
    const { error } = await supabase!.from('rules').delete().eq('id', id)
    if (error) throw new Error(error.message)
    notifyRuleChanges()
  },
  createRule: async (input) => {
    const nowIso = new Date().toISOString()
    const { data, error } = await supabase!
      .from('rules')
      .insert({
        code: input.code,
        title: input.title,
        content: input.content,
        version: 'v1.0',
        status: 'active',
        category_id: input.categoryId,
        project_id: input.projectId,
        priority: input.priority,
        tags: input.tags,
        ai_platforms: input.aiPlatforms,
        updated_at: nowIso,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)

    const { error: versionError } = await supabase!.from('rule_versions').insert({
      rule_id: data.id,
      version: 'v1.0',
      content: input.content,
      status: 'active',
      changed_by: 'ユーザーA',
      comment: '初期登録',
      created_at: nowIso,
    })
    if (versionError) throw new Error(versionError.message)

    notifyRuleChanges()
    return rowToRule(data)
  },
  getAllHistory: () => fetchAllHistory(),
  getPendingRevisions: () => fetchPendingRevisions(),
  approveRevision: async (revisionId) => {
    const { data: revisionRow, error: revisionError } = await supabase!
      .from('rule_versions')
      .select('*')
      .eq('id', revisionId)
      .maybeSingle()
    if (revisionError) throw new Error(revisionError.message)
    if (!revisionRow) return undefined

    const nowIso = new Date().toISOString()
    const { data, error } = await supabase!
      .from('rules')
      .update({ version: revisionRow.version, content: revisionRow.content, updated_at: nowIso })
      .eq('id', revisionRow.rule_id)
      .select()
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return undefined

    const { error: statusError } = await supabase!.from('rule_versions').update({ status: 'active' }).eq('id', revisionId)
    if (statusError) throw new Error(statusError.message)

    notifyRuleChanges()
    return rowToRule(data)
  },
  rejectRevision: async (revisionId) => {
    const { error } = await supabase!.from('rule_versions').update({ status: 'rejected' }).eq('id', revisionId)
    if (error) throw new Error(error.message)
    notifyRuleChanges()
  },
}
