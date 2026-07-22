import type { DashboardSummary } from '@/types'
import { categories } from './categories'
import { rules, recentUpdates } from './rules'
import { ruleVersionHistory } from './ruleVersions'
import { announcements } from './announcements'
import { todayActivity } from './activity'
import { approvalFlow } from './approvalFlow'
import { aiConnections } from './aiConnections'
import { syncStatus } from './syncStatus'
import { computeCategoryStats, computeRuleKpis } from '@/lib/ruleStats'
import { getAllHistoryEntries } from '@/lib/history'

export const mockDashboardSummary: DashboardSummary = {
  kpis: {
    ...computeRuleKpis(rules),
    pendingApproval: rules.filter((r) => r.status === 'pending_approval').length,
    categoryCount: categories.length,
  },
  lastUpdated: '2024/07/20 15:30:22',
  qualityScore: {
    score: 97.8,
    label: 'Excellent',
    weeklyImprovementCount: 12,
  },
  categories: computeCategoryStats(rules, categories),
  recentUpdates,
  todayActivity,
  approvalFlow,
  statusHistory: getAllHistoryEntries(rules, ruleVersionHistory, categories).slice(0, 5),
  announcements,
  aiConnections,
  syncStatus,
}
