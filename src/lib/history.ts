import type { Category, Rule, RuleVersionEntry, StatusHistoryEntry } from '@/types'

// Flattens every rule's version history into one list instead of a separate
// hand-authored "status history" dataset. Rules are already newest-first
// (see mock/rules.ts) and each rule's own version entries are newest-first
// too, so entries stay grouped per rule in that order — the relative-time
// strings ("20分前", "2回前の更新") aren't real Dates, so a true cross-rule
// chronological sort isn't honestly possible with this data.
export function getAllHistoryEntries(
  rules: Rule[],
  ruleVersionHistory: Record<string, RuleVersionEntry[]>,
  categories: Category[],
): StatusHistoryEntry[] {
  const entries: StatusHistoryEntry[] = []
  for (const rule of rules) {
    const categoryName = categories.find((c) => c.id === rule.categoryId)?.name ?? rule.categoryId
    const versions = ruleVersionHistory[rule.id] ?? []
    versions.forEach((version, index) => {
      entries.push({
        id: `${rule.id}-${index}`,
        ruleId: rule.id,
        timestamp: version.timestamp,
        status: version.status,
        ruleName: rule.title,
        category: categoryName,
        changedBy: version.changedBy,
        comment: version.comment,
      })
    })
  }
  return entries
}
