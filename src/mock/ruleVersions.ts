import type { Rule, RuleVersionEntry } from '@/types'
import { rules } from './rules'

const COMMENT_POOL = ['文言を調整', '誤検知を修正', '適用範囲を拡大', '運用チームのフィードバックを反映', '表現をより明確に']

// Synthesizes a plausible version history from the rule's current version number
// (e.g. v2.1 -> v2.0, v2.1) rather than hand-authoring history for all 28 rules.
// Historical entries reuse the rule's current content as a stand-in snapshot —
// only the version/comment/author/timestamp metadata is meant to be realistic.
function buildVersionHistory(rule: Rule): RuleVersionEntry[] {
  const match = rule.version.match(/^v(\d+)\.(\d+)$/)
  const major = match ? Number(match[1]) : 1
  const minor = match ? Number(match[2]) : 0

  const entries: RuleVersionEntry[] = []
  for (let i = 0; i <= minor; i++) {
    const isCurrent = i === minor
    entries.push({
      id: `${rule.id}-v${major}.${i}`,
      version: `v${major}.${i}`,
      content: rule.content,
      status: isCurrent ? rule.status : 'active',
      changedBy: 'ユーザーA',
      comment: i === 0 ? '初期登録' : COMMENT_POOL[(i - 1) % COMMENT_POOL.length],
      timestamp: isCurrent ? rule.updatedAt : `${minor - i + 1}回前の更新`,
    })
  }
  return entries.reverse()
}

export const ruleVersionHistory: Record<string, RuleVersionEntry[]> = Object.fromEntries(
  rules.map((rule) => [rule.id, buildVersionHistory(rule)]),
)
