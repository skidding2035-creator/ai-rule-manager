import type { ActivityMetric } from '@/types'

export const todayActivity: ActivityMetric[] = [
  { key: 'added', label: '追加', value: 18, delta: 4, color: 'blue' },
  { key: 'modified', label: '修正', value: 24, delta: 2, color: 'green' },
  { key: 'stopped', label: '停止', value: 3, delta: 0, color: 'orange' },
  { key: 'deleted', label: '削除', value: 2, delta: 1, color: 'red' },
]
