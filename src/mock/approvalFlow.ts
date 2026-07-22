import type { ApprovalFlowStep } from '@/types'

export const approvalFlow: ApprovalFlowStep[] = [
  { step: 1, label: 'ルール入力', meta: '入力中 12件', state: 'current' },
  { step: 2, label: '要約確認', meta: '確認待ち 8件', state: 'current' },
  { step: 3, label: '登録完了', meta: '登録済み 0件', state: 'upcoming' },
  { step: 4, label: '有効化', meta: '有効ルール 256件', state: 'done' },
]
