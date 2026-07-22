export type RuleStatus = 'active' | 'draft' | 'pending_approval' | 'stopped' | 'rejected'

export type RulePriority = 'high' | 'medium' | 'low'

export type AIPlatformId = 'chatgpt' | 'claude' | 'gemini' | 'copilot' | 'common'

export type AccentColor = 'blue' | 'green' | 'orange' | 'purple' | 'teal' | 'red' | 'gray'

export interface Category {
  id: string
  name: string
  color: AccentColor
  codePrefix: string
}

export interface CategoryStat extends Category {
  ruleCount: number
  percentage: number
}

export interface Project {
  id: string
  name: string
  color: AccentColor
}

export interface Rule {
  id: string
  code: string
  title: string
  content: string
  version: string
  status: RuleStatus
  categoryId: string
  projectId: string | null
  updatedAt: string
  priority: RulePriority
  tags: string[]
  aiPlatforms: AIPlatformId[]
}

export interface RuleVersionEntry {
  id: string
  version: string
  content: string
  status: RuleStatus
  changedBy: string
  comment: string
  timestamp: string
}

// A rule_versions row with status "pending_approval" whose parent rule is
// still "active" — the rule keeps serving its current content to every AI
// platform until a human approves or rejects this proposed replacement.
// Created by the MCP server's propose_rule_update tool (AI fact-check flow).
export interface PendingRevision {
  rule: Rule
  revision: RuleVersionEntry
}

export interface StatusHistoryEntry {
  id: string
  ruleId: string
  timestamp: string
  status: RuleStatus
  ruleName: string
  category: string
  changedBy: string
  comment: string
}

export interface Announcement {
  id: string
  title: string
  description: string
  timestamp: string
  severity: 'info' | 'success' | 'warning'
}

export interface ActivityMetric {
  key: 'added' | 'modified' | 'stopped' | 'deleted'
  label: string
  value: number
  delta: number
  color: AccentColor
}

export interface QualityScore {
  score: number
  label: string
  weeklyImprovementCount: number
}

export interface AIConnection {
  id: string
  name: 'ChatGPT' | 'Claude' | 'Gemini' | 'Copilot'
  connected: boolean
}

export interface SyncStatus {
  lastSyncedAt: string
  supabase: 'ok' | 'error'
  mcpServer: 'ok' | 'error'
}

export interface ApprovalFlowStep {
  step: number
  label: string
  meta: string
  state: 'done' | 'current' | 'upcoming'
}

export interface DashboardSummary {
  kpis: {
    totalRules: number
    activeRules: number
    activeRate: number
    pendingApproval: number
    categoryCount: number
  }
  lastUpdated: string
  qualityScore: QualityScore
  categories: CategoryStat[]
  recentUpdates: Rule[]
  todayActivity: ActivityMetric[]
  approvalFlow: ApprovalFlowStep[]
  statusHistory: StatusHistoryEntry[]
  announcements: Announcement[]
  aiConnections: AIConnection[]
  syncStatus: SyncStatus
}
