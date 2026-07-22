import type { Category, Project, Rule, RuleVersionEntry } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { PriorityPill } from '@/components/ui/PriorityPill'
import { dotClasses, aiPlatformLabels } from '@/lib/colors'

interface ApprovalReviewModalProps {
  rule: Rule | null
  category: Category | undefined
  project?: Project | null
  // When set, this is a review of an AI-proposed content revision (e.g. from
  // the MCP server's propose_rule_update fact-check flow) rather than a
  // brand-new rule — `rule` keeps its current, still-active content, and
  // `revision` is what's being reviewed for adoption.
  revision?: RuleVersionEntry | null
  onClose: () => void
  onApprove: () => void
  onReviseMore?: () => void
  onDiscard: () => void
}

export function ApprovalReviewModal({
  rule,
  category,
  project,
  revision,
  onClose,
  onApprove,
  onReviseMore,
  onDiscard,
}: ApprovalReviewModalProps) {
  return (
    <Modal
      open={rule !== null}
      onClose={onClose}
      title={revision ? 'AIによる修正提案の確認' : '登録内容の確認'}
      className="max-w-xl"
      footer={
        <>
          <button
            onClick={onDiscard}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200"
          >
            {revision ? '却下(現在の内容を維持)' : '③ 登録しない'}
          </button>
          {onReviseMore && (
            <button
              onClick={onReviseMore}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-gray-300 hover:border-gray-600"
            >
              ② 修正してから登録
            </button>
          )}
          <button
            onClick={onApprove}
            className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            {revision ? '承認して反映' : '① 承認して登録'}
          </button>
        </>
      }
    >
      {rule && (
        <div className="space-y-4">
          <div>
            <p className="text-lg font-semibold text-gray-100">
              {rule.code} {rule.title}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-400">
              <span className={`h-2 w-2 rounded-full ${dotClasses[category?.color ?? 'gray']}`} />
              {category?.name ?? rule.categoryId} ・ {revision ? `${rule.version} → ${revision.version}` : rule.version}
              {project !== undefined && <> ・ {project ? project.name : '共通'}</>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PriorityPill priority={rule.priority} />
            {rule.aiPlatforms.map((ai) => (
              <span key={ai} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-gray-300">
                {aiPlatformLabels[ai]}
              </span>
            ))}
          </div>

          {revision ? (
            <>
              {revision.comment && (
                <p className="text-sm text-gray-400">
                  <span className="text-gray-500">提案理由: </span>
                  {revision.comment}
                </p>
              )}
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">現在の内容</p>
                <div className="whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-sm text-gray-500 line-through decoration-gray-600">
                  {rule.content}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-accent-blue">AIによる修正案</p>
                <div className="whitespace-pre-wrap rounded-lg border border-accent-blue/40 bg-accent-blue/5 p-3 text-sm text-gray-200">
                  {revision.content}
                </div>
              </div>
            </>
          ) : (
            <div>
              <p className="mb-2 text-xs font-medium text-gray-500">ルール内容</p>
              <div className="whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-sm text-gray-300">
                {rule.content}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
