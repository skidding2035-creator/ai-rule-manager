import { supabase } from './supabaseClient.mjs'

const STATUS_LABELS = { active: '有効', draft: 'ドラフト', pending_approval: '承認待ち', stopped: '停止', rejected: '却下' }
const PLATFORM_VALUES = ['chatgpt', 'claude', 'gemini', 'copilot', 'common']

function rowToRuleSummary(row, categoryNameById, projectNameById) {
  return {
    code: row.code,
    title: row.title,
    content: row.content,
    version: row.version,
    status: row.status,
    statusLabel: STATUS_LABELS[row.status] ?? row.status,
    category: categoryNameById.get(row.category_id) ?? row.category_id,
    project: row.project_id ? (projectNameById.get(row.project_id) ?? row.project_id) : '共通(全プロジェクト共通)',
    priority: row.priority,
    tags: row.tags,
    aiPlatforms: row.ai_platforms,
    updatedAt: row.updated_at,
  }
}

async function fetchCategoryMaps() {
  const { data, error } = await supabase.from('categories').select('id, name, code_prefix')
  if (error) throw new Error(error.message)
  return {
    nameById: new Map(data.map((c) => [c.id, c.name])),
    idByName: new Map(data.map((c) => [c.name, c.id])),
    prefixById: new Map(data.map((c) => [c.id, c.code_prefix])),
    rows: data,
  }
}

async function fetchProjectMaps() {
  const { data, error } = await supabase.from('projects').select('id, name')
  if (error) throw new Error(error.message)
  return {
    nameById: new Map(data.map((p) => [p.id, p.name])),
    idByName: new Map(data.map((p) => [p.name, p.id])),
  }
}

export async function listCategories() {
  const { rows } = await fetchCategoryMaps()
  return rows.map((c) => ({ name: c.name, codePrefix: c.code_prefix }))
}

export async function listProjects() {
  const { nameById } = await fetchProjectMaps()
  return [...nameById.values()].map((name) => ({ name }))
}

export async function listRules({ platform, project, status = 'active' } = {}) {
  const { data, error } = await supabase
    .from('rules')
    .select('*')
    .eq('status', status)
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)

  const { nameById: categoryNameById } = await fetchCategoryMaps()
  const { nameById: projectNameById, idByName: projectIdByName } = await fetchProjectMaps()

  let rows = data
  if (platform) {
    rows = rows.filter((r) => r.ai_platforms.includes(platform) || r.ai_platforms.includes('common'))
  }
  if (project) {
    const projectId = projectIdByName.get(project)
    rows = rows.filter((r) => r.project_id === null || r.project_id === projectId)
  }

  return rows.map((r) => rowToRuleSummary(r, categoryNameById, projectNameById))
}

export async function getRule({ code }) {
  const { data: rule, error } = await supabase.from('rules').select('*').eq('code', code).maybeSingle()
  if (error) throw new Error(error.message)
  if (!rule) return null

  const { nameById: categoryNameById } = await fetchCategoryMaps()
  const { nameById: projectNameById } = await fetchProjectMaps()

  const { data: versions, error: versionsError } = await supabase
    .from('rule_versions')
    .select('version, content, status, changed_by, comment, created_at')
    .eq('rule_id', rule.id)
    .order('created_at', { ascending: false })
  if (versionsError) throw new Error(versionsError.message)

  return {
    ...rowToRuleSummary(rule, categoryNameById, projectNameById),
    versions: versions.map((v) => ({
      version: v.version,
      content: v.content,
      status: v.status,
      changedBy: v.changed_by,
      comment: v.comment,
      createdAt: v.created_at,
    })),
  }
}

// Same algorithm as src/pages/RuleDetailPage.tsx's bumpVersion: increment the
// minor version (v1.0 -> v1.1). Falls back to returning the version
// unchanged if it doesn't match the vX.Y pattern, same as the frontend.
function bumpVersion(version) {
  const match = version.match(/^v(\d+)\.(\d+)$/)
  if (!match) return version
  return `v${match[1]}.${Number(match[2]) + 1}`
}

// Same algorithm as src/lib/ruleStats.ts's getNextRuleCode: scan existing
// codes for this category's prefix, take the highest trailing number + 1.
async function nextRuleCode(categoryId, codePrefix) {
  const { data, error } = await supabase.from('rules').select('code').eq('category_id', categoryId)
  if (error) throw new Error(error.message)
  const numbers = data.map((r) => {
    const match = r.code.match(/-(\d+)$/)
    return match ? Number(match[1]) : 0
  })
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1
  return `${codePrefix}-${String(next).padStart(3, '0')}`
}

