import type { Announcement } from '@/types'

export const announcements: Announcement[] = [
  {
    id: 'a1',
    title: 'システムメンテナンスのお知らせ',
    description: '2024/07/22 02:00 - 04:00 にメンテナンスを実施します。',
    timestamp: '2日前',
    severity: 'info',
  },
  {
    id: 'a2',
    title: 'ルールテンプレートを追加しました',
    description: '画像生成品質向上ルールテンプレートを追加しました。',
    timestamp: '3日前',
    severity: 'success',
  },
  {
    id: 'a3',
    title: 'AIモデル連携を強化',
    description: 'Claude 3.5との連携精度が向上しました。',
    timestamp: '5日前',
    severity: 'warning',
  },
]
