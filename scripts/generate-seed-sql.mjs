// Generates supabase/seed.sql from the app's current mock data, so the real
// database starts out equivalent to the mock-data demo. The mock rules/categories/
// projects/aiConnections arrays here are kept in sync with src/mock/*.ts by hand
// (this is a one-time/occasional migration tool, not part of the running app) —
// re-run `node scripts/generate-seed-sql.mjs` after updating the mock data if you
// want to regenerate the seed with the same values.
//
// Rule version history is synthesized the same way src/mock/ruleVersions.ts does
// at runtime (one entry per minor version step), but here every entry gets a real
// timestamptz instead of a display string, since a real database should store
// real timestamps — the Supabase service layer formats these back into the same
// "20分前"-style Japanese relative-time strings the rest of the app already
// expects, so no other app code needs to change.

import { randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'

const categories = [
  { id: 'image', name: '画像生成', color: 'blue', codePrefix: 'IMG' },
  { id: 'writing', name: '文章作成', color: 'green', codePrefix: 'TXT' },
  { id: 'pdf', name: 'PDF・ドキュメント', color: 'purple', codePrefix: 'DOC' },
  { id: 'business', name: '業務・仕事', color: 'orange', codePrefix: 'BUS' },
  { id: 'ops', name: '運用・管理', color: 'teal', codePrefix: 'OPS' },
  { id: 'other', name: 'その他', color: 'gray', codePrefix: 'OTH' },
]

const projects = [
  { id: 'gworks', name: 'G-Works', color: 'blue' },
  { id: 'rpg', name: 'RPG制作', color: 'purple' },
  { id: 'personal', name: '個人相談', color: 'teal' },
]

const aiConnections = [
  { id: 'chatgpt', name: 'ChatGPT', connected: true },
  { id: 'claude', name: 'Claude', connected: true },
  { id: 'gemini', name: 'Gemini', connected: false },
  { id: 'copilot', name: 'Copilot', connected: false },
]

const rules = [
  { id: 'r1', code: 'IMG-001', title: '確定表示優先', content: '画像生成時に複数案が出た場合は、確定表示された案を優先して以降の生成に反映すること。', version: 'v1.3', status: 'active', categoryId: 'image', updatedAt: '20分前', projectId: null, priority: 'high', tags: ['確定表示', '出力形式'], aiPlatforms: ['chatgpt', 'claude'] },
  { id: 'r2', code: 'DOC-001', title: 'PDF日本語フォント使用', content: 'PDF出力時は日本語文字化けを防ぐため、必ず日本語対応フォント(Noto Sans JP等)を指定して出力すること。', version: 'v2.1', status: 'draft', categoryId: 'pdf', updatedAt: '58分前', projectId: null, priority: 'medium', tags: ['フォント', '日本語'], aiPlatforms: ['chatgpt'] },
  { id: 'r3', code: 'TXT-001', title: '原文維持の添削ルール', content: '文章添削では原文の意図・文体を維持し、必要最小限の修正に留めること。大幅な書き換えは提案として別途示す。', version: 'v1.3', status: 'active', categoryId: 'writing', updatedAt: '1時間前', projectId: null, priority: 'high', tags: ['添削', '再発防止'], aiPlatforms: ['common'] },
  { id: 'r4', code: 'BUS-001', title: '業務質問は客観的に回答', content: '業務上の質問には主観的な意見を避け、根拠のある客観的な情報を優先して回答すること。', version: 'v1.5', status: 'stopped', categoryId: 'business', updatedAt: '1時間前', projectId: null, priority: 'medium', tags: ['トーン', '確認フロー'], aiPlatforms: ['claude'] },
  { id: 'r5', code: 'IMG-002', title: '比較画像生成時も適用', content: '複数画像を比較生成する場合も、確定表示優先ルール(IMG-001)を同様に適用すること。', version: 'v1.2', status: 'active', categoryId: 'image', updatedAt: '2時間前', projectId: null, priority: 'low', tags: ['画像品質'], aiPlatforms: ['chatgpt', 'gemini'] },
  { id: 'r6', code: 'IMG-003', title: '生成前に構図案を提示', content: '画像生成前に簡単な構図案(ラフ)を提示し、ユーザーの承認を得てから本生成に進むこと。', version: 'v1.0', status: 'pending_approval', categoryId: 'image', updatedAt: '3時間前', projectId: null, priority: 'medium', tags: ['構図', '確認フロー'], aiPlatforms: ['chatgpt'] },
  { id: 'r7', code: 'TXT-002', title: '語尾は「です・ます」調で統一', content: '文章生成では語尾を「です・ます」調に統一し、常体と敬体が混在しないようにすること。', version: 'v1.1', status: 'active', categoryId: 'writing', updatedAt: '4時間前', projectId: null, priority: 'low', tags: ['トーン', 'スタイル'], aiPlatforms: ['common'] },
  { id: 'r8', code: 'DOC-002', title: '見出しレベルの自動採番', content: 'ドキュメント生成時、見出しレベル(H1〜H3)に応じて章番号を自動採番すること。', version: 'v1.0', status: 'active', categoryId: 'pdf', updatedAt: '5時間前', projectId: null, priority: 'low', tags: ['出力形式'], aiPlatforms: ['chatgpt', 'copilot'] },
  { id: 'r9', code: 'OPS-001', title: 'API利用量を週次でレポート', content: '各AIプラットフォームのAPI利用量を週次で集計し、運用管理者にレポートすること。', version: 'v1.4', status: 'active', categoryId: 'ops', updatedAt: '8時間前', projectId: null, priority: 'medium', tags: ['レポート', '運用'], aiPlatforms: ['common'] },
  { id: 'r10', code: 'BUS-002', title: '社外秘情報は要約に含めない', content: '要約・議事録作成時、社外秘に分類される情報は要約本文に含めず、別途注意喚起すること。', version: 'v2.0', status: 'active', categoryId: 'business', updatedAt: '12時間前', projectId: null, priority: 'high', tags: ['セキュリティ', '要約'], aiPlatforms: ['common'] },
  { id: 'r11', code: 'IMG-004', title: '顔のアップは高解像度で出力', content: '人物の顔がアップになる構図では、通常より高い解像度設定で出力すること。', version: 'v1.1', status: 'active', categoryId: 'image', updatedAt: '1日前', projectId: null, priority: 'medium', tags: ['画像品質'], aiPlatforms: ['chatgpt', 'gemini'] },
  { id: 'r12', code: 'OTH-001', title: '個人的な相談では断定表現を避ける', content: '個人的な相談・雑談カテゴリでは断定的な言い切りを避け、「〜と考えられます」等の表現を用いること。', version: 'v1.2', status: 'active', categoryId: 'other', updatedAt: '1日前', projectId: null, priority: 'high', tags: ['トーン', '確認フロー'], aiPlatforms: ['claude'] },
  { id: 'r13', code: 'DOC-003', title: '機密文書には透かしを挿入', content: '機密指定された文書をPDF出力する際は、ページ全体に「社外秘」等の透かしを挿入すること。', version: 'v1.0', status: 'draft', categoryId: 'pdf', updatedAt: '2日前', projectId: null, priority: 'high', tags: ['セキュリティ'], aiPlatforms: ['copilot'] },
  { id: 'r14', code: 'TXT-003', title: '専門用語には注釈を付与', content: '専門用語・業界用語を使用する場合は、初出箇所に簡単な注釈(*印+脚注)を付与すること。', version: 'v1.0', status: 'pending_approval', categoryId: 'writing', updatedAt: '2日前', projectId: null, priority: 'low', tags: ['スタイル'], aiPlatforms: ['common'] },
  { id: 'r15', code: 'BUS-003', title: '見積回答は税抜表示を基本', content: '見積・金額に関する回答は税抜表示を基本とし、税込表示が必要な場合はその旨を明記すること。', version: 'v1.3', status: 'active', categoryId: 'business', updatedAt: '3日前', projectId: null, priority: 'medium', tags: ['出力形式'], aiPlatforms: ['chatgpt'] },
  { id: 'r16', code: 'OPS-002', title: '障害対応はエスカレーション手順に従う', content: 'システム障害を検知した場合は、定められたエスカレーション手順に従って報告・対応すること。', version: 'v1.6', status: 'active', categoryId: 'ops', updatedAt: '3日前', projectId: null, priority: 'high', tags: ['運用', '確認フロー'], aiPlatforms: ['common'] },
  { id: 'r17', code: 'IMG-005', title: '著作権保護対象を含めない', content: '実在の著作物・キャラクター等、著作権保護対象となる要素を画像生成に含めないこと。', version: 'v1.1', status: 'active', categoryId: 'image', updatedAt: '4日前', projectId: null, priority: 'high', tags: ['セキュリティ', '画像品質'], aiPlatforms: ['common'] },
  { id: 'r18', code: 'DOC-004', title: '表組みはMarkdown形式で出力', content: 'ドキュメント内の表組みはMarkdown形式(パイプ区切り)で出力し、後工程での変換を容易にすること。', version: 'v1.0', status: 'active', categoryId: 'pdf', updatedAt: '5日前', projectId: null, priority: 'low', tags: ['出力形式'], aiPlatforms: ['claude', 'copilot'] },
  { id: 'r19', code: 'TXT-004', title: '一文の長さを80文字以内に', content: '可読性向上のため、一文の長さは全角80文字以内を目安に区切ること。', version: 'v1.2', status: 'stopped', categoryId: 'writing', updatedAt: '6日前', projectId: null, priority: 'low', tags: ['スタイル'], aiPlatforms: ['chatgpt'] },
  { id: 'r20', code: 'BUS-004', title: 'メール文面は敬語レベルを統一', content: 'メール文面生成時は宛先の関係性に応じた敬語レベルを一文書内で統一すること。', version: 'v1.4', status: 'active', categoryId: 'business', updatedAt: '1週間前', projectId: null, priority: 'medium', tags: ['トーン'], aiPlatforms: ['common'] },
  { id: 'r21', code: 'OTH-002', title: '雑談時も敬体を維持', content: '雑談・カジュアルな会話であっても、基本的な敬体(です・ます調)は維持すること。', version: 'v1.0', status: 'active', categoryId: 'other', updatedAt: '1週間前', projectId: null, priority: 'low', tags: ['トーン'], aiPlatforms: ['gemini'] },
  { id: 'r22', code: 'OPS-003', title: 'ルール改定時は変更履歴を必須記載', content: '既存ルールを改定する際は、変更理由・変更内容をコメントとして必ず記載すること。', version: 'v2.2', status: 'active', categoryId: 'ops', updatedAt: '2週間前', projectId: null, priority: 'high', tags: ['運用', '再発防止'], aiPlatforms: ['common'] },
  { id: 'r23', code: 'IMG-006', title: '配色はブランドカラーに合わせる', content: 'ブランド関連の画像生成では、指定されたブランドカラーパレットに配色を合わせること。', version: 'v1.0', status: 'pending_approval', categoryId: 'image', updatedAt: '2週間前', projectId: null, priority: 'medium', tags: ['配色', '画像品質'], aiPlatforms: ['chatgpt'] },
  { id: 'r24', code: 'DOC-005', title: '引用元は脚注で明示', content: '外部情報を引用する場合は、引用元を脚注または参考文献として明示すること。', version: 'v1.1', status: 'active', categoryId: 'pdf', updatedAt: '3週間前', projectId: null, priority: 'medium', tags: ['引用', '出力形式'], aiPlatforms: ['claude'] },
  { id: 'r25', code: 'TXT-005', title: '未確認情報は推測である旨を明示', content: '裏付けの取れていない情報を含める場合は、「推測」「未確認」である旨を明示すること。', version: 'v1.3', status: 'active', categoryId: 'writing', updatedAt: '1ヶ月前', projectId: null, priority: 'high', tags: ['再発防止', '確認フロー'], aiPlatforms: ['common'] },
  { id: 'r26', code: 'BUS-005', title: '契約関連の質問は必ず注意書きを付与', content: '契約・法務に関わる質問への回答には、「法的助言ではない」旨の注意書きを必ず付与すること。', version: 'v1.7', status: 'active', categoryId: 'business', updatedAt: '1ヶ月前', projectId: null, priority: 'high', tags: ['セキュリティ', '確認フロー'], aiPlatforms: ['common'] },
  { id: 'r27', code: 'OPS-004', title: '未使用ルールは90日で自動アーカイブ候補に', content: '90日間適用実績のないルールは自動的にアーカイブ候補としてリストアップすること。', version: 'v1.0', status: 'draft', categoryId: 'ops', updatedAt: '2ヶ月前', projectId: null, priority: 'low', tags: ['運用'], aiPlatforms: ['common'] },
  { id: 'r28', code: 'OTH-003', title: '未確認の噂話には回答しない', content: '根拠のない噂話・未確認情報についての質問には、回答を控えその旨を伝えること。', version: 'v1.1', status: 'stopped', categoryId: 'other', updatedAt: '3ヶ月前', projectId: null, priority: 'medium', tags: ['確認フロー'], aiPlatforms: ['common'] },
]

const COMMENT_POOL = ['文言を調整', '誤検知を修正', '適用範囲を拡大', '運用チームのフィードバックを反映', '表現をより明確に']

function parseRelativeMinutes(label) {
  const m = label.match(/^(\d+)(分|時間|日|週間|ヶ月)前$/)
  if (!m) return 0
  const n = Number(m[1])
  const perUnit = { 分: 1, 時間: 60, 日: 60 * 24, 週間: 60 * 24 * 7, ヶ月: 60 * 24 * 30 }
  return n * perUnit[m[2]]
}

function esc(value) {
  return String(value).replace(/'/g, "''")
}

function sqlArray(values) {
  return `ARRAY[${values.map((v) => `'${esc(v)}'`).join(', ')}]`
}

const now = new Date()
const nowIso = now.toISOString()

const categoryIds = Object.fromEntries(categories.map((c) => [c.id, randomUUID()]))
const projectIds = Object.fromEntries(projects.map((p) => [p.id, randomUUID()]))
const ruleIds = Object.fromEntries(rules.map((r) => [r.id, randomUUID()]))

const lines = []
lines.push('-- Generated by scripts/generate-seed-sql.mjs — run after schema.sql.')
lines.push('')

lines.push('-- categories')
for (const c of categories) {
  lines.push(
    `insert into categories (id, name, color, code_prefix) values ('${categoryIds[c.id]}', '${esc(c.name)}', '${c.color}', '${esc(c.codePrefix)}');`,
  )
}
lines.push('')

lines.push('-- projects')
for (const p of projects) {
  lines.push(`insert into projects (id, name, color) values ('${projectIds[p.id]}', '${esc(p.name)}', '${p.color}');`)
}
lines.push('')

lines.push('-- ai_connections')
for (const a of aiConnections) {
  lines.push(`insert into ai_connections (id, name, connected) values ('${a.id}', '${esc(a.name)}', ${a.connected});`)
}
lines.push('')

lines.push('-- rules')
for (const r of rules) {
  const updatedAt = new Date(now.getTime() - parseRelativeMinutes(r.updatedAt) * 60000).toISOString()
  const projectSql = r.projectId ? `'${projectIds[r.projectId]}'` : 'null'
  lines.push(
    `insert into rules (id, code, title, content, version, status, category_id, project_id, priority, tags, ai_platforms, updated_at) values (` +
      `'${ruleIds[r.id]}', '${esc(r.code)}', '${esc(r.title)}', '${esc(r.content)}', '${esc(r.version)}', '${r.status}', ` +
      `'${categoryIds[r.categoryId]}', ${projectSql}, '${r.priority}', ${sqlArray(r.tags)}, ${sqlArray(r.aiPlatforms)}, '${updatedAt}');`,
  )
}
lines.push('')

lines.push('-- rule_versions')
const ONE_DAY_MS = 24 * 60 * 60 * 1000
for (const r of rules) {
  const match = r.version.match(/^v(\d+)\.(\d+)$/)
  const major = match ? Number(match[1]) : 1
  const minor = match ? Number(match[2]) : 0
  const currentUpdatedAt = new Date(now.getTime() - parseRelativeMinutes(r.updatedAt) * 60000)

  for (let i = 0; i <= minor; i++) {
    const isCurrent = i === minor
    const version = `v${major}.${i}`
    const status = isCurrent ? r.status : 'active'
    const comment = i === 0 ? '初期登録' : COMMENT_POOL[(i - 1) % COMMENT_POOL.length]
    const createdAt = isCurrent ? currentUpdatedAt : new Date(currentUpdatedAt.getTime() - (minor - i) * ONE_DAY_MS)
    lines.push(
      `insert into rule_versions (rule_id, version, content, status, changed_by, comment, created_at) values (` +
        `'${ruleIds[r.id]}', '${esc(version)}', '${esc(r.content)}', '${status}', 'ユーザーA', '${esc(comment)}', '${createdAt.toISOString()}');`,
    )
  }
}
lines.push('')

const output = lines.join('\n')
writeFileSync(new URL('../supabase/seed.sql', import.meta.url), output, 'utf8')
console.log(`Wrote supabase/seed.sql (${rules.length} rules, generated at ${nowIso})`)