// Always inserts as pending_approval — an AI-proposed rule is never
// auto-activated. It must be approved by a human via the app's existing
// Approval Center, same as any other pending rule.
export async function proposeRule({ title, content, category, tags = [], platforms = ['common'], project }) {
  const { idByName: categoryIdByName, prefixById, rows: categoryRows } = await fetchCategoryMaps()
  const categoryId = categoryIdByName.get(category)
  if (!categoryId) {
    const available = categoryRows.map((c) => c.name).join(', ')
    throw new Error(`Unknown category "${category}". Call list_categories first — available: ${available}`)
  }

  let projectId = null
  if (project) {
    const { idByName: projectIdByName, nameById } = await fetchProjectMaps()
    projectId = projectIdByName.get(project) ?? null
    if (!projectId) {
      const available = [...nameById.values()].join(', ')
      throw new Error(
        `Unknown project "${project}". Call list_projects first, or omit project for a shared rule — available: ${available}`,
      )
    }
  }

  const invalidPlatforms = platforms.filter((p) => !PLATFORM_VALUES.includes(p))
  if (invalidPlatforms.length > 0) {
    throw new Error(`Invalid platform(s): ${invalidPlatforms.join(', ')}. Valid values: ${PLATFORM_VALUES.join(', ')}`)
  }

  const code = await nextRuleCode(categoryId, prefixById.get(categoryId))
  const nowIso = new Date().toISOString()

  const { data: rule, error } = await supabase
    .from('rules')
    .insert({
      code,
      title,
      content,
      version: 'v1.0',
      status: 'pending_approval',
      category_id: categoryId,
      project_id: projectId,
      priority: 'medium',
      tags,
      ai_platforms: platforms,
      updated_at: nowIso,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)

  const { error: versionError } = await supabase.from('rule_versions').insert({
    rule_id: rule.id,
    version: 'v1.0',
    content,
    status: 'pending_approval',
    changed_by: 'AI提案',
    comment: 'AIによる提案',
    created_at: nowIso,
  })
  if (versionError) throw new Error(versionError.message)

  return {
    code: rule.code,
    status: rule.status,
    message: `Proposed rule ${rule.code} — awaiting human approval in the Approval Center.`,
  }
}

// Proposes a corrected content for an EXISTING active rule (e.g. after
// fact-checking it) without touching the rule's live content — a new
// rule_versions row is inserted with status pending_approval, so the rule
// keeps serving its current, unmodified content to every AI platform via
// list_rules/get_rule until a human approves or rejects the change in the
// app's Approval Center. This is the update counterpart to proposeRule
// above, which only ever creates brand-new rules.
export async function proposeRuleUpdate({ code, content, comment = 'AIによるファクトチェック修正' }) {
  const { data: rule, error } = await supabase.from('rules').select('*').eq('code', code).maybeSingle()
  if (error) throw new Error(error.message)
  if (!rule) throw new Error(`No rule found with code "${code}". Call list_rules or get_rule first.`)
  if (rule.status !== 'active') {
    throw new Error(
      `Rule "${code}" is not active (status: ${rule.status}) — content updates can only be proposed for active rules.`,
    )
  }
  if (content === rule.content) {
    throw new Error('The proposed content is identical to the current content — nothing to update.')
  }

  const { data: latestVersion, error: latestError } = await supabase
    .from('rule_versions')
    .select('status')
    .eq('rule_id', rule.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (latestError) throw new Error(latestError.message)
  if (latestVersion?.status === 'pending_approval') {
    throw new Error(`Rule "${code}" already has a pending revision awaiting approval in the Approval Center.`)
  }

  const proposedVersion = bumpVersion(rule.version)
  const { error: versionError } = await supabase.from('rule_versions').insert({
    rule_id: rule.id,
    version: proposedVersion,
    content,
    status: 'pending_approval',
    changed_by: 'AI提案(ファクトチェック)',
    comment,
  })
  if (versionError) throw new Error(versionError.message)

  return {
    code: rule.code,
    currentVersion: rule.version,
    proposedVersion,
    message: `Proposed a content update for rule ${rule.code} (${rule.version} → ${proposedVersion}) — awaiting human approval in the Approval Center. The rule keeps serving its current content until then.`,
  }
}
